import { isValidJalaaliDate, jalaaliMonthLength, toGregorian, toJalaali } from 'jalaali-js';

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

export interface OrdinaryWorkHoursBreakdownItem {
    year: number;
    periodIndex: number;
    daysCovered: number;
    officialHolidays: number;
    fridays: number;
    workingDays: number;
    requiredHours: number;
}

export interface OrdinaryWorkHoursCalculationResult {
    totalHours: number;
    breakdown: OrdinaryWorkHoursBreakdownItem[];
}

export interface YoungWorkerWorkHoursCalculationResult {
    totalHours: number;
    breakdown: OrdinaryWorkHoursBreakdownItem[];
}

export interface SuspensionWageCalculationBreakdownItem {
    year: number;
    periodIndex: number;
    startDate: ParsedDateInput;
    endDate: ParsedDateInput;
    daysCovered: number;
    dailyMinimumWage: number;
    dailySeniority: number;
    dailyHousingAllowance: number;
    dailyChildAllowance: number;
    dailyMonthlyAllowance: number;
    dailyMaritalAllowance: number;
    dailyWage: number;
    amount: number;
}

export interface SuspensionWageCalculationResult {
    totalAmount: number;
    breakdown: SuspensionWageCalculationBreakdownItem[];
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

export interface OfficialHolidayWorkBreakdownItem {
    year: number;
    periodIndex: number;
    daysCovered: number;
    overtimeRate: number | null;
    amount: number;
}

export interface OfficialHolidayWorkCalculationResult {
    totalAmount: number;
    breakdown: OfficialHolidayWorkBreakdownItem[];
}

export interface IllegalForeignWorkerPenaltyBreakdownItem {
    year: number;
    periodIndex: number;
    daysCovered: number;
    workerCount: number;
    dailyMinimumWage: number;
    amount: number;
}

export interface IllegalForeignWorkerPenaltyCalculationResult {
    totalAmount: number;
    breakdown: IllegalForeignWorkerPenaltyBreakdownItem[];
}

export interface SalaryPeriodBucket {
    year: number;
    periods: {
        period_index: number;
        month_count: number | null;
        daily_minimum_wage: number | null;
        percent_increase?: number | null;
        seniority_base?: number | null;
        friday_work_per_day?: number | null;
        overtime_per_hour?: number | null;
        night_work_per_hour?: number | null;
        child_allowance?: number | null;
        monthly_single_allowance?: number | null;
        monthly_married_allowance?: number | null;
        monthly_housing_single?: number | null;
        monthly_housing_married?: number | null;
        marital_allowance?: number | null;
        seniority_base_cumulative?: number | null;
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
    totalOvertimeHours: number;
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

export type SeniorityEntitlementSettlementStatus = 'settled' | 'unsettled';

export interface SeniorityEntitlementBreakdownItem {
    year: number;
    periodIndex: number;
    eligibleFrom: ParsedDateInput;
    eligibleTo: ParsedDateInput;
    daysCovered: number;
    seniorityBase: number;
    dailyEntitlement: number;
    percentIncrease: number | null;
    amount: number;
}

export interface SeniorityEntitlementCalculationResult {
    totalAmount: number;
    breakdown: SeniorityEntitlementBreakdownItem[];
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

function getAnniversaryDate(startDate: ParsedDateInput, year: number): ParsedDateInput {
    const monthDays = jalaaliMonthLength(year, startDate.month);
    return {
        year,
        month: startDate.month,
        day: Math.min(startDate.day, monthDays),
    };
}

function getPreviousDate(date: ParsedDateInput): ParsedDateInput {
    const gregorianDate = toGregorian(date.year, date.month, date.day);
    const previousDate = new Date(Date.UTC(gregorianDate.gy, gregorianDate.gm - 1, gregorianDate.gd) - 86400000);
    const previousJalaaliDate = toJalaali(
        previousDate.getUTCFullYear(),
        previousDate.getUTCMonth() + 1,
        previousDate.getUTCDate(),
    );

    return {
        year: previousJalaaliDate.jy,
        month: previousJalaaliDate.jm,
        day: previousJalaaliDate.jd,
    };
}

function getPeriodSegments(bucket: SalaryPeriodBucket) {
    let monthOffset = 0;

    return [...bucket.periods]
        .sort((left, right) => left.period_index - right.period_index)
        .map((period) => {
            const periodLength = Number(period.month_count ?? 0);
            const startMonth = monthOffset + 1;
            const endMonth = monthOffset + periodLength;
            monthOffset = endMonth;

            return {
                period,
                start: { year: bucket.year, month: startMonth, day: 1 },
                end: { year: bucket.year, month: endMonth, day: jalaaliMonthLength(bucket.year, endMonth) },
            };
        })
        .filter((segment) => segment.start.month <= 12 && segment.end.month >= segment.start.month);
}

function getLaterDate(left: ParsedDateInput, right: ParsedDateInput): ParsedDateInput {
    return compareParsedDates(left, right) >= 0 ? left : right;
}

function getEarlierDate(left: ParsedDateInput, right: ParsedDateInput): ParsedDateInput {
    return compareParsedDates(left, right) <= 0 ? left : right;
}

export function calculateSeniorityEntitlementFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
    settlementStatus: SeniorityEntitlementSettlementStatus,
): SeniorityEntitlementCalculationResult {
    if (compareParsedDates(startDate, endDate) > 0) {
        return { totalAmount: 0, breakdown: [] };
    }

    const breakdown: SeniorityEntitlementBreakdownItem[] = [];
    let previousAmount = 0;
    const settledBefore1392 = startDate.year < 1392 && settlementStatus === 'settled';
    const firstAnniversary = settledBefore1392
        ? getAnniversaryDate(startDate, 1392)
        : getAnniversaryDate(startDate, startDate.year + 1);
    const firstEntitlementYearEnd = {
        year: firstAnniversary.year,
        month: 12,
        day: jalaaliMonthLength(firstAnniversary.year, 12),
    };

    const appendBreakdown = (
        year: number,
        period: SalaryPeriodBucket['periods'][number] | null,
        eligibleFrom: ParsedDateInput,
        eligibleTo: ParsedDateInput,
        dailyEntitlement: number,
    ) => {
        if (!period || compareParsedDates(eligibleFrom, eligibleTo) > 0) {
            return;
        }

        const rawPercentIncrease = Number(period.percent_increase);
        const daysCovered = Math.round(toDayNumber(eligibleTo) - toDayNumber(eligibleFrom) + 1);
        breakdown.push({
            year,
            periodIndex: period.period_index,
            eligibleFrom,
            eligibleTo,
            daysCovered,
            seniorityBase: Number(period.seniority_base ?? 0),
            dailyEntitlement,
            percentIncrease: Number.isFinite(rawPercentIncrease) ? rawPercentIncrease : null,
            amount: Math.round(dailyEntitlement * daysCovered),
        });
    };

    const appendRangeBreakdowns = (
        bucket: SalaryPeriodBucket | undefined,
        rangeStart: ParsedDateInput,
        rangeEnd: ParsedDateInput,
        amountForPeriod: (period: SalaryPeriodBucket['periods'][number]) => number,
    ) => {
        if (!bucket) return;

        for (const segment of getPeriodSegments(bucket)) {
            const segmentStart = getLaterDate(rangeStart, segment.start);
            const segmentEnd = getEarlierDate(rangeEnd, segment.end);
            appendBreakdown(
                bucket.year,
                segment.period,
                segmentStart,
                segmentEnd,
                amountForPeriod(segment.period),
            );
        }
    };

    const findPeriodForDate = (bucket: SalaryPeriodBucket | undefined, date: ParsedDateInput) =>
        bucket
            ? getPeriodSegments(bucket).find((segment) => (
                compareParsedDates(date, segment.start) >= 0 &&
                compareParsedDates(date, segment.end) <= 0
            ))?.period ?? null
            : null;

    const appendAcrossYears = (
        rangeStart: ParsedDateInput,
        rangeEnd: ParsedDateInput,
        amountForPeriod: (period: SalaryPeriodBucket['periods'][number]) => number,
    ) => {
        for (let year = rangeStart.year; year <= rangeEnd.year; year += 1) {
            const yearStart = { year, month: 1, day: 1 };
            const yearEnd = { year, month: 12, day: jalaaliMonthLength(year, 12) };
            const bucket = periodBuckets.find((item) => item.year === year);
            const currentRangeEnd = getEarlierDate(rangeEnd, yearEnd);

            appendRangeBreakdowns(
                bucket,
                getLaterDate(rangeStart, yearStart),
                currentRangeEnd,
                amountForPeriod,
            );
        }
    };

    if (!settledBefore1392) {
        const beforeAnniversaryEnd = compareParsedDates(endDate, firstAnniversary) < 0
            ? endDate
            : getPreviousDate(firstAnniversary);

        appendAcrossYears(
            startDate,
            beforeAnniversaryEnd,
            () => 0,
        );
    } else {
        const firstEntitlementYearStart = { year: 1392, month: 1, day: 1 };
        const firstEntitlementYearBucket = periodBuckets.find((item) => item.year === 1392);
        const beforeAnniversaryEnd = getPreviousDate(firstAnniversary);
        const beforeAnniversaryStart = getLaterDate(startDate, firstEntitlementYearStart);
        const beforeAnniversaryPeriod = findPeriodForDate(firstEntitlementYearBucket, beforeAnniversaryStart);

        appendBreakdown(
            1392,
            beforeAnniversaryPeriod,
            beforeAnniversaryStart,
            getEarlierDate(endDate, beforeAnniversaryEnd),
            0,
        );
    }

    if (compareParsedDates(endDate, firstAnniversary) < 0) {
        return { totalAmount: 0, breakdown };
    }

    const firstEntitlementBucket = periodBuckets.find((item) => item.year === firstAnniversary.year);
    const firstEntitlementEnd = compareParsedDates(endDate, firstEntitlementYearEnd) < 0
        ? endDate
        : firstEntitlementYearEnd;
    appendRangeBreakdowns(
        firstEntitlementBucket,
        firstAnniversary,
        firstEntitlementEnd,
        (period) => Number(period.seniority_base ?? 0),
    );
    const firstEntitlementSegments = firstEntitlementBucket
        ? getPeriodSegments(firstEntitlementBucket).filter((segment) => compareParsedDates(segment.end, firstAnniversary) >= 0)
        : [];
    if (firstEntitlementSegments.length > 0) {
        previousAmount = Number(firstEntitlementSegments[firstEntitlementSegments.length - 1].period.seniority_base ?? 0);
    }

    if (endDate.year <= firstAnniversary.year) {
        return {
            totalAmount: breakdown.reduce((sum, item) => sum + item.amount, 0),
            breakdown,
        };
    }

    for (let year = firstAnniversary.year + 1; year <= endDate.year; year += 1) {
        const bucket = periodBuckets.find((item) => item.year === year);
        const anniversary = getAnniversaryDate(startDate, year);
        const yearStart = { year, month: 1, day: 1 };
        const yearEnd = { year, month: 12, day: jalaaliMonthLength(year, 12) };
        const beforeEnd = compareParsedDates(endDate, anniversary) < 0 ? endDate : getPreviousDate(anniversary);
        const priorYearAmount = previousAmount;
        let latestBeforeAmount: number | null = null;

        appendRangeBreakdowns(
            bucket,
            yearStart,
            beforeEnd,
            (period) => {
                const percentIncrease = Number(period.percent_increase);
                latestBeforeAmount = priorYearAmount * (Number.isFinite(percentIncrease) ? percentIncrease : 1);
                return latestBeforeAmount;
            },
        );

        if (compareParsedDates(endDate, anniversary) < 0) {
            previousAmount = latestBeforeAmount ?? priorYearAmount;
            break;
        }

        const afterEnd = compareParsedDates(endDate, yearEnd) < 0 ? endDate : yearEnd;
        let latestAfterAmount: number | null = null;
        appendRangeBreakdowns(
            bucket,
            anniversary,
            afterEnd,
            (period) => {
                const percentIncrease = Number(period.percent_increase);
                const amountBeforeAnniversary = priorYearAmount * (Number.isFinite(percentIncrease) ? percentIncrease : 1);
                latestAfterAmount = amountBeforeAnniversary + Number(period.seniority_base ?? 0);
                return latestAfterAmount;
            },
        );
        previousAmount = latestAfterAmount ?? latestBeforeAmount ?? priorYearAmount;
    }

    return {
        totalAmount: breakdown.reduce((sum, item) => sum + item.amount, 0),
        breakdown,
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

export function calculateAvailableFridaysByYear(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
): Record<number, number> {
    if (compareParsedDates(startDate, endDate) > 0) {
        return {};
    }

    const availableFridaysByYear: Record<number, number> = {};

    for (let year = startDate.year; year <= endDate.year; year += 1) {
        let fridaysInYear = 0;
        const firstMonth = year === startDate.year ? startDate.month : 1;
        const lastMonth = year === endDate.year ? endDate.month : 12;

        for (let month = firstMonth; month <= lastMonth; month += 1) {
            fridaysInYear += getFridaysInMonthOverlap(startDate, endDate, year, month);
        }

        availableFridaysByYear[year] = fridaysInYear;
    }

    return availableFridaysByYear;
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

export function calculateOrdinaryWorkHoursFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
    officialHolidayDates: string[],
    dailyHoursCoefficient = 7.33,
): OrdinaryWorkHoursCalculationResult {
    if (compareParsedDates(startDate, endDate) > 0) {
        return { totalHours: 0, breakdown: [] };
    }

    const holidaySet = new Set(officialHolidayDates);
    const breakdown: OrdinaryWorkHoursBreakdownItem[] = [];

    for (const bucket of [...periodBuckets].sort((left, right) => left.year - right.year)) {
        let monthOffset = 0;

        for (const period of [...bucket.periods].sort((left, right) => left.period_index - right.period_index)) {
            const periodLength = Number(period.month_count ?? 0);
            if (!Number.isFinite(periodLength) || periodLength <= 0) {
                continue;
            }

            const periodStartMonth = monthOffset + 1;
            const periodEndMonth = monthOffset + periodLength;
            const periodStart = { year: bucket.year, month: periodStartMonth, day: 1 };
            const periodEnd = { year: bucket.year, month: periodEndMonth, day: jalaaliMonthLength(bucket.year, periodEndMonth) };
            const overlapStart = getLaterDate(startDate, periodStart);
            const overlapEnd = getEarlierDate(endDate, periodEnd);

            if (compareParsedDates(overlapStart, overlapEnd) > 0) {
                monthOffset = periodEndMonth;
                continue;
            }

            let daysCovered = 0;
            let officialHolidays = 0;
            let fridays = 0;

            for (let monthIndex = periodStartMonth; monthIndex <= periodEndMonth; monthIndex += 1) {
                const calendarYear = bucket.year + Math.floor((monthIndex - 1) / 12);
                const calendarMonth = ((monthIndex - 1) % 12) + 1;
                const monthDays = jalaaliMonthLength(calendarYear, calendarMonth);
                const monthStart = { year: calendarYear, month: calendarMonth, day: 1 };
                const monthEnd = { year: calendarYear, month: calendarMonth, day: monthDays };
                const monthOverlapStart = getLaterDate(overlapStart, monthStart);
                const monthOverlapEnd = getEarlierDate(overlapEnd, monthEnd);

                if (compareParsedDates(monthOverlapStart, monthOverlapEnd) > 0) {
                    continue;
                }

                const overlapDays = Math.round(toDayNumber(monthOverlapEnd) - toDayNumber(monthOverlapStart) + 1);
                daysCovered += overlapDays;
                fridays += getFridaysInMonthOverlap(overlapStart, overlapEnd, calendarYear, calendarMonth);

                for (let day = 1; day <= monthDays; day += 1) {
                    const date = { year: calendarYear, month: calendarMonth, day };
                    if (compareParsedDates(date, monthOverlapStart) >= 0 && compareParsedDates(date, monthOverlapEnd) <= 0) {
                        const dateKey = `${calendarYear}/${String(calendarMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
                        if (holidaySet.has(dateKey)) {
                            officialHolidays += 1;
                        }
                    }
                }
            }

            const workingDays = Math.max(0, daysCovered - officialHolidays - fridays);
            breakdown.push({
                year: bucket.year,
                periodIndex: period.period_index,
                daysCovered,
                officialHolidays,
                fridays,
                workingDays,
                requiredHours: Number((workingDays * dailyHoursCoefficient).toFixed(2)),
            });

            monthOffset = periodEndMonth;
        }
    }

    return {
        totalHours: Number(breakdown.reduce((sum, item) => sum + item.requiredHours, 0).toFixed(2)),
        breakdown,
    };
}

export function calculateYoungWorkerWorkHoursFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
    officialHolidayDates: string[],
): YoungWorkerWorkHoursCalculationResult {
    const ordinaryResult = calculateOrdinaryWorkHoursFromPeriodData(
        startDate,
        endDate,
        periodBuckets,
        officialHolidayDates,
    );

    const breakdown = ordinaryResult.breakdown.map((item) => ({
        ...item,
        requiredHours: Number((item.workingDays * 7.33 - item.daysCovered * 0.5).toFixed(2)),
    }));

    return {
        totalHours: Number(breakdown.reduce((sum, item) => sum + item.requiredHours, 0).toFixed(2)),
        breakdown,
    };
}

export function calculateSuspensionWageFromPeriodData(
    suspensionStartDate: ParsedDateInput,
    suspensionEndDate: ParsedDateInput,
    employmentStartDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
    maritalStatus: 'single' | 'married',
    numberOfChildren: number,
    settlementStatus: SeniorityEntitlementSettlementStatus = 'unsettled',
): SuspensionWageCalculationResult {
    if (
        compareParsedDates(suspensionStartDate, suspensionEndDate) > 0 ||
        compareParsedDates(employmentStartDate, suspensionEndDate) > 0 ||
        !Number.isInteger(numberOfChildren) ||
        numberOfChildren < 0
    ) {
        return { totalAmount: 0, breakdown: [] };
    }

    const seniorityResult = calculateSeniorityEntitlementFromPeriodData(
        employmentStartDate,
        suspensionEndDate,
        periodBuckets,
        settlementStatus,
    );
    const breakdown: SuspensionWageCalculationBreakdownItem[] = [];

    for (const bucket of [...periodBuckets].sort((left, right) => left.year - right.year)) {
        let monthOffset = 0;

        for (const period of [...bucket.periods].sort((left, right) => left.period_index - right.period_index)) {
            const periodLength = Number(period.month_count ?? 0);
            if (!Number.isFinite(periodLength) || periodLength <= 0) {
                continue;
            }

            const periodStartMonth = monthOffset + 1;
            const periodEndMonth = monthOffset + periodLength;
            const periodStart = { year: bucket.year, month: periodStartMonth, day: 1 };
            const periodEnd = { year: bucket.year, month: periodEndMonth, day: jalaaliMonthLength(bucket.year, periodEndMonth) };
            const overlapStart = getLaterDate(suspensionStartDate, periodStart);
            const overlapEnd = getEarlierDate(suspensionEndDate, periodEnd);
            const daysCovered = compareParsedDates(overlapStart, overlapEnd) <= 0
                ? Math.round(toDayNumber(overlapEnd) - toDayNumber(overlapStart) + 1)
                : 0;

            if (daysCovered <= 0) {
                monthOffset = periodEndMonth;
                continue;
            }

            const seniorityItem = seniorityResult.breakdown
                .filter((item) => (
                    item.amount > 0 &&
                    compareParsedDates(item.eligibleFrom, overlapStart) <= 0 &&
                    compareParsedDates(item.eligibleTo, overlapStart) >= 0
                ))
                .at(-1);
            const dailyMinimumWage = Number(period.daily_minimum_wage ?? 0);
            const dailySeniority = seniorityItem?.dailyEntitlement ?? 0;
            const monthlyHousingAllowance = maritalStatus === 'married'
                ? Number(period.monthly_housing_married ?? 0)
                : Number(period.monthly_housing_single ?? 0);
            const monthlyAllowance = maritalStatus === 'married'
                ? Number(period.monthly_married_allowance ?? 0)
                : Number(period.monthly_single_allowance ?? 0);
            const childAllowance = Number(period.child_allowance ?? 0) * numberOfChildren;
            const maritalAllowance = maritalStatus === 'married' ? Number(period.marital_allowance ?? 0) : 0;
            let housingAmount = 0;
            let childAmount = 0;
            let monthlyAmount = 0;
            let maritalAmount = 0;
            let amount = 0;

            for (let monthIndex = periodStartMonth; monthIndex <= periodEndMonth; monthIndex += 1) {
                const calendarYear = bucket.year + Math.floor((monthIndex - 1) / 12);
                const calendarMonth = ((monthIndex - 1) % 12) + 1;
                const monthDays = jalaaliMonthLength(calendarYear, calendarMonth);
                const monthStart = { year: calendarYear, month: calendarMonth, day: 1 };
                const monthEnd = { year: calendarYear, month: calendarMonth, day: monthDays };
                const monthOverlapStart = getLaterDate(overlapStart, monthStart);
                const monthOverlapEnd = getEarlierDate(overlapEnd, monthEnd);
                const monthOverlapDays = compareParsedDates(monthOverlapStart, monthOverlapEnd) <= 0
                    ? Math.round(toDayNumber(monthOverlapEnd) - toDayNumber(monthOverlapStart) + 1)
                    : 0;

                if (monthOverlapDays <= 0) {
                    continue;
                }

                housingAmount += monthlyHousingAllowance * monthOverlapDays / monthDays;
                childAmount += childAllowance * monthOverlapDays / monthDays;
                monthlyAmount += monthlyAllowance * monthOverlapDays / monthDays;
                maritalAmount += maritalAllowance * monthOverlapDays / monthDays;
                amount += (dailyMinimumWage + dailySeniority) * monthOverlapDays
                    + (monthlyHousingAllowance + childAllowance + monthlyAllowance + maritalAllowance) * monthOverlapDays / monthDays;
            }

            const dailyHousingAllowance = housingAmount / daysCovered;
            const dailyChildAllowance = childAmount / daysCovered;
            const dailyMonthlyAllowance = monthlyAmount / daysCovered;
            const dailyMaritalAllowance = maritalAmount / daysCovered;
            const dailyWage = amount / daysCovered;

            breakdown.push({
                year: bucket.year,
                periodIndex: period.period_index,
                startDate: overlapStart,
                endDate: overlapEnd,
                daysCovered,
                dailyMinimumWage,
                dailySeniority,
                dailyHousingAllowance,
                dailyChildAllowance,
                dailyMonthlyAllowance,
                dailyMaritalAllowance,
                dailyWage,
                amount: Math.round(amount),
            });

            monthOffset = periodEndMonth;
        }
    }

    return {
        totalAmount: breakdown.reduce((sum, item) => sum + item.amount, 0),
        breakdown,
    };
}

export function calculateOfficialHolidayWorkFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
    officialHolidayDates: string[],
): OfficialHolidayWorkCalculationResult {
    if (compareParsedDates(startDate, endDate) > 0) {
        return { totalAmount: 0, breakdown: [] };
    }

    const breakdown: OfficialHolidayWorkBreakdownItem[] = [];
    const holidaySet = new Set(officialHolidayDates);

    for (const bucket of [...periodBuckets].sort((left, right) => left.year - right.year)) {
        const sortedPeriods = [...bucket.periods].sort((left, right) => left.period_index - right.period_index);
        let monthOffset = 0;

        for (const period of sortedPeriods) {
            const periodLength = Number(period.month_count ?? 0);
            if (!Number.isFinite(periodLength) || periodLength <= 0) {
                continue;
            }

            const periodStartMonth = monthOffset + 1;
            const periodEndMonth = monthOffset + periodLength;
            let daysCovered = 0;
            const overtimeRate = Number(period.overtime_per_hour ?? 0);

            for (let monthIndex = periodStartMonth; monthIndex <= periodEndMonth; monthIndex += 1) {
                const calendarYear = bucket.year + Math.floor((monthIndex - 1) / 12);
                const calendarMonth = ((monthIndex - 1) % 12) + 1;
                const monthDays = jalaaliMonthLength(calendarYear, calendarMonth);

                for (let day = 1; day <= monthDays; day += 1) {
                    const date = { year: calendarYear, month: calendarMonth, day };

                    if (compareParsedDates(date, startDate) < 0 || compareParsedDates(date, endDate) > 0) {
                        continue;
                    }

                    const dateKey = `${date.year}/${String(date.month).padStart(2, '0')}/${String(date.day).padStart(2, '0')}`;
                    if (holidaySet.has(dateKey)) {
                        daysCovered += 1;
                    }
                }
            }

            if (daysCovered > 0 && overtimeRate > 0) {
                breakdown.push({
                    year: bucket.year,
                    periodIndex: period.period_index,
                    daysCovered,
                    overtimeRate,
                    amount: Math.round(daysCovered * 7.33 * overtimeRate),
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

export function calculateArticle87WorkPermitFee(squareMeters: number): number {
    if (!Number.isFinite(squareMeters) || squareMeters < 0) {
        return 0;
    }

    return Math.round(squareMeters * 55000);
}

export interface SocialSecurityPremiumCeilingBreakdownItem {
    year: number;
    periodIndex: number;
    daysCovered: number;
    dailyMinimumWage: number;
    amount: number;
}

export interface SocialSecurityPremiumCeilingCalculationResult {
    totalAmount: number;
    breakdown: SocialSecurityPremiumCeilingBreakdownItem[];
}

export function calculateSocialSecurityPremiumCeiling(dailyMinimumWage: number, monthDays: number): number {
    if (!Number.isFinite(dailyMinimumWage) || dailyMinimumWage <= 0 || !Number.isFinite(monthDays) || monthDays <= 0) {
        return 0;
    }

    return Math.round(7 * dailyMinimumWage * monthDays);
}

export function calculateSocialSecurityPremiumCeilingFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
): SocialSecurityPremiumCeilingCalculationResult {
    if (compareParsedDates(startDate, endDate) > 0) {
        return { totalAmount: 0, breakdown: [] };
    }

    const breakdown: SocialSecurityPremiumCeilingBreakdownItem[] = [];

    for (const bucket of [...periodBuckets].sort((left, right) => left.year - right.year)) {
        const sortedPeriods = [...bucket.periods].sort((left, right) => left.period_index - right.period_index);
        let monthOffset = 0;

        for (const period of sortedPeriods) {
            const periodLength = Number(period.month_count ?? 0);
            if (!Number.isFinite(periodLength) || periodLength <= 0) {
                continue;
            }

            const periodStartMonth = monthOffset + 1;
            const periodEndMonth = monthOffset + periodLength;
            let daysCovered = 0;
            const dailyMinimumWage = Number(period.daily_minimum_wage ?? 0);

            for (let monthIndex = periodStartMonth; monthIndex <= periodEndMonth; monthIndex += 1) {
                const calendarYear = bucket.year + Math.floor((monthIndex - 1) / 12);
                const calendarMonth = ((monthIndex - 1) % 12) + 1;
                const monthOverlapDays = getOverlapDaysForMonth(startDate, endDate, calendarYear, calendarMonth);

                if (monthOverlapDays > 0) {
                    daysCovered += monthOverlapDays;
                }
            }

            if (daysCovered > 0 && dailyMinimumWage > 0) {
                breakdown.push({
                    year: bucket.year,
                    periodIndex: period.period_index,
                    daysCovered,
                    dailyMinimumWage,
                    amount: Math.round(daysCovered * 7 * dailyMinimumWage),
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

export function calculateIllegalForeignWorkerPenaltyFromPeriodData(
    startDate: ParsedDateInput,
    endDate: ParsedDateInput,
    periodBuckets: SalaryPeriodBucket[],
    workerCount: number,
): IllegalForeignWorkerPenaltyCalculationResult {
    if (compareParsedDates(startDate, endDate) > 0 || !Number.isFinite(workerCount) || workerCount <= 0) {
        return { totalAmount: 0, breakdown: [] };
    }

    const breakdown: IllegalForeignWorkerPenaltyBreakdownItem[] = [];

    for (const bucket of [...periodBuckets].sort((left, right) => left.year - right.year)) {
        const sortedPeriods = [...bucket.periods].sort((left, right) => left.period_index - right.period_index);
        let monthOffset = 0;

        for (const period of sortedPeriods) {
            const periodLength = Number(period.month_count ?? 0);
            if (!Number.isFinite(periodLength) || periodLength <= 0) {
                continue;
            }

            const periodStartMonth = monthOffset + 1;
            const periodEndMonth = monthOffset + periodLength;
            let daysCovered = 0;
            const dailyMinimumWage = Number(period.daily_minimum_wage ?? 0);

            for (let monthIndex = periodStartMonth; monthIndex <= periodEndMonth; monthIndex += 1) {
                const calendarYear = bucket.year + Math.floor((monthIndex - 1) / 12);
                const calendarMonth = ((monthIndex - 1) % 12) + 1;
                const monthStart = { year: calendarYear, month: calendarMonth, day: 1 };
                const monthEnd = { year: calendarYear, month: calendarMonth, day: jalaaliMonthLength(calendarYear, calendarMonth) };
                const overlapStart = getLaterDate(startDate, monthStart);
                const overlapEnd = getEarlierDate(endDate, monthEnd);

                if (compareParsedDates(overlapStart, overlapEnd) <= 0) {
                    daysCovered += Math.round(toDayNumber(overlapEnd) - toDayNumber(overlapStart) + 1);
                }
            }

            if (daysCovered > 0 && dailyMinimumWage > 0) {
                breakdown.push({
                    year: bucket.year,
                    periodIndex: period.period_index,
                    daysCovered,
                    workerCount,
                    dailyMinimumWage,
                    amount: Math.round(daysCovered * dailyMinimumWage * 5 * workerCount),
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
    fridayWorkDaysByYear: Record<number, number>,
): FridayWorkCalculationResult {
    if (compareParsedDates(startDate, endDate) > 0) {
        return { totalAmount: 0, breakdown: [] };
    }

    const breakdown: FridayWorkCalculationBreakdownItem[] = [];

    for (const bucket of [...periodBuckets].sort((a, b) => a.year - b.year)) {
        const sortedPeriods = [...bucket.periods].sort((a, b) => a.period_index - b.period_index);
        let monthOffset = 0;
        const annualFridayWorkDays = Number(fridayWorkDaysByYear[bucket.year] ?? 0);
        if (!Number.isInteger(annualFridayWorkDays) || annualFridayWorkDays < 0) {
            continue;
        }
        const periodDetails: {
            period: SalaryPeriodBucket['periods'][number];
            daysCovered: number;
            fridaysInPeriod: number;
            fridayWorkDays: number;
        }[] = [];

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

            if (daysCovered > 0) {
                periodDetails.push({ period, daysCovered, fridaysInPeriod, fridayWorkDays: 0 });
            }

            monthOffset = periodEndMonth;
        }

        const totalAvailableFridays = periodDetails.reduce((sum, item) => sum + item.fridaysInPeriod, 0);
        if (annualFridayWorkDays <= 0 || totalAvailableFridays <= 0) {
            continue;
        }

        const cappedAnnualDays = Math.min(annualFridayWorkDays, totalAvailableFridays);
        const allocations = periodDetails.map((item) => ({
            item,
            exact: cappedAnnualDays * item.fridaysInPeriod / totalAvailableFridays,
        }));
        let allocatedDays = 0;

        for (const allocation of allocations) {
            allocation.item.fridayWorkDays = Math.floor(allocation.exact);
            allocatedDays += allocation.item.fridayWorkDays;
        }

        const remainingDays = cappedAnnualDays - allocatedDays;
        allocations
            .sort((left, right) => {
                const fractionalDifference = (right.exact - Math.floor(right.exact)) - (left.exact - Math.floor(left.exact));
                return fractionalDifference || left.item.period.period_index - right.item.period.period_index;
            })
            .slice(0, remainingDays)
            .forEach((allocation) => {
                allocation.item.fridayWorkDays += 1;
            });

        for (const item of periodDetails) {
            const fridayWorkRate = Number(item.period.friday_work_per_day ?? 0);
            if (item.fridayWorkDays > 0 && fridayWorkRate > 0) {
                breakdown.push({
                    year: bucket.year,
                    periodIndex: item.period.period_index,
                    daysCovered: item.daysCovered,
                    fridaysInPeriod: item.fridaysInPeriod,
                    fridayWorkDays: item.fridayWorkDays,
                    fridayWorkRate,
                    amount: Math.round(item.fridayWorkDays * fridayWorkRate),
                });
            }
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
                    totalOvertimeHours: dailyOvertimeHours * daysCovered,
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
