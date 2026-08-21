import { isValidJalaaliDate, jalaaliMonthLength, toGregorian } from 'jalaali-js';

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

export interface FridayWorkCalculationBreakdownItem {
    year: number;
    periodIndex: number;
    daysCovered: number;
    fridaysInPeriod: number;
    fridayWorkDays: number;
    fridayWorkRate: number | null;
    amount: number;
}

export interface FridayWorkCalculationResult {
    totalAmount: number;
    breakdown: FridayWorkCalculationBreakdownItem[];
}

export interface SalaryPeriodBucket {
    year: number;
    periods: {
        period_index: number;
        month_count: number | null;
        daily_minimum_wage: number | null;
        friday_work_per_day?: number | null;
        overtime_per_hour?: number | null;
        night_work_per_hour?: number | null;
        child_allowance?: number | null;
        monthly_single_allowance?: number | null;
        monthly_married_allowance?: number | null;
        monthly_housing_single?: number | null;
        monthly_housing_married?: number | null;
        marital_allowance?: number | null;
        seniority_base_entitlement?: number | null;
        monthly_shift_work_morning_evening_10?: number | null;
        monthly_shift_work_morning_evening_night_15?: number | null;
        monthly_shift_work_morning_night_or_evening_night_225?: number | null;
    }[];
}

export interface FamilyAllowanceCalculationBreakdownItem {
    year: number;
    periodIndex: number;
    monthsCovered: number;
    daysCovered: number;
    childAllowance: number | null;
    amount: number;
}

export interface HousingAllowanceCalculationBreakdownItem {
    year: number;
    periodIndex: number;
    monthsCovered: number;
    daysCovered: number;
    monthlyAllowance: number | null;
    amount: number;
}

export interface FamilyAllowanceCalculationResult {
    totalAmount: number;
    breakdown: FamilyAllowanceCalculationBreakdownItem[];
}

export interface HousingAllowanceCalculationResult {
    totalAmount: number;
    breakdown: HousingAllowanceCalculationBreakdownItem[];
}

export interface MinimumBonusAndEntitlementBreakdownItem {
    year: number;
    periodIndex: number;
    monthsCovered: number;
    daysCovered: number;
    dailyMinimumWage: number | null;
    amount: number;
}

export interface MinimumBonusAndEntitlementCalculationResult {
    totalAmount: number;
    breakdown: MinimumBonusAndEntitlementBreakdownItem[];
}

export interface MonthlyAllowanceCalculationBreakdownItem {
    year: number;
    periodIndex: number;
    monthsCovered: number;
    daysCovered: number;
    monthlyAllowance: number | null;
    amount: number;
}

export interface MonthlyAllowanceCalculationResult {
    totalAmount: number;
    breakdown: MonthlyAllowanceCalculationBreakdownItem[];
}

export interface MaximumBonusAndEntitlementBreakdownItem {
    year: number;
    periodIndex: number;
    monthsCovered: number;
    daysCovered: number;
    dailyMinimumWage: number | null;
    amount: number;
}

export interface MaximumBonusAndEntitlementCalculationResult {
    totalAmount: number;
    breakdown: MaximumBonusAndEntitlementBreakdownItem[];
}

export interface SpousalAllowanceCalculationBreakdownItem {
    year: number;
    periodIndex: number;
    monthsCovered: number;
    daysCovered: number;
    spousalAllowance: number | null;
    amount: number;
}

export interface SpousalAllowanceCalculationResult {
    totalAmount: number;
    breakdown: SpousalAllowanceCalculationBreakdownItem[];
}

export interface OvertimeEntitlementBreakdownItem {
    year: number;
    periodIndex: number;
    daysCovered: number;
    dailyOvertimeHours: number;
    overtimeRate: number | null;
    amount: number;
}

export interface OvertimeEntitlementCalculationResult {
    totalAmount: number;
    breakdown: OvertimeEntitlementBreakdownItem[];
}

export interface NightShiftEntitlementBreakdownItem {
    year: number;
    periodIndex: number;
    daysCovered: number;
    nightShiftPerHour: number | null;
    amount: number;
}

