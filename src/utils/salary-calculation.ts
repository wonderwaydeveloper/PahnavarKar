import { jalaaliMonthLength, toGregorian } from 'jalaali-js';

export interface SalaryCalculationBreakdownItem {
    year: number;
    periodIndex: number;
    daysCovered: number;
    dailyMinimumWage: number | null;
    amount: number;
}

export interface SalaryCalculationResult {
    totalAmount: number;
    breakdown: SalaryCalculationBreakdownItem[];
}

export interface SalaryPeriodBucket {
    year: number;
    periods: {
        period_index: number;
        month_count: number | null;
        daily_minimum_wage: number | null;
    }[];
}

export interface ParsedDateInput {
    year: number;
    month: number;
    day: number;
}

const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
const latinDigits = '0123456789';

function normalizeDigits(value: string) {
    return value.replace(/[۰-۹]/g, (digit) => latinDigits[persianDigits.indexOf(digit)]);
}

export function parseDateInput(value: string): ParsedDateInput | null {
    const normalized = normalizeDigits(value.trim());
    if (!normalized) {
        return null;
    }

    const match = normalized.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
    if (!match) {
        return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
        return null;
    }

    if (month < 1 || month > 12) {
        return null;
    }

    if (day < 1 || day > 31) {
        return null;
    }

    return { year, month, day };
}

function compareParsedDates(left: ParsedDateInput, right: ParsedDateInput): number {
    const leftValue = left.year * 10000 + left.month * 100 + left.day;
    const rightValue = right.year * 10000 + right.month * 100 + right.day;

    if (leftValue < rightValue) {
        return -1;
    }

    if (leftValue > rightValue) {
        return 1;
    }

    return 0;
}

function toDayNumber(date: ParsedDateInput): number {
    const gregorianDate = toGregorian(date.year, date.month, date.day);
    return Date.UTC(gregorianDate.gy, gregorianDate.gm - 1, gregorianDate.gd) / 86400000;
}

function getDaysInPersianMonth(year: number, month: number): number {
    return jalaaliMonthLength(year, month);
}

function getOverlapDaysForMonth(
    selectedStartDate: ParsedDateInput,
    selectedEndDate: ParsedDateInput,
    year: number,
    month: number,
): number {
    const monthStart = { year, month, day: 1 };
    const monthEnd = { year, month, day: getDaysInPersianMonth(year, month) };

    const selectedStartDay = toDayNumber(selectedStartDate);
    const selectedEndDay = toDayNumber(selectedEndDate);
    const monthStartDay = toDayNumber(monthStart);
    const monthEndDay = toDayNumber(monthEnd);

    const overlapStart = Math.max(selectedStartDay, monthStartDay);
    const overlapEnd = Math.min(selectedEndDay, monthEndDay);

    if (overlapEnd < overlapStart) {
        return 0;
    }

    return overlapEnd - overlapStart + 1;
}

export function calculateSalaryFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
): SalaryCalculationResult {
    if (compareParsedDates(startDate, endDate) > 0) {
        return { totalAmount: 0, breakdown: [] };
    }

    const breakdown: SalaryCalculationBreakdownItem[] = [];

    for (const bucket of [...periodBuckets].sort((a, b) => a.year - b.year)) {
        const sortedPeriods = [...bucket.periods].sort((a, b) => a.period_index - b.period_index);
        let monthOffset = 0;

        for (const period of sortedPeriods) {
            const periodLength = Number(period.month_count ?? 0);
            if (!Number.isFinite(periodLength) || periodLength <= 0) {
                continue;
            }

            const periodStartMonth = monthOffset + 1;
            const periodEndMonth = monthOffset + periodLength;
            let daysCovered = 0;

            for (let monthIndex = periodStartMonth; monthIndex <= periodEndMonth; monthIndex += 1) {
                const calendarYear = bucket.year + Math.floor((monthIndex - 1) / 12);
                const calendarMonth = ((monthIndex - 1) % 12) + 1;
                daysCovered += getOverlapDaysForMonth(startDate, endDate, calendarYear, calendarMonth);
            }

            if (daysCovered > 0 && (period.daily_minimum_wage ?? 0) > 0) {
                breakdown.push({
                    year: bucket.year,
                    periodIndex: period.period_index,
                    daysCovered,
                    dailyMinimumWage: period.daily_minimum_wage,
                    amount: (period.daily_minimum_wage ?? 0) * daysCovered,
                });
            }

            monthOffset = periodEndMonth;
        }
    }

    return {
        totalAmount: breakdown.reduce((sum, item) => sum + item.amount, 0),
        breakdown,
    };
}
