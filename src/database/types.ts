// تایپ‌های داده‌ای برای جدول‌های years و periods
// این تعریف‌ها به اپلیکیشن کمک می‌کنند تا مقادیر برگشتی از SQLite
// و seed JSON به صورت تایپ‌دار استفاده شوند.
export interface YearRecord {
    id: number;
    year: number;
    period_count: number;
}

export interface PeriodRecord {
    id: number;
    year_id: number;
    period_index: number;
    month_count: number | null;
    days_in_year: number | null;
    fridays_in_year: number | null;
    official_holidays_in_year: number | null;
    total_official_holidays: number | null;
    total_work_hours_year: number | null;
    daily_minimum_wage: number | null;
    friday_work_per_day: number | null;
    monthly_shift_work_morning_evening_10: number | null;
    monthly_shift_work_morning_evening_night_15: number | null;
    monthly_shift_work_morning_night_or_evening_night_225: number | null;
    seniority_base: number | null;
    overtime_per_hour: number | null;
    night_work_per_hour: number | null;
    monthly_single_allowance: number | null;
    monthly_married_allowance: number | null;
    monthly_housing_single: number | null;
    monthly_housing_married: number | null;
    child_allowance: number | null;
    min_monthly_bonus: number | null;
    max_monthly_bonus: number | null;
    formula_increase?: string | null;
    min_wage_decree_reference?: string | null;
    marital_allowance?: number | null;
}

export interface SeedPeriodRecord {
    'تعداد_ماه_های_کارکرد_سال'?: number | null;
    'تعداد_روزهاي_سال'?: number | null;
    'تعداد_جمعه_های_سال'?: number | null;
    'تعداد_تعطيلات_رسمي_سال'?: number | null;
    'کل_تعطیلات_رسمی_سال'?: number | null;
    'تعداد_ساعات_کارکرد_موظفی_کارگر_در_سال'?: number | null;
    'مبلغ_حداقل_مزد_روزانه_مصوب_شورای_عالی_کار'?: number | null;
    'مبلغ_جمعه_کاری_یک_روز'?: number | null;
    'نوبت_کاری_ماهانه'?: {
        'صبح وعصر  10%'?: number | null;
        'صبح وعصر وشب  15%'?: number | null;
        'صبح  وشب یا عصر وشب   22.5%'?: number | null;
    } | null;
    'پایه_سنوات_بعداز_یک_سابقه_کارگر_در_کارگاه'?: number | null;
    'مبلغ_اضافه_كاری_یک_ساعت'?: number | null;
    'مبلغ_شب_کاری_یک_ساعت'?: number | null;
    'بن_ماهیانه'?: {
        مجرد?: number | null;
        متاهل?: number | null;
    } | null;
    'مسکن_ماهیانه'?: {
        مجرد?: number | null;
        متاهل?: number | null;
    } | null;
    'حق_تاهل'?: number | null;
    'مبلغ_عائله_مندی_به_یک_فرزند_واجد_شرایط'?: number | null;
    'مبلغ_حداقل_عیدی_ماهیانه'?: number | null;
    'مبلغ_حداکثر_عیدی_ماهیانه'?: number | null;
    'فرمول_افزایش_مزدی'?: string | null;
    'شماره_و_تاریخ_بخش_نامه_حداقل_مزد'?: string | null;
}

export interface SeedYearRecord {
    'سال_كاركرد': number | string;
    periods?: SeedPeriodRecord[];
}

export interface SeedData {
    data: SeedYearRecord[];
}