export interface NightShiftEntitlementCalculationResult {
    totalAmount: number;
    breakdown: NightShiftEntitlementBreakdownItem[];
}

export interface EndOfServiceYearsBreakdownItem {
    year: number;
    periodIndex: number;
    monthsCovered: number;
    daysCovered: number;
    dailyMinimumWage: number | null;
    amount: number;
}

export interface EndOfServiceYearsCalculationResult {
    totalAmount: number;
    breakdown: EndOfServiceYearsBreakdownItem[];
}

export interface InsuranceDaysEntitlementBreakdownItem {
    year: number;
    periodIndex: number;
    daysCovered: number;
    dailyHours: number;
    calculationType: 'month-full' | 'partial';
    daysCalculated: number;
}

export interface InsuranceDaysEntitlementCalculationResult {
    totalDays: number;
    breakdown: InsuranceDaysEntitlementBreakdownItem[];
}

export type UnusedLeaveWageMaritalStatus = 'single' | 'married';

export interface UnusedLeaveWageCalculationResult {
    unusedLeaveDays: number;
    dailyWage: number;
    dailyMinimumWage: number;
    dailyHousingAllowance: number;
    dailyChildAllowance: number;
    dailyMonthlyAllowance: number;
    dailyMaritalAllowance: number;
    year: number;
    periodIndex: number;
}

export type MonthlyShiftWorkType =
    | 'morning-evening'
    | 'morning-evening-night'
    | 'morning-night-or-evening-night';

export interface MonthlyShiftWorkBreakdownItem {
    year: number;
    periodIndex: number;
    daysCovered: number;
    shiftType: MonthlyShiftWorkType;
    coefficient: number;
    dailyBase: number | null;
    amount: number;
}

export interface MonthlyShiftWorkCalculationResult {
    totalAmount: number;
    breakdown: MonthlyShiftWorkBreakdownItem[];
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

