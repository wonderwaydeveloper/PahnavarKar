import { type SQLiteDatabase } from 'expo-sqlite';
import { runWithDatabaseLock } from './connection';
import { initializeSchema, recreateDatabaseTables } from './schema';
import type { PeriodRecord, SeedData, YearRecord } from './types';

export async function initDatabase() {
    return initializeSchema();
}

export async function clearDatabase() {
    return runWithDatabaseLock(async (database) => {
        await database.execAsync('DROP TABLE IF EXISTS periods; DROP TABLE IF EXISTS years;');
    });
}

export async function seedDatabase(data: SeedData) {
    return runWithDatabaseLock(async (database) => {
        if (!data || !Array.isArray(data.data)) {
            throw new Error('Invalid seed data format.');
        }

        let yearStatement: Awaited<ReturnType<SQLiteDatabase['prepareAsync']>> | null = null;
        let periodStatement: Awaited<ReturnType<SQLiteDatabase['prepareAsync']>> | null = null;
        let transactionStarted = false;

        try {
            await recreateDatabaseTables(database);
            await database.execAsync('BEGIN IMMEDIATE;');
            transactionStarted = true;

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
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `);

            await database.execAsync('DELETE FROM periods;');
            await database.execAsync('DELETE FROM years;');

            for (const yearRecord of data.data) {
                const rawYearValue = yearRecord['سال_كاركرد'];
                const numericYearValue = Number(rawYearValue);
                const normalizedYear = Number.isFinite(numericYearValue) ? Math.trunc(numericYearValue) : null;

                if (normalizedYear === null) {
                    throw new Error(`Invalid year value in seed data: ${rawYearValue}`);
                }

                const firstPeriod = Array.isArray(yearRecord.periods) && yearRecord.periods.length > 0
                    ? yearRecord.periods[0]
                    : null;
                const periodBaseValues = {
                    days_in_year: firstPeriod?.['تعداد_روزهاي_سال'] ?? null,
                    fridays_in_year: firstPeriod?.['تعداد_جمعه_های_سال'] ?? null,
                    official_holidays_in_year: firstPeriod?.['تعداد_تعطيلات_رسمي_سال'] ?? null,
                    total_official_holidays: firstPeriod?.['کل_تعطیلات_رسمی_سال'] ?? null,
                    total_work_hours_year: firstPeriod?.['تعداد_ساعات_کارکرد_موظفی_کارگر_در_سال'] ?? null,
                    daily_minimum_wage: firstPeriod?.['مبلغ_حداقل_مزد_روزانه_مصوب_شورای_عالی_کار'] ?? null,
                    friday_work_per_day: firstPeriod?.['مبلغ_جمعه_کاری_یک_روز'] ?? null,
                };

                const yearResult = await yearStatement.executeAsync([
                    normalizedYear,
                    yearRecord.periods ? yearRecord.periods.length : 0,
                ]);

                const yearId = Number(yearResult.lastInsertRowId);

                if (Array.isArray(yearRecord.periods)) {
                    for (const [index, period] of yearRecord.periods.entries()) {
                        const monthlySingleAllowance = period['بن_ماهیانه']?.مجرد ?? null;
                        const monthlyMarriedAllowance = period['بن_ماهیانه']?.متاهل ?? null;
                        const monthlyHousingSingle = period['مسکن_ماهیانه']?.مجرد ?? null;
                        const monthlyHousingMarried = period['مسکن_ماهیانه']?.متاهل ?? null;
                        const formulaIncrease = period['فرمول_افزایش_مزدی'] ?? null;

                        await periodStatement.executeAsync([
                            yearId,
                            index + 1,
                            period['تعداد_ماه_های_کارکرد_سال'] ?? null,
                            periodBaseValues.days_in_year,
                            periodBaseValues.fridays_in_year,
                            periodBaseValues.official_holidays_in_year,
                            periodBaseValues.total_official_holidays,
                            periodBaseValues.total_work_hours_year,
                            periodBaseValues.daily_minimum_wage,
                            periodBaseValues.friday_work_per_day,
                            period['نوبت_کاری_ماهانه']?.['صبح وعصر  10%'] ?? null,
                            period['نوبت_کاری_ماهانه']?.['صبح وعصر وشب  15%'] ?? null,
                            period['نوبت_کاری_ماهانه']?.['صبح  وشب یا عصر وشب   22.5%'] ?? null,
                            period['پایه_سنوات_بعداز_یک_سابقه_کارگر_در_کارگاه'] ?? null,
                            period['مبلغ_اضافه_كاری_یک_ساعت'] ?? null,
                            period['مبلغ_شب_کاری_یک_ساعت'] ?? null,
                            monthlySingleAllowance,
                            monthlyMarriedAllowance,
                            monthlyHousingSingle,
                            monthlyHousingMarried,
                            period['مبلغ_عائله_مندی_به_یک_فرزند_واجد_شرایط'] ?? null,
                            period['مبلغ_حداقل_عیدی_ماهیانه'] ?? null,
                            period['مبلغ_حداکثر_عیدی_ماهیانه'] ?? null,
                            formulaIncrease,
                            period['شماره_و_تاریخ_بخش_نامه_حداقل_مزد'] ?? null,
                            period['حق_تاهل'] ?? null,
                        ]);
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
        const result = await statement.executeAsync<YearRecord>([]);
        const rows = await result.getAllAsync() as YearRecord[];
        await statement.finalizeAsync();
        return rows.map((year) => ({
            ...year,
            year: Math.trunc(Number(year.year)),
        }));
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
        const result = await statement.executeAsync<PeriodRecord>([yearId]);
        const rows = await result.getAllAsync() as PeriodRecord[];
        await statement.finalizeAsync();
        return rows;
    });
}
