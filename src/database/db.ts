import { type SQLiteDatabase } from 'expo-sqlite';
import { runWithDatabaseLock } from './connection';
import { initializeSchema, recreateDatabaseTables } from './schema';
import type { OfficialHolidayRecord, PeriodRecord, SeedData, YearRecord } from './types';

export async function initDatabase() {
    return initializeSchema();
}

export async function getDatabaseUserVersion(): Promise<number> {
    return runWithDatabaseLock(async (database) => {
        const statement = await database.prepareAsync('PRAGMA user_version;');

        try {
            const result = await statement.executeAsync<{ user_version: number }>([]);
            const row = await result.getFirstAsync();
            return Number(row?.user_version ?? 0);
        } finally {
            await statement.finalizeAsync();
        }
    });
}

export async function setDatabaseUserVersion(version: number): Promise<void> {
    if (!Number.isInteger(version) || version < 0) {
        throw new Error('Invalid database user version.');
    }

    await runWithDatabaseLock(async (database) => {
        await database.execAsync(`PRAGMA user_version = ${version};`);
    });
}

export async function clearDatabase() {
    return runWithDatabaseLock(async (database) => {
        await database.execAsync('DROP TABLE IF EXISTS seniority_base_by_group; DROP TABLE IF EXISTS job_groups; DROP TABLE IF EXISTS official_holidays; DROP TABLE IF EXISTS periods; DROP TABLE IF EXISTS years;');
    });
}

