const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const dataSourceDir = path.join(__dirname, '..', 'assets', 'data-source');

// فقط استخراج از calculator-data.xls
const excelFile = path.join(dataSourceDir, 'calculator-data.xls');

if (!fs.existsSync(excelFile)) {
    throw new Error('❌ فایل calculator-data.xls پیدا نشد!');
}

const outputFile = path.join(dataSourceDir, 'calculator-data.json');
const sheetName = 'محاسبات سالانه';

if (!fs.existsSync(dataSourceDir)) {
    fs.mkdirSync(dataSourceDir, { recursive: true });
}

console.log('\n📊 استخراج دقیق داده‌های فایل اکسل\n');
console.log(`📖 فایل: ${excelFile}`);
console.log(`📋 شیت: ${sheetName}\n`);

try {
    // خواندن فایل اکسل
    const workbook = XLSX.readFile(excelFile);

    if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(`❌ شیت "${sheetName}" پیدا نشد!`);
    }

    const worksheet = workbook.Sheets[sheetName];
    
    // خواندن مستقیم از worksheet برای دریافت مقادیر دقیق
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const rows = [];
    
    for (let R = range.s.r; R <= range.e.r; R++) {
        const row = [];
        for (let C = range.s.c; C <= range.e.c; C++) {
            const cellAddress = XLSX.utils.encode_col(C) + XLSX.utils.encode_row(R);
            const cell = worksheet[cellAddress];
            
            if (cell === undefined) {
                row.push('');
            } else if (cell.t === 'n') {
                // عدد - مقدار دقیق
                row.push(cell.v);
            } else if (cell.t === 's') {
                // رشته
                row.push(cell.v);
            } else {
                // سایر انواع
                row.push(cell.v !== undefined ? cell.v : '');
            }
        }
        rows.push(row);
    }

    const rawData = rows;

    if (rawData.length < 3) {
        throw new Error('❌ فایل اکسل بدون داده است!');
    }

    // استخراج هدرها
    const mainHeaders = rawData[0] || [];
    const subHeaders = rawData[1] || [];

    console.log(`✓ هدرهای اصلی: ${mainHeaders.filter(h => h).length} ستون`);
    console.log(`✓ هدرهای فرعی: ${subHeaders.filter(h => h).length} ستون\n`);

    // بررسی تغییرات ستون‌ها در مقایسه با baseline
    const normalizeHeaderKey = (mainText, subText, prevMainText) => {
        const mainTrim = String(mainText || '').trim();
        const subTrim = String(subText || '').trim();
        const prevMainTrim = String(prevMainText || '').trim();

        if (mainTrim === '' || mainTrim === '__EMPTY') {
            if (!subTrim) return '';
            return `${prevMainTrim}_${subTrim}`.replace(/\s+/g, '_');
        }

        if (subTrim && subTrim !== '__EMPTY') {
            return `${mainTrim}_${subTrim}`.replace(/\s+/g, '_');
        }

        return mainTrim.replace(/\s+/g, '_');
    };

    const currentHeaderKeys = [];
    let prevMain = '';
    for (let colIndex = 0; colIndex < mainHeaders.length; colIndex++) {
        const main = mainHeaders[colIndex];
        const sub = subHeaders[colIndex];
        const key = normalizeHeaderKey(main, sub, prevMain);
        if (key) {
            currentHeaderKeys.push(key);
        }
        const mainTrim = String(main || '').trim();
        if (mainTrim && mainTrim !== '__EMPTY') {
            prevMain = mainTrim;
        }
    }

    const headerAliases = {
        'پایه_سنواتی_جاری': 'پایه_سنوات_بعداز_یک_سابقه_کارگر_در_کارگاه'
    };

    // ایجاد نقشه کلیدهای JSON - ترتیب اصلی از اکسل
    const keyMap = {};
    const allKeys = [];
    const yearLevelKeys = [];
    const periodLevelKeys = [];
    const periodLevelGroups = {};

    let prevMainForMap = '';
    for (let colIndex = 0; colIndex < mainHeaders.length; colIndex++) {
        const main = String(mainHeaders[colIndex] || '').trim();
        const sub = String(subHeaders[colIndex] || '').trim();
        const hasMainHeader = Boolean(main && main !== '__EMPTY');
        const hasSubHeader = Boolean(sub && sub !== '__EMPTY');

        if (!hasMainHeader && !hasSubHeader) {
            continue;
        }

        const mainText = hasMainHeader ? main : prevMainForMap;
        const normalizedMain = mainText.replace(/\s+/g, '_');
        const normalizedSub = hasSubHeader ? sub.replace(/\s+/g, '_') : '';
        const rawKey = normalizedSub ? `${normalizedMain}_${normalizedSub}` : normalizedMain;
        const fullKey = (headerAliases[rawKey] || rawKey).replace(/\s+/g, '_');
        const key = headerAliases[normalizedMain] || normalizedMain;
        const isNested = Boolean(normalizedSub);

        if (hasMainHeader) {
            prevMainForMap = main;
        }

        if (fullKey) {
            keyMap[colIndex] = {
                key,
                fullKey,
                main: mainText,
                sub: sub !== '__EMPTY' ? sub : '',
                normalizedMain,
                normalizedSub,
                isNested
            };
            
            if (!allKeys.includes(fullKey)) {
                allKeys.push(fullKey);

                // شناسایی نوع فیلد - ترتیب اصلی
                // فیلدهای زیر به‌عنوان داده‌های سالیانه در خروجی قبلی قرار می‌گرفتند،
                // اما اکنون مطابق نیاز، در سطح دوره ذخیره می‌شوند.
                const yearFieldKeys = new Set([
                    'سال_كاركرد'
                ]);

                const isYearField = yearFieldKeys.has(key);

                if (isYearField) {
                    if (!yearLevelKeys.includes(key)) {
                        yearLevelKeys.push(key);
                    }
                } else if (key !== 'سال_كاركرد') {
                    if (isNested) {
                        if (!periodLevelKeys.includes(key)) {
                            periodLevelKeys.push(key);
                        }
                        if (!periodLevelGroups[key]) {
                            periodLevelGroups[key] = [];
                        }
                        if (normalizedSub && !periodLevelGroups[key].includes(normalizedSub)) {
                            periodLevelGroups[key].push(normalizedSub);
                        }
                    } else {
                        if (!periodLevelKeys.includes(fullKey)) {
                            periodLevelKeys.push(fullKey);
                        }
                    }
                }
            }
        }
    }

    // استخراج و پردازش داده‌ها
    const records = [];
    let lastYear = null;

    for (let rowIndex = 2; rowIndex < rawData.length; rowIndex++) {
        const row = rawData[rowIndex] || [];

        // بررسی ردیف خالی
        const isEmptyRow = row.every(cell => 
            cell === null || cell === undefined || cell === ''
        );
        if (isEmptyRow) continue;

        const record = {};

        // پردازش ستون‌ها - بدون تغییر
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
            const def = keyMap[colIndex];
            if (!def) continue;

            const value = row[colIndex];
            const normalizedValue = value === '' || value === undefined ? null : value;

            if (def.isNested) {
                if (!record[def.normalizedMain] || typeof record[def.normalizedMain] !== 'object') {
                    record[def.normalizedMain] = {};
                }
                record[def.normalizedMain][def.sub] = normalizedValue;
            } else {
                record[def.key] = normalizedValue;
            }
        }

        // مدیریت ردیف‌های بدون سال
        if (!record['سال_كاركرد'] && lastYear !== null) {
            record['سال_كاركرد'] = lastYear;
        } else if (record['سال_كاركرد']) {
            lastYear = record['سال_كاركرد'];
        }

        if (!record['سال_كاركرد']) continue;

        records.push(record);
    }

    console.log(`✓ کل ردیف‌های خوانده‌شده: ${records.length}\n`);

    // گروپ‌بندی بر اساس سال
    const yearMap = new Map();
    
    records.forEach(record => {
        const year = record['سال_كاركرد'];
        if (!yearMap.has(year)) {
            yearMap.set(year, []);
        }
        yearMap.get(year).push(record);
    });

    // تشخیص سال‌های چند‌دوره‌ای
    const multiPeriodYears = [];
    yearMap.forEach((records, year) => {
        if (records.length > 1) {
            multiPeriodYears.push({ year, periods: records.length });
        }
    });

    if (!yearLevelKeys.includes('تعداد_دوره_ها')) {
        yearLevelKeys.push('تعداد_دوره_ها');
    }

    // آماده‌سازی نتیجه نهایی
    const result = {
        metadata: {
            sheet: sheetName,
            extractedAt: new Date().toISOString(),
            totalYears: yearMap.size,
            singlePeriodYears: yearMap.size - multiPeriodYears.length,
            multiPeriodYears: multiPeriodYears.length,
            multiPeriodYearsList: multiPeriodYears,
            yearLevelKeys: yearLevelKeys,
            periodLevelKeys: periodLevelKeys,
            periodLevelGroups: periodLevelGroups
        },
        data: []
    };

    // سازماندهی داده‌های سال به صورت ساختار نهایی
    const finalData = [];
    
    yearMap.forEach((yearRecords, year) => {
        if (yearRecords.length === 1) {
            // سال تک‌دوره‌ای
            const record = yearRecords[0];
            const entry = { ...record };
            
            // جداسازی فیلدهای دوره‌ای
            const periods = [];
            const period = {};
            
            periodLevelKeys.forEach(key => {
                if (entry[key] !== undefined) {
                    period[key] = entry[key];
                    delete entry[key];
                }
            });
            
            if (Object.keys(period).length > 0) {
                periods.push(period);
            }
            
            entry.periods = periods;
            entry['تعداد_دوره_ها'] = periods.length;
            
            finalData.push(entry);
        } else {
            // سال چند‌دوره‌ای
            const firstRecord = yearRecords[0];
            const entry = { ...firstRecord };
            
            // جمع‌آوری تمام دوره‌ها
            const carryForwardFields = new Set([
                'شماره_و_تاریخ_بخش_نامه_حداقل_مزد'
            ]);
            const periods = [];
            const lastSeenValues = {};

            yearRecords.forEach(record => {
                const period = {};

                periodLevelKeys.forEach(key => {
                    const value = record[key];
                    const hasValue = value !== undefined && value !== null && String(value).trim() !== '';

                    if (hasValue) {
                        period[key] = value;
                        lastSeenValues[key] = value;
                    } else if (carryForwardFields.has(key) && lastSeenValues[key] !== undefined) {
                        period[key] = lastSeenValues[key];
                    }
                });

                periods.push(period);
            });
            
            // حذف فیلدهای دوره‌ای از entry
            periodLevelKeys.forEach(key => {
                delete entry[key];
            });
            
            entry.periods = periods;
            entry['تعداد_دوره_ها'] = periods.length;
            
            finalData.push(entry);
        }
    });

    result.data = finalData;

    // نوشتن به فایل
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');

    // نمایش نتیجه
    if (multiPeriodYears.length > 0) {
        console.log(`✅ نتیجه:\n`);
        console.log(`   سال‌های کل: ${yearMap.size}`);
        console.log(`   - تک‌دوره‌ای: ${yearMap.size - multiPeriodYears.length}`);
        console.log(`   - چند‌دوره‌ای: ${multiPeriodYears.length}`);

        console.log(`\n   سال‌های چند‌دوره‌ای:`);
        multiPeriodYears.forEach(y => {
            console.log(`      • ${y.year}: ${y.periods} دوره`);
        });
    }

    console.log(`\n   فیلدهای سطح سال: ${yearLevelKeys.length}`);
    console.log(`   فیلدهای سطح دوره: ${periodLevelKeys.length}`);

    console.log(`\n📁 ذخیره‌شده: ${outputFile}\n`);

} catch (error) {
    console.error('\n❌ خطا:', error.message, '\n');
    process.exit(1);
}
