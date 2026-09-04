import { isValidJalaaliDate, toGregorian } from 'jalaali-js';
import { getDatabaseUserVersion, initDatabase, seedDatabase, setDatabaseUserVersion } from './db';
import type { OfficialHolidayData, SeedData, SeedJobGroupRecord, SeedSeniorityBaseByGroupRecord } from './types';

const seedVersion = 11;
let seedPromise: Promise<void> | null = null;

function loadSeniorityClassificationData(): Pick<SeedData, 'jobGroups' | 'seniorityBaseByGroup' | 'yearMeta'> {
    const seniorityClassification = require('../../assets/data-source/seniority-classification.json') as {
        groups?: Array<{ group: number; values?: Record<string, number | string> }>;
        yearMeta?: Record<string, { periodCount?: number }>;
    };

    const groups = Array.isArray(seniorityClassification.groups) ? seniorityClassification.groups : [];
    const yearMeta = seniorityClassification.yearMeta ?? {};

    const jobGroups: SeedJobGroupRecord[] = groups
        .map((group) => Number(group.group))
        .filter((groupNumber) => Number.isFinite(groupNumber))
        .sort((left, right) => left - right)
        .map((groupNumber, index) => ({
            group_number: groupNumber,
            sort_order: index + 1,
        }));

    const seniorityBaseByGroup: SeedSeniorityBaseByGroupRecord[] = [];

    for (const group of groups) {
        const groupNumber = Number(group.group);
        if (!Number.isFinite(groupNumber) || !group.values) {
            continue;
        }

        for (const [yearKey, rawValue] of Object.entries(group.values)) {
            const year = Number(yearKey);
            const normalizedValues = Array.isArray(rawValue)
                ? rawValue.map((value) => Number(value))
                : [Number(rawValue)];
            const validValues = normalizedValues.filter((value) => Number.isFinite(value));

            if (!Number.isFinite(year) || validValues.length === 0) {
                continue;
            }

            const periodCount = Number(yearMeta[String(year)]?.periodCount ?? (validValues.length > 0 ? validValues.length : 1));
            const safePeriodCount = Number.isFinite(periodCount) && periodCount > 0 ? Math.trunc(periodCount) : 1;

            for (let periodIndex = 1; periodIndex <= safePeriodCount; periodIndex += 1) {
                const valueForPeriod = validValues[periodIndex - 1] ?? validValues[0];
                seniorityBaseByGroup.push({
                    year,
                    period_index: periodIndex,
                    group_number: groupNumber,
                    base_value: valueForPeriod,
                });
            }
        }
    }

    return {
        jobGroups,
        seniorityBaseByGroup,
        yearMeta: yearMeta as Record<number, { periodCount?: number; percentIncrease?: number | null; periodMonthCounts?: (number | null)[] | null }>,
    };
}

export async function seedFromJsonAsset() {
    if (seedPromise) {
        return seedPromise;
    }

    seedPromise = (async () => {
        await initDatabase();

        if (await getDatabaseUserVersion() >= seedVersion) {
            return;
        }

        const salaryData = require('../../assets/data-source/calculator-data.json') as SeedData;
        const holidayData = require('../../assets/data-source/holidays.json') as OfficialHolidayData;
        const seniorityClassificationData = loadSeniorityClassificationData();
        const cleanedHolidayData: OfficialHolidayData = {};
        const seenDates = new Set<string>();

        for (const [yearKey, dates] of Object.entries(holidayData)) {
            const year = Number(yearKey);
            cleanedHolidayData[yearKey] = [];
            for (const date of dates) {
                const [dateYear, month, day] = date.split('/').map(Number);
                if (dateYear !== year || !isValidJalaaliDate(dateYear, month, day)) {
                    throw new Error(`Invalid official holiday date: ${date}`);
                }

                const gregorian = toGregorian(dateYear, month, day);
                if (new Date(Date.UTC(gregorian.gy, gregorian.gm - 1, gregorian.gd)).getUTCDay() === 5) {
                    continue;
                }

                if (!seenDates.has(date)) {
                    seenDates.add(date);
                    cleanedHolidayData[yearKey].push(date);
                }
            }
        }

        const data: SeedData = {
            ...salaryData,
            officialHolidays: cleanedHolidayData,
            jobGroups: seniorityClassificationData.jobGroups,
            seniorityBaseByGroup: seniorityClassificationData.seniorityBaseByGroup,
            yearMeta: seniorityClassificationData.yearMeta,
        };
        await seedDatabase(data);
        await setDatabaseUserVersion(seedVersion);
    })();

    try {
        await seedPromise;
    } catch (error) {
        seedPromise = null;
        throw error;
    }
}
