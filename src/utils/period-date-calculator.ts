/**
 * محاسبه‌ی بازه‌ی زمانی دوره‌های حقوقی بر اساس تقویم جلالی
 */

export interface PeriodDateRange {
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
    displayText: string; // مثال: "۱۳۹۲/۰۱/۰۱ - ۱۳۹۲/۰۴/۳۰"
}

/**
 * محاسبه روز‌های موجود در ماه جلالی
 */
function getDaysInJalaaliMonth(month: number, year: number): number {
    if (month < 1 || month > 12) {
        throw new Error(`Invalid month: ${month}`);
    }

    // ماه‌های ۱ تا ۶: ۳۱ روز
    if (month <= 6) {
        return 31;
    }

    // ماه‌های ۷ تا ۱۱: ۳۰ روز
    if (month <= 11) {
        return 30;
    }

    // ماه ۱۲: ۲۹ روز (یا ۳۰ در سال‌های کبیسه)
    // سال کبیسه در جلالی: سال % 33 === 1، 5، 9، 13، 17، 22، 26، 30
    const mod = year % 33;
    return [1, 5, 9, 13, 17, 22, 26, 30].includes(mod) ? 30 : 29;
}

/**
 * تبدیل شماره‌ی ماه و روز را برای دوره‌ی مشخص محاسبه کن
 * @param year سال جلالی
 * @param periodIndex شماره‌ی دوره (۱ یا ۲)
 * @param monthCounts آرایه‌ی تعداد ماه‌های هر دوره
 * @returns {startMonth, startDay, endMonth, endDay, displayText}
 */
export function calculatePeriodDateRange(
    year: number,
    periodIndex: number,
    monthCounts: (number | null)[]
): PeriodDateRange {
    if (periodIndex < 1 || periodIndex > monthCounts.length) {
        throw new Error(`Invalid period index: ${periodIndex}`);
    }

    // محاسبه‌ی شروع ماه این دوره
    let startMonth = 1;
    for (let i = 0; i < periodIndex - 1; i++) {
        const count = monthCounts[i];
        if (typeof count === 'number') {
            startMonth += count;
        }
    }

    const startDay = 1;

    // محاسبه‌ی پایان ماه این دوره
    const monthCount = monthCounts[periodIndex - 1];
    if (typeof monthCount !== 'number' || monthCount <= 0) {
        throw new Error(`Invalid month count for period ${periodIndex}: ${monthCount}`);
    }

    let endMonth = startMonth + monthCount - 1;

    // اگر از سال تجاوز کرد (خیلی نادر)
    if (endMonth > 12) {
        endMonth = endMonth % 12 || 12;
    }

    const endDay = getDaysInJalaaliMonth(endMonth, year);

    // فرمت نمایش
    const padNumber = (n: number) => String(n).padStart(2, '0');
    const persianDigits = (s: string) =>
        s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

    const displayText = persianDigits(
        `${year}/${padNumber(startMonth)}/${padNumber(startDay)} - ${year}/${padNumber(endMonth)}/${padNumber(endDay)}`
    );

    return {
        startMonth,
        startDay,
        endMonth,
        endDay,
        displayText,
    };
}

/**
 * محاسبه بازه‌ی تاریخ‌ی برای تمام دوره‌های یک سال
 */
export function calculateAllPeriodDateRanges(
    year: number,
    monthCounts: (number | null)[]
): PeriodDateRange[] {
    return monthCounts
        .map((_, index) => {
            try {
                return calculatePeriodDateRange(year, index + 1, monthCounts);
            } catch {
                return null;
            }
        })
        .filter((range): range is PeriodDateRange => range !== null);
}
