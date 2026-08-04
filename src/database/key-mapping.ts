// نگاشت کلیدهای ورودی JSON اکسل به کلیدهای داخلی برنامه
// این نگاشت فقط به منطق دیتابیس/Seed مربوط است و UI را دربر نمی‌گیرد.
export const yearKeyTranslations = {
    سال_كاركرد: 'year',
    تعداد_دوره_ها: 'period_count',
};

// نگاشت کلیدهای دوره‌ای (period) از JSON اکسل به کلیدهای داخلی
// این فیلدها برای هر دوره ذخیره می‌شوند.
export const periodKeyTranslations = {
    تعداد_ماه_های_کارکرد_سال: 'month_count',
    تعداد_روزهای_سال: 'days_in_year',
    تعداد_جمعه_های_سال: 'fridays_in_year',
    تعداد_تعطيلات_رسمی_سال: 'official_holidays_in_year',
    کل_تعطیلات_رسمی_سال: 'total_official_holidays',
    تعداد_ساعات_کارکرد_موظفی_کارگر_در_سال: 'total_work_hours_year',
    مبلغ_حداقل_مزد_روزانه_مصوب_شورای_عالی_کار: 'daily_minimum_wage',
    درصد_افزايش: 'percent_increase',
    پایه_سنواتی_گذشته: 'seniority_base_previous',
    پایه_سنوات_استحقاقی: 'seniority_base_entitlement',
    پایه_سنوات_بعداز_یک_سابقه_کارگر_در_کارگاه: 'seniority_base',
    مبلغ_اضافه_كاری_یک_ساعت: 'overtime_per_hour',
    مبلغ_شب_کاری_یک_ساعت: 'night_work_per_hour',
    مبلغ_جمعه_کاری_یک_روز: 'friday_work_per_day',
    بن_ماهیانه: 'monthly_allowance',
    مسکن_ماهیانه: 'housing_allowance',
    حق_تاهل: 'marital_allowance',
    مبلغ_عائله_مندی_به_یک_فرزند_واجد_شرایط: 'child_allowance',
    مبلغ_حداقل_عیدی_ماهیانه: 'min_monthly_bonus',
    مبلغ_حداکثر_عیدی_ماهیانه: 'max_monthly_bonus',
    فرمول_افزایش_مزدی: 'formula_increase',
    شماره_و_تاریخ_بخش_نامه_حداقل_مزد: 'min_wage_decree_reference',
    مجرد: 'single',
    متاهل: 'married',
};

