import { type SQLiteDatabase } from 'expo-sqlite';

import { runWithDatabaseLock } from './connection';

const expectedYearColumns = ['id', 'year', 'period_count'];
const expectedPeriodColumns = [
    'id',
    'year_id',
    'period_index',
    'month_count',
    'days_in_year',
    'fridays_in_year',
    'official_holidays_in_year',
    'total_official_holidays',
    'total_work_hours_year',
    'daily_minimum_wage',
    'percent_increase',
    'seniority_base_previous',
    'seniority_base_entitlement',
    'friday_work_per_day',
    'monthly_shift_work_morning_evening_10',
    'monthly_shift_work_morning_evening_night_15',
    'monthly_shift_work_morning_night_or_evening_night_225',
    'seniority_base',
    'overtime_per_hour',
    'night_work_per_hour',
    'monthly_single_allowance',
    'monthly_married_allowance',
    'monthly_housing_single',
    'monthly_housing_married',
    'child_allowance',
    'min_monthly_bonus',
    'max_monthly_bonus',
    'formula_increase',
    'min_wage_decree_reference',
    'marital_allowance',
];

export async function initializeSchema() {
    return runWithDatabaseLock(async (database) => {
        await createTables(database);
        await ensureCompatibleSchema(database);
    });
}

export async function recreateDatabaseTables(database: SQLiteDatabase) {
    await database.execAsync('DROP TABLE IF EXISTS periods;');
    await database.execAsync('DROP TABLE IF EXISTS years;');
    await createTables(database);
}

async function createTables(database: SQLiteDatabase) {
    await database.execAsync(`CREATE TABLE IF NOT EXISTS years (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year INTEGER NOT NULL UNIQUE,
        period_count INTEGER NOT NULL DEFAULT 0
    );`);

    await database.execAsync(`CREATE TABLE IF NOT EXISTS periods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year_id INTEGER NOT NULL,
        period_index INTEGER NOT NULL,
        month_count REAL,
        days_in_year REAL,
        fridays_in_year REAL,
        official_holidays_in_year REAL,
        total_official_holidays REAL,
        total_work_hours_year REAL,
        daily_minimum_wage REAL,
        percent_increase REAL,
        seniority_base_previous REAL,
        seniority_base_entitlement REAL,
        friday_work_per_day REAL,
        monthly_shift_work_morning_evening_10 REAL,
        monthly_shift_work_morning_evening_night_15 REAL,
        monthly_shift_work_morning_night_or_evening_night_225 REAL,
        seniority_base REAL,
        overtime_per_hour REAL,
        night_work_per_hour REAL,
        monthly_single_allowance REAL,
        monthly_married_allowance REAL,
        monthly_housing_single REAL,
        monthly_housing_married REAL,
        child_allowance REAL,
        min_monthly_bonus REAL,
        max_monthly_bonus REAL,
        formula_increase TEXT,
        min_wage_decree_reference TEXT,
        marital_allowance REAL,
        FOREIGN KEY(year_id) REFERENCES years(id) ON DELETE CASCADE
    );`);
}

async function ensureCompatibleSchema(database: SQLiteDatabase) {
    const yearColumns = await getTableColumns(database, 'years');
    const periodColumns = await getTableColumns(database, 'periods');

    const hasExpectedYearColumns = expectedYearColumns.every((column) => yearColumns.includes(column));
    const hasExpectedPeriodColumns = expectedPeriodColumns.every((column) => periodColumns.includes(column));

    if (!hasExpectedYearColumns || !hasExpectedPeriodColumns) {
        await recreateDatabaseTables(database);
    }
}

async function getTableColumns(database: SQLiteDatabase, tableName: string): Promise<string[]> {
    const statement = await database.prepareAsync(`PRAGMA table_info(${tableName});`);

    try {
        const result = await statement.executeAsync<{ name: string }>([]);
        const rows = await result.getAllAsync();
        return rows.map((row) => row.name);
    } finally {
        await statement.finalizeAsync();
    }
}
