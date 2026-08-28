import { isValidJalaaliDate, toGregorian } from 'jalaali-js';
import { getDatabaseUserVersion, initDatabase, seedDatabase, setDatabaseUserVersion } from './db';
import type { OfficialHolidayData, SeedData } from './types';

const seedVersion = 3;
let seedPromise: Promise<void> | null = null;

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

        const data = {
            ...salaryData,
            officialHolidays: cleanedHolidayData,
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