    if (!isValidJalaaliDate(year, month, day)) {
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

export function calculateUnusedLeaveMonths(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
): number | null {
    if (compareParsedDates(startDate, endDate) > 0) {
        return null;
    }

    const monthDiff = (endDate.year - startDate.year) * 12 + (endDate.month - startDate.month);
    if (startDate.day === 1) {
        return monthDiff + 1;
    }

    return Math.max(0, monthDiff - (endDate.day < startDate.day ? 1 : 0));
}

export function calculateUnusedLeaveDays(totalMonthsWorked: number): number {
    if (!Number.isFinite(totalMonthsWorked) || totalMonthsWorked <= 0) {
        return 0;
    }

    if (totalMonthsWorked <= 12) {
        return totalMonthsWorked * 2.5;
    }

    const fullYears = Math.floor(totalMonthsWorked / 12);
    const remainingMonths = totalMonthsWorked % 12;
    return fullYears * 9 + remainingMonths * (9 / 12);
}

export function calculateUnusedLeaveWageFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
    maritalStatus: UnusedLeaveWageMaritalStatus = 'single',
    childrenCount = 1,
): UnusedLeaveWageCalculationResult | null {
    const totalMonthsWorked = calculateUnusedLeaveMonths(startDate, endDate);
    if (totalMonthsWorked === null) {
        return null;
    }
    const unusedLeaveDays = calculateUnusedLeaveDays(totalMonthsWorked);

    const bucket = periodBuckets.find((item) => item.year === endDate.year);
    if (!bucket) {
        return null;
    }

    let monthOffset = 0;
    const period = [...bucket.periods]
        .sort((left, right) => left.period_index - right.period_index)
        .find((item) => {
            const periodLength = Number(item.month_count ?? 0);
            const startsAt = monthOffset + 1;
            const endsAt = monthOffset + periodLength;
            monthOffset = endsAt;
            return periodLength > 0 && endDate.month >= startsAt && endDate.month <= endsAt;
        });

    if (!period) {
        return null;
    }

    const dailyMinimumWage = Number(period.daily_minimum_wage ?? 0);
    const monthlyHousingAllowance = maritalStatus === 'married'
        ? Number(period.monthly_housing_married ?? 0)
        : Number(period.monthly_housing_single ?? 0);
    const monthlyAllowance = maritalStatus === 'married'
        ? Number(period.monthly_married_allowance ?? 0)
        : Number(period.monthly_single_allowance ?? 0);
    const childAllowance = Number(period.child_allowance ?? 0) * Math.max(1, Math.trunc(childrenCount));
    const maritalAllowance = Number(period.marital_allowance ?? 0);
    const dailyHousingAllowance = monthlyHousingAllowance / 30;
    const dailyChildAllowance = childAllowance / 30;
    const dailyMonthlyAllowance = monthlyAllowance / 30;
    const dailyMaritalAllowance = maritalAllowance / 30;
    const dailyWage = dailyMinimumWage + dailyHousingAllowance + dailyChildAllowance + dailyMonthlyAllowance + dailyMaritalAllowance;

    return {
        unusedLeaveDays,
        dailyWage,
        dailyMinimumWage,
        dailyHousingAllowance,
        dailyChildAllowance,
        dailyMonthlyAllowance,
        dailyMaritalAllowance,
        year: bucket.year,
        periodIndex: period.period_index,
    };
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

function getFridaysInMonthOverlap(
    selectedStartDate: ParsedDateInput,
    selectedEndDate: ParsedDateInput,
    year: number,
    month: number,
): number {
    const monthStartDay = toDayNumber({ year, month, day: 1 });
    const monthEndDay = toDayNumber({ year, month, day: getDaysInPersianMonth(year, month) });
    const selectedStartDay = toDayNumber(selectedStartDate);
    const selectedEndDay = toDayNumber(selectedEndDate);
    const overlapStart = Math.max(selectedStartDay, monthStartDay);
    const overlapEnd = Math.min(selectedEndDay, monthEndDay);

    if (overlapEnd < overlapStart) {
        return 0;
    }

    let fridays = 0;
    for (let dayNumber = overlapStart; dayNumber <= overlapEnd; dayNumber += 1) {
        if (new Date(dayNumber * 86400000).getUTCDay() === 5) {
            fridays += 1;
        }
    }

    return fridays;
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

export function calculateFridayWorkFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
    fridayWorkDays: number,
): FridayWorkCalculationResult {
    if (
        compareParsedDates(startDate, endDate) > 0 ||
        !Number.isFinite(fridayWorkDays) ||
        fridayWorkDays <= 0
    ) {
        return { totalAmount: 0, breakdown: [] };
    }

    const breakdown: FridayWorkCalculationBreakdownItem[] = [];

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
            let fridaysInPeriod = 0;

            for (let monthIndex = periodStartMonth; monthIndex <= periodEndMonth; monthIndex += 1) {
                const calendarYear = bucket.year + Math.floor((monthIndex - 1) / 12);
                const calendarMonth = ((monthIndex - 1) % 12) + 1;
                daysCovered += getOverlapDaysForMonth(startDate, endDate, calendarYear, calendarMonth);
                fridaysInPeriod += getFridaysInMonthOverlap(startDate, endDate, calendarYear, calendarMonth);
            }

            const fridayWorkRate = Number(period.friday_work_per_day ?? 0);
            if (daysCovered > 0 && fridayWorkRate > 0) {
                breakdown.push({
                    year: bucket.year,
                    periodIndex: period.period_index,
                    daysCovered,
                    fridaysInPeriod,
                    fridayWorkDays,
                    fridayWorkRate,
                    amount: Math.round(fridayWorkDays * fridayWorkRate),
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

export function calculateFamilyAllowanceFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
    numberOfChildren: number,
    includeDaysCovered = true,
): FamilyAllowanceCalculationResult {
    if (compareParsedDates(startDate, endDate) > 0) {
        return { totalAmount: 0, breakdown: [] };
    }

    const breakdown: FamilyAllowanceCalculationBreakdownItem[] = [];

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
            let monthsCovered = 0;
            let daysCovered = 0;
            let periodAmount = 0;
            const monthlyAllowance = Number(period.child_allowance ?? 0) * numberOfChildren;

            for (let monthIndex = periodStartMonth; monthIndex <= periodEndMonth; monthIndex += 1) {
                const calendarYear = bucket.year + Math.floor((monthIndex - 1) / 12);
                const calendarMonth = ((monthIndex - 1) % 12) + 1;
                const monthDays = getDaysInPersianMonth(calendarYear, calendarMonth);
                const overlapDays = getOverlapDaysForMonth(startDate, endDate, calendarYear, calendarMonth);

                if (overlapDays > 0) {
                    if (overlapDays === monthDays) {
                        monthsCovered += 1;
                    } else if (includeDaysCovered) {
                        daysCovered += overlapDays;
                        periodAmount += (monthlyAllowance * overlapDays) / monthDays;
                    }

                    if (overlapDays === monthDays) {
                        periodAmount += monthlyAllowance;
                    }
                }
            }

            if ((monthsCovered > 0 || daysCovered > 0) && monthlyAllowance > 0) {
                breakdown.push({
                    year: bucket.year,
                    periodIndex: period.period_index,
                    monthsCovered,
                    daysCovered,
                    childAllowance: period.child_allowance ?? null,
                    amount: Math.round(periodAmount),
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

export function calculateHousingAllowanceFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
    maritalStatus: 'single' | 'married' = 'single',
    includeDaysCovered = true,
): HousingAllowanceCalculationResult {
    if (compareParsedDates(startDate, endDate) > 0) {
        return { totalAmount: 0, breakdown: [] };
    }

    const breakdown: HousingAllowanceCalculationBreakdownItem[] = [];

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
            let monthsCovered = 0;
            let daysCovered = 0;
            let periodAmount = 0;
            const housingAllowance =
                maritalStatus === 'married'
                    ? Number(period.monthly_housing_married ?? 0)
                    : Number(period.monthly_housing_single ?? 0);

            for (let monthIndex = periodStartMonth; monthIndex <= periodEndMonth; monthIndex += 1) {
                const calendarYear = bucket.year + Math.floor((monthIndex - 1) / 12);
                const calendarMonth = ((monthIndex - 1) % 12) + 1;
                const overlapDays = getOverlapDaysForMonth(startDate, endDate, calendarYear, calendarMonth);
                const monthDays = getDaysInPersianMonth(calendarYear, calendarMonth);

                if (overlapDays > 0) {
                    if (overlapDays === monthDays) {
                        monthsCovered += 1;
                        periodAmount += housingAllowance;
                    } else if (includeDaysCovered) {
                        const proratedAmount = (housingAllowance * overlapDays) / monthDays;
                        daysCovered += overlapDays;
                        periodAmount += proratedAmount;
                    }
                }
            }

            if ((monthsCovered > 0 || daysCovered > 0 || periodAmount > 0) && housingAllowance > 0) {
                breakdown.push({
                    year: bucket.year,
                    periodIndex: period.period_index,
                    monthsCovered,
                    daysCovered,
                    monthlyAllowance: housingAllowance,
                    amount: Math.round(periodAmount),
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

export function calculateMonthlyAllowanceFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
    maritalStatus: 'single' | 'married' = 'single',
    includeDaysCovered = true,
): MonthlyAllowanceCalculationResult {
    if (compareParsedDates(startDate, endDate) > 0) {
        return { totalAmount: 0, breakdown: [] };
    }

    const breakdown: MonthlyAllowanceCalculationBreakdownItem[] = [];

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
            let monthsCovered = 0;
            let daysCovered = 0;
            let periodAmount = 0;
            const monthlyAllowance =
                maritalStatus === 'married'
                    ? Number(period.monthly_married_allowance ?? 0)
                    : Number(period.monthly_single_allowance ?? 0);

            for (let monthIndex = periodStartMonth; monthIndex <= periodEndMonth; monthIndex += 1) {
                const calendarYear = bucket.year + Math.floor((monthIndex - 1) / 12);
                const calendarMonth = ((monthIndex - 1) % 12) + 1;
                const overlapDays = getOverlapDaysForMonth(startDate, endDate, calendarYear, calendarMonth);
                const monthDays = getDaysInPersianMonth(calendarYear, calendarMonth);

                if (overlapDays > 0) {
                    if (overlapDays === monthDays) {
                        monthsCovered += 1;
                        periodAmount += monthlyAllowance;
                    } else if (includeDaysCovered) {
                        const proratedAmount = (monthlyAllowance * overlapDays) / monthDays;
                        daysCovered += overlapDays;
                        periodAmount += proratedAmount;
                    }
                }
            }

            if ((monthsCovered > 0 || daysCovered > 0 || periodAmount > 0) && monthlyAllowance > 0) {
                breakdown.push({
                    year: bucket.year,
                    periodIndex: period.period_index,
                    monthsCovered,
                    daysCovered,
                    monthlyAllowance,
                    amount: Math.round(periodAmount),
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

export function calculateMinimumBonusAndEntitlementFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
    includeDaysCovered = true,
): MinimumBonusAndEntitlementCalculationResult {
    if (compareParsedDates(startDate, endDate) > 0) {
        return { totalAmount: 0, breakdown: [] };
    }

    const breakdown: MinimumBonusAndEntitlementBreakdownItem[] = [];

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
            let monthsCovered = 0;
            let daysCovered = 0;
            let periodAmount = 0;
            const dailyMinimumWage = Number(period.daily_minimum_wage ?? 0);
            const bonusFactor = 5;

            for (let monthIndex = periodStartMonth; monthIndex <= periodEndMonth; monthIndex += 1) {
                const calendarYear = bucket.year + Math.floor((monthIndex - 1) / 12);
                const calendarMonth = ((monthIndex - 1) % 12) + 1;
                const monthDays = getDaysInPersianMonth(calendarYear, calendarMonth);
                const overlapDays = getOverlapDaysForMonth(startDate, endDate, calendarYear, calendarMonth);

                if (overlapDays > 0) {
                    if (overlapDays === monthDays) {
                        monthsCovered += 1;
                        periodAmount += dailyMinimumWage * bonusFactor;
                    } else if (includeDaysCovered) {
                        const proratedAmount = (dailyMinimumWage * bonusFactor * overlapDays) / monthDays;
                        daysCovered += overlapDays;
                        periodAmount += proratedAmount;
                    }
                }
            }

            if ((monthsCovered > 0 || daysCovered > 0 || periodAmount > 0) && dailyMinimumWage > 0) {
                breakdown.push({
                    year: bucket.year,
                    periodIndex: period.period_index,
                    monthsCovered,
                    daysCovered,
                    dailyMinimumWage,
                    amount: Math.round(periodAmount),
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

export function calculateMaximumBonusAndEntitlementFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
    includeDaysCovered = true,
): MaximumBonusAndEntitlementCalculationResult {
    if (compareParsedDates(startDate, endDate) > 0) {
        return { totalAmount: 0, breakdown: [] };
    }

    const breakdown: MaximumBonusAndEntitlementBreakdownItem[] = [];

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
            let monthsCovered = 0;
            let daysCovered = 0;
            let periodAmount = 0;
            const dailyMinimumWage = Number(period.daily_minimum_wage ?? 0);
            const bonusFactor = 7.5;

            for (let monthIndex = periodStartMonth; monthIndex <= periodEndMonth; monthIndex += 1) {
                const calendarYear = bucket.year + Math.floor((monthIndex - 1) / 12);
                const calendarMonth = ((monthIndex - 1) % 12) + 1;
                const monthDays = getDaysInPersianMonth(calendarYear, calendarMonth);
                const overlapDays = getOverlapDaysForMonth(startDate, endDate, calendarYear, calendarMonth);

                if (overlapDays > 0) {
                    if (overlapDays === monthDays) {
                        monthsCovered += 1;
                        periodAmount += dailyMinimumWage * bonusFactor;
                    } else if (includeDaysCovered) {
                        const proratedAmount = (dailyMinimumWage * bonusFactor * overlapDays) / monthDays;
                        daysCovered += overlapDays;
                        periodAmount += proratedAmount;
                    }
                }
            }

            if ((monthsCovered > 0 || daysCovered > 0 || periodAmount > 0) && dailyMinimumWage > 0) {
                breakdown.push({
                    year: bucket.year,
                    periodIndex: period.period_index,
                    monthsCovered,
                    daysCovered,
                    dailyMinimumWage,
                    amount: Math.round(periodAmount),
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

export function calculateSpousalAllowanceFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
    includeDaysCovered = true,
): SpousalAllowanceCalculationResult {
    if (compareParsedDates(startDate, endDate) > 0) {
        return { totalAmount: 0, breakdown: [] };
    }

    const breakdown: SpousalAllowanceCalculationBreakdownItem[] = [];

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
            let monthsCovered = 0;
            let daysCovered = 0;
            let periodAmount = 0;
            const maritalAllowance = Number(period.marital_allowance ?? 0);

            for (let monthIndex = periodStartMonth; monthIndex <= periodEndMonth; monthIndex += 1) {
                const calendarYear = bucket.year + Math.floor((monthIndex - 1) / 12);
                const calendarMonth = ((monthIndex - 1) % 12) + 1;
                const overlapDays = getOverlapDaysForMonth(startDate, endDate, calendarYear, calendarMonth);
                const monthDays = getDaysInPersianMonth(calendarYear, calendarMonth);

                if (overlapDays > 0) {
                    if (overlapDays === monthDays) {
                        monthsCovered += 1;
                        periodAmount += maritalAllowance;
                    } else if (includeDaysCovered) {
                        const proratedAmount = (maritalAllowance * overlapDays) / monthDays;
                        daysCovered += overlapDays;
                        periodAmount += proratedAmount;
                    }
                }
            }

            if ((monthsCovered > 0 || daysCovered > 0 || periodAmount > 0) && maritalAllowance > 0) {
                breakdown.push({
                    year: bucket.year,
                    periodIndex: period.period_index,
                    monthsCovered,
                    daysCovered,
                    spousalAllowance: maritalAllowance ?? null,
                    amount: Math.round(periodAmount),
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

export function calculateOvertimeEntitlementFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
    dailyOvertimeHours: number,
    includeDaysCovered = true,
): OvertimeEntitlementCalculationResult {
    if (compareParsedDates(startDate, endDate) > 0 || !Number.isFinite(dailyOvertimeHours) || dailyOvertimeHours <= 0) {
        return { totalAmount: 0, breakdown: [] };
    }

    const breakdown: OvertimeEntitlementBreakdownItem[] = [];

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
            let periodAmount = 0;
            const overtimeRate = Number(period.overtime_per_hour ?? 0);

            for (let monthIndex = periodStartMonth; monthIndex <= periodEndMonth; monthIndex += 1) {
                const calendarYear = bucket.year + Math.floor((monthIndex - 1) / 12);
                const calendarMonth = ((monthIndex - 1) % 12) + 1;
                const overlapDays = getOverlapDaysForMonth(startDate, endDate, calendarYear, calendarMonth);

                if (overlapDays > 0) {
                    if (includeDaysCovered) {
                        daysCovered += overlapDays;
                        periodAmount += dailyOvertimeHours * overtimeRate * overlapDays;
                    }
                }
            }

            if ((daysCovered > 0 || periodAmount > 0) && overtimeRate > 0) {
                breakdown.push({
                    year: bucket.year,
                    periodIndex: period.period_index,
                    daysCovered,
                    dailyOvertimeHours,
                    overtimeRate,
                    amount: Math.round(periodAmount),
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

export function calculateNightShiftEntitlementFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
    includeDaysCovered = true,
): NightShiftEntitlementCalculationResult {
    if (compareParsedDates(startDate, endDate) > 0) {
        return { totalAmount: 0, breakdown: [] };
    }

    const breakdown: NightShiftEntitlementBreakdownItem[] = [];
    const nightShiftCoefficient = 7.33;

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
            let periodAmount = 0;
            const nightShiftRate = Number(period.night_work_per_hour ?? 0);

            for (let monthIndex = periodStartMonth; monthIndex <= periodEndMonth; monthIndex += 1) {
                const calendarYear = bucket.year + Math.floor((monthIndex - 1) / 12);
                const calendarMonth = ((monthIndex - 1) % 12) + 1;
                const overlapDays = getOverlapDaysForMonth(startDate, endDate, calendarYear, calendarMonth);

                if (overlapDays > 0) {
                    if (includeDaysCovered) {
                        daysCovered += overlapDays;
                        periodAmount += nightShiftCoefficient * nightShiftRate * overlapDays;
                    }
                }
            }

            if ((daysCovered > 0 || periodAmount > 0) && nightShiftRate > 0) {
                breakdown.push({
                    year: bucket.year,
                    periodIndex: period.period_index,
                    daysCovered,
                    nightShiftPerHour: nightShiftRate,
                    amount: Math.round(periodAmount),
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

export function calculateEndOfServiceYearsFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
    includeDaysCovered = true,
): EndOfServiceYearsCalculationResult {
    if (compareParsedDates(startDate, endDate) > 0) {
        return { totalAmount: 0, breakdown: [] };
    }

    const coveredPeriods: {
        year: number;
        periodIndex: number;
        monthsCovered: number;
        daysCovered: number;
        coveredMonthEquivalent: number;
        dailyMinimumWage: number;
    }[] = [];

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
            let monthsCovered = 0;
            let daysCovered = 0;
            const dailyMinimumWage = Number(period.daily_minimum_wage ?? 0);
            let coveredMonthEquivalent = 0;

            for (let monthIndex = periodStartMonth; monthIndex <= periodEndMonth; monthIndex += 1) {
                const calendarYear = bucket.year + Math.floor((monthIndex - 1) / 12);
                const calendarMonth = ((monthIndex - 1) % 12) + 1;
                const overlapDays = getOverlapDaysForMonth(startDate, endDate, calendarYear, calendarMonth);
                const monthDays = getDaysInPersianMonth(calendarYear, calendarMonth);

                if (overlapDays > 0) {
                    if (overlapDays === monthDays) {
                        monthsCovered += 1;
                        coveredMonthEquivalent += 1;
                    } else if (includeDaysCovered) {
                        daysCovered += overlapDays;
                        coveredMonthEquivalent += overlapDays / monthDays;
                    }
                }
            }

            if ((monthsCovered > 0 || daysCovered > 0) && dailyMinimumWage > 0) {
                coveredPeriods.push({
                    year: bucket.year,
                    periodIndex: period.period_index,
                    monthsCovered,
                    daysCovered,
                    coveredMonthEquivalent,
                    dailyMinimumWage,
                });
            }

            monthOffset = periodEndMonth;
        }
    }

    const lastDailyMinimumWage = coveredPeriods.at(-1)?.dailyMinimumWage ?? 0;
    const breakdown: EndOfServiceYearsBreakdownItem[] = coveredPeriods.map((period) => {
        return {
            year: period.year,
            periodIndex: period.periodIndex,
            monthsCovered: period.monthsCovered,
            daysCovered: period.daysCovered,
            dailyMinimumWage: period.dailyMinimumWage,
            amount: Math.round(period.coveredMonthEquivalent * 2.5 * lastDailyMinimumWage),
        };
    });

    return {
        totalAmount: Math.round(
            coveredPeriods.reduce((sum, period) => sum + period.coveredMonthEquivalent, 0) * 2.5 * lastDailyMinimumWage,
        ),
        breakdown,
    };
}

export function calculateInsuranceDaysEntitlementFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    dailyWorkHours: number,
): InsuranceDaysEntitlementCalculationResult {
    if (compareParsedDates(startDate, endDate) > 0 || !Number.isFinite(dailyWorkHours) || dailyWorkHours <= 0) {
        return { totalDays: 0, breakdown: [] };
    }

    const breakdown: InsuranceDaysEntitlementBreakdownItem[] = [];
    const thresholdHours = 7.33;
    const monthStart = { year: startDate.year, month: startDate.month, day: 1 };
    const monthEnd = { year: endDate.year, month: endDate.month, day: getDaysInPersianMonth(endDate.year, endDate.month) };

    const monthCursor = { year: startDate.year, month: startDate.month };
    const endCursor = { year: endDate.year, month: endDate.month };

    while (monthCursor.year < endCursor.year || (monthCursor.year === endCursor.year && monthCursor.month <= endCursor.month)) {
        const overlapDays = getOverlapDaysForMonth(startDate, endDate, monthCursor.year, monthCursor.month);

        if (overlapDays > 0) {
            const daysCalculated = dailyWorkHours >= thresholdHours
                ? overlapDays
                : overlapDays * (dailyWorkHours / thresholdHours);

            breakdown.push({
                year: monthCursor.year,
                periodIndex: monthCursor.month,
                daysCovered: overlapDays,
                dailyHours: dailyWorkHours,
                calculationType: dailyWorkHours >= thresholdHours ? 'month-full' : 'partial',
                daysCalculated: Number(daysCalculated.toFixed(2)),
            });
        }

        monthCursor.month += 1;
        if (monthCursor.month > 12) {
            monthCursor.month = 1;
            monthCursor.year += 1;
        }
    }

    return {
        totalDays: Number(breakdown.reduce((sum, item) => sum + item.daysCalculated, 0).toFixed(2)),
        breakdown,
    };
}

export function calculateMonthlyShiftWorkFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
    shiftType: MonthlyShiftWorkType,
    includeDaysCovered = true,
): MonthlyShiftWorkCalculationResult {
    if (compareParsedDates(startDate, endDate) > 0) {
        return { totalAmount: 0, breakdown: [] };
    }

    const coefficientMap: Record<MonthlyShiftWorkType, number> = {
        'morning-evening': 0.1,
        'morning-evening-night': 0.15,
        'morning-night-or-evening-night': 0.225,
    };

    const coefficient = coefficientMap[shiftType];
    const breakdown: MonthlyShiftWorkBreakdownItem[] = [];

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
            let periodAmount = 0;
            // فرمول: ضریب × تعداد روزهای کارکرد × حداقل مزد روزانه
            const dailyMinimumWage = Number(period.daily_minimum_wage ?? 0);
            const selectedMonthlyShiftValue =
                shiftType === 'morning-evening'
                    ? Number(period.monthly_shift_work_morning_evening_10 ?? 0)
                    : shiftType === 'morning-evening-night'
                        ? Number(period.monthly_shift_work_morning_evening_night_15 ?? 0)
                        : Number(period.monthly_shift_work_morning_night_or_evening_night_225 ?? 0);

            for (let monthIndex = periodStartMonth; monthIndex <= periodEndMonth; monthIndex += 1) {
                const calendarYear = bucket.year + Math.floor((monthIndex - 1) / 12);
                const calendarMonth = ((monthIndex - 1) % 12) + 1;
                const monthDays = getDaysInPersianMonth(calendarYear, calendarMonth);
                const overlapDays = getOverlapDaysForMonth(startDate, endDate, calendarYear, calendarMonth);

                if (overlapDays > 0 && includeDaysCovered) {
                    const monthlyShiftAmount = selectedMonthlyShiftValue > 0
                        ? selectedMonthlyShiftValue
                        : coefficient * dailyMinimumWage * monthDays;

                    daysCovered += overlapDays;
                    periodAmount += (monthlyShiftAmount * overlapDays) / monthDays;
                }
            }

            if ((daysCovered > 0 || periodAmount > 0) && (dailyMinimumWage > 0 || selectedMonthlyShiftValue > 0)) {
                breakdown.push({
                    year: bucket.year,
                    periodIndex: period.period_index,
                    daysCovered,
                    shiftType,
                    coefficient,
                    dailyBase: dailyMinimumWage || null,
                    amount: Math.round(periodAmount),
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