export async function seedDatabase(data: SeedData) {
    return runWithDatabaseLock(async (database) => {
        if (!data || !Array.isArray(data.data)) {
            throw new Error('Invalid seed data format.');
        }

        let yearStatement: Awaited<ReturnType<SQLiteDatabase['prepareAsync']>> | null = null;
        let periodStatement: Awaited<ReturnType<SQLiteDatabase['prepareAsync']>> | null = null;
        let holidayStatement: Awaited<ReturnType<SQLiteDatabase['prepareAsync']>> | null = null;
        let jobGroupStatement: Awaited<ReturnType<SQLiteDatabase['prepareAsync']>> | null = null;
        let seniorityBaseStatement: Awaited<ReturnType<SQLiteDatabase['prepareAsync']>> | null = null;
        let transactionStarted = false;

        try {
            await database.execAsync('BEGIN IMMEDIATE;');
            transactionStarted = true;
            await recreateDatabaseTables(database);

            yearStatement = await database.prepareAsync(`
                INSERT INTO years (
                    year,
                    period_count
                ) VALUES (?, ?);
            `);

            periodStatement = await database.prepareAsync(`
                INSERT INTO periods (
                    year_id,
                    period_index,
                    month_count,
                    days_in_year,
                    fridays_in_year,
                    official_holidays_in_year,
                    total_official_holidays,
                    total_work_hours_year,
                    daily_minimum_wage,
                    percent_increase,
                    seniority_base_previous,
                    seniority_base_cumulative,
                    friday_work_per_day,
                    monthly_shift_work_morning_evening_10,
                    monthly_shift_work_morning_evening_night_15,
                    monthly_shift_work_morning_night_or_evening_night_225,
                    seniority_base,
                    overtime_per_hour,
                    night_work_per_hour,
                    monthly_single_allowance,
                    monthly_married_allowance,
                    monthly_housing_single,
                    monthly_housing_married,
                    child_allowance,
                    min_monthly_bonus,
                    max_monthly_bonus,
                    formula_increase,
                    min_wage_decree_reference,
                    marital_allowance
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `)

            holidayStatement = await database.prepareAsync(`
                INSERT INTO official_holidays (
                    year_id,
                    month,
                    day,
                    holiday_date
                ) VALUES (?, ?, ?, ?);
            `);

            jobGroupStatement = await database.prepareAsync(`
                INSERT INTO job_groups (
                    group_number,
                    sort_order
                ) VALUES (?, ?);
            `);

            seniorityBaseStatement = await database.prepareAsync(`
                INSERT INTO seniority_base_by_group (
                    year_id,
                    period_id,
                    job_group_id,
                    base_value
                ) VALUES (?, ?, ?, ?);
            `);

            const yearIds = new Map<number, number>();
            const periodIds = new Map<string, number>();
            const defaultJobGroups = Array.from({ length: 20 }, (_, index) => ({
                group_number: index + 1,
                sort_order: index + 1,
            }));

            const jobGroups = Array.isArray(data.jobGroups) && data.jobGroups.length > 0
                ? data.jobGroups
                : defaultJobGroups;
            const jobGroupIds = new Map<number, number>();

            for (const [index, jobGroup] of jobGroups.entries()) {
                const rawGroupNumber = Number(jobGroup.group_number ?? index + 1);
                if (!Number.isFinite(rawGroupNumber)) {
                    continue;
                }

                const result = await jobGroupStatement.executeAsync([
                    rawGroupNumber,
                    Number(jobGroup.sort_order ?? index + 1),
                ]);

                jobGroupIds.set(rawGroupNumber, Number(result.lastInsertRowId));
            }

            for (const yearRecord of data.data) {
                const rawYearValue = yearRecord['سال_كاركرد'];
                const numericYearValue = Number(rawYearValue);
                const normalizedYear = Number.isFinite(numericYearValue) ? Math.trunc(numericYearValue) : null;

                if (normalizedYear === null) {
                    throw new Error(`Invalid year value in seed data: ${rawYearValue}`);
                }

                const yearResult = await yearStatement.executeAsync([
                    normalizedYear,
                    yearRecord.periods ? yearRecord.periods.length : 0,
                ]);

                const yearId = Number(yearResult.lastInsertRowId);
                yearIds.set(normalizedYear, yearId);

                if (Array.isArray(yearRecord.periods)) {
                    for (const [index, period] of yearRecord.periods.entries()) {
                        const monthlySingleAllowance = period['بن_ماهیانه']?.مجرد ?? null;
                        const monthlyMarriedAllowance = period['بن_ماهیانه']?.متاهل ?? null;
                        const monthlyHousingSingle = period['مسکن_ماهیانه']?.مجرد ?? null;
                        const monthlyHousingMarried = period['مسکن_ماهیانه']?.متاهل ?? null;
                        const formulaIncrease = period['فرمول_افزایش_مزدی'] ?? null;
                        const periodMonthCounts = data.yearMeta?.[normalizedYear]?.periodMonthCounts ?? null;
                        const overriddenMonthCount = Array.isArray(periodMonthCounts) ? periodMonthCounts[index] ?? null : null;

                        const periodResult = await periodStatement.executeAsync([
                            yearId,
                            index + 1,
                            overriddenMonthCount ?? period['تعداد_ماه_های_کارکرد_سال'] ?? null,
                            period['تعداد_روزهای_سال'] ?? null,
                            period['تعداد_جمعه_های_سال'] ?? null,
                            period['تعداد_تعطيلات_رسمی_سال'] ?? null,
                            period['کل_تعطیلات_رسمی_سال'] ?? null,
                            period['تعداد_ساعات_کارکرد_موظفی_کارگر_در_سال'] ?? null,
                            period['مبلغ_حداقل_مزد_روزانه_مصوب_شورای_عالی_کار'] ?? null,
                            period['درصد_افزايش'] ?? null,
                            period['پایه_سنواتی_گذشته'] ?? null,
                            period['پایه_سنوات_تجمیعی'] ?? null,
                            period['مبلغ_جمعه_کاری_یک_روز'] ?? null,
                            period['نوبت_کاری_ماهیانه']?.['صبح وعصر 10%'] ?? null,
                            period['نوبت_کاری_ماهیانه']?.['صبح و عصر و شب 15%'] ?? null,
                            period['نوبت_کاری_ماهیانه']?.['صبح  و شب یا عصر و شب 22.5%'] ?? null,
                            period['پایه_سنواتی_جاری'] ?? null,
                            period['مبلغ_اضافه_كاری_یک_ساعت'] ?? null,
                            period['مبلغ_شب_کاری_یک_ساعت'] ?? null,
                            monthlySingleAllowance,
                            monthlyMarriedAllowance,
                            monthlyHousingSingle,
                            monthlyHousingMarried,
                            period['مبلغ_عائله_مندی_یک_فرزند_واجد_شرایط'] ?? null,
                            period['مبلغ_حداقل_عیدی_پاداش_ماهیانه'] ?? null,
                            period['مبلغ_حداکثر_عیدی_پاداش_ماهیانه'] ?? null,
                            formulaIncrease,
                            period['شماره_و_تاریخ_بخش_نامه_حداقل_مزد'] ?? null,
                            period['حق_تاهل'] ?? null,
                        ]);

                        const periodId = Number(periodResult.lastInsertRowId);
                        periodIds.set(`${normalizedYear}:${index + 1}`, periodId);
                    }
                }
            }

            if (Array.isArray(data.seniorityBaseByGroup) && data.seniorityBaseByGroup.length > 0) {
                for (const record of data.seniorityBaseByGroup) {
                    const normalizedYear = Number(record.year ?? record.year_id ?? NaN);
                    const periodIndex = Number(record.period_index ?? NaN);
                    const groupNumber = Number(record.group_number ?? record.job_group_id ?? NaN);
                    const baseValue = Number(record.base_value ?? NaN);

                    if (!Number.isFinite(normalizedYear) || !Number.isFinite(periodIndex) || !Number.isFinite(groupNumber) || !Number.isFinite(baseValue)) {
                        continue;
                    }

                    const yearId = yearIds.get(normalizedYear);
                    const periodId = yearId ? periodIds.get(`${normalizedYear}:${periodIndex}`) : undefined;
                    const jobGroupId = jobGroupIds.get(groupNumber);

                    if (yearId === undefined || periodId === undefined || jobGroupId === undefined) {
                        continue;
                    }

                    await seniorityBaseStatement.executeAsync([
                        yearId,
                        periodId,
                        jobGroupId,
                        baseValue,
                    ]);
                }
            }

            if (data.officialHolidays) {
                for (const [yearKey, holidayDates] of Object.entries(data.officialHolidays)) {
                    const yearId = yearIds.get(Number(yearKey));
                    if (!yearId) {
                        throw new Error(`Official holidays refer to an unknown year: ${yearKey}`);
                    }

                    for (const holidayDate of holidayDates) {
                        const [, month, day] = holidayDate.split('/').map(Number);
                        await holidayStatement?.executeAsync([yearId, month, day, holidayDate]);
                    }
                }
            }

            await database.execAsync('COMMIT;');
            transactionStarted = false;
        } catch (error) {
            if (transactionStarted) {
                try {
                    await database.execAsync('ROLLBACK;');
                } catch {
                    // ignore rollback errors
                }
            }
            throw error;
        } finally {
            if (yearStatement) {
                await yearStatement.finalizeAsync();
            }
            if (periodStatement) {
                await periodStatement.finalizeAsync();
            }
            if (holidayStatement) {
                await holidayStatement.finalizeAsync();
            }
            if (jobGroupStatement) {
                await jobGroupStatement.finalizeAsync();
            }
            if (seniorityBaseStatement) {
                await seniorityBaseStatement.finalizeAsync();
            }
        }
    });
}

export async function fetchYears(): Promise<YearRecord[]> {
    return runWithDatabaseLock(async (database) => {
        const statement = await database.prepareAsync(`
            SELECT id, year, period_count
            FROM years
            ORDER BY year ASC;
        `);
        try {
            const result = await statement.executeAsync<YearRecord>([]);
            const rows = await result.getAllAsync() as YearRecord[];
            return rows.map((year) => ({
                ...year,
                year: Math.trunc(Number(year.year)),
            }));
        } finally {
            await statement.finalizeAsync();
        }
    });
}

export async function fetchPeriodsByYearId(yearId: number): Promise<PeriodRecord[]> {
    return runWithDatabaseLock(async (database) => {
        const statement = await database.prepareAsync(`
            SELECT *
            FROM periods
            WHERE year_id = ?
            ORDER BY period_index ASC;
        `);
        try {
            const result = await statement.executeAsync<PeriodRecord>([yearId]);
            return await result.getAllAsync() as PeriodRecord[];
        } finally {
            await statement.finalizeAsync();
        }
    });
}

export async function fetchJobGroups(): Promise<{ id: number; group_number: number; sort_order: number }[]> {
    return runWithDatabaseLock(async (database) => {
        const statement = await database.prepareAsync(`
            SELECT id, group_number, sort_order
            FROM job_groups
            ORDER BY sort_order ASC;
        `);

        try {
            const result = await statement.executeAsync<{ id: number; group_number: number; sort_order: number }>([]);
            return await result.getAllAsync() as { id: number; group_number: number; sort_order: number }[];
        } finally {
            await statement.finalizeAsync();
        }
    });
}

export async function fetchSeniorityBaseByGroup(periodId: number): Promise<{ id: number; year_id: number; period_id: number; job_group_id: number; base_value: number }[]> {
    return runWithDatabaseLock(async (database) => {
        const statement = await database.prepareAsync(`
            SELECT id, year_id, period_id, job_group_id, base_value
            FROM seniority_base_by_group
            WHERE period_id = ?
            ORDER BY job_group_id ASC;
        `);

        try {
            const result = await statement.executeAsync<{ id: number; year_id: number; period_id: number; job_group_id: number; base_value: number }>([periodId]);
            return await result.getAllAsync() as { id: number; year_id: number; period_id: number; job_group_id: number; base_value: number }[];
        } finally {
            await statement.finalizeAsync();
        }
    });
}

export async function fetchOfficialHolidaysBetweenDates(
    startDate: string,
    endDate: string,
): Promise<OfficialHolidayRecord[]> {
    return runWithDatabaseLock(async (database) => {
        const statement = await database.prepareAsync(`
            SELECT official_holidays.id, official_holidays.year_id, years.year, official_holidays.month, official_holidays.day, official_holidays.holiday_date
            FROM official_holidays
            INNER JOIN years ON years.id = official_holidays.year_id
            WHERE holiday_date >= ? AND holiday_date <= ?
            ORDER BY holiday_date ASC;
        `);

        try {
            const result = await statement.executeAsync<OfficialHolidayRecord>([startDate, endDate]);
            return await result.getAllAsync() as OfficialHolidayRecord[];
        } finally {
            await statement.finalizeAsync();
        }
    });
}
