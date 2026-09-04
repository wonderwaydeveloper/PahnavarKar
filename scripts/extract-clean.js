const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const dataSourceDir = path.join(__dirname, '..', 'assets', 'data-source');
const assetsDir = path.join(__dirname, '..', 'assets');

const candidateExcelFiles = [
    path.join(dataSourceDir, 'data.xlsx'),
    path.join(dataSourceDir, 'data.xls'),
    path.join(dataSourceDir, 'calculator-data.xlsx'),
    path.join(dataSourceDir, 'calculator-data.xls'),
    path.join(assetsDir, 'data.xlsx'),
    path.join(assetsDir, 'calculator-data.xlsx'),
    path.join(assetsDir, 'calculator-data.xls'),
];

const preferredSheetNames = [
    'پایه سنوات عادی و داده ها',
    'پایه سنوات عادی',
    'محاسبات عددی',
    'محاسبات_عددی',
    'پایه سنوات طرح طبقه',
];

let excelFile;
for (const candidate of candidateExcelFiles) {
    if (fs.existsSync(candidate)) {
        excelFile = candidate;
        break;
    }
}

if (!excelFile) {
    throw new Error('❌ هیچ فایل Excel پیدا نشد! (data.xlsx، calculator-data.xlsx یا فایل .xls مربوطه)');
}

if (path.basename(excelFile) !== 'data.xlsx' && fs.existsSync(path.join(dataSourceDir, 'data.xlsx')) && excelFile !== path.join(dataSourceDir, 'data.xlsx')) {
    console.log('⚠️ فایل جدید data.xlsx موجود است و به‌عنوان ورودی اصلی استفاده می‌شود');
}

const outputFile = path.join(dataSourceDir, 'calculator-data.json');

if (!fs.existsSync(dataSourceDir)) {
    fs.mkdirSync(dataSourceDir, { recursive: true });
}

console.log('\n📊 استخراج دقیق داده‌های فایل اکسل\n');
console.log(`📖 فایل: ${excelFile}\n`);

try {
    // خواندن فایل اکسل
    const workbook = XLSX.readFile(excelFile);

    const selectedSheetName = preferredSheetNames.find((name) => workbook.SheetNames.includes(name))
        ?? workbook.SheetNames.find((name) => /داده|کارکرد|مزد|سنوات/i.test(name))
        ?? workbook.SheetNames[0];

    const sheetName = selectedSheetName;

    console.log(`📋 شیت: ${sheetName}\n`);

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
        'پایه_سنواتی_جاری': 'پایه_سنواتی_جاری',
        'پایه_سنواتی_جاری_پایه_سنواتی_جاری': 'پایه_سنواتی_جاری',
        'درصد_افزايش_درصد_افزايش': 'درصد_افزايش',
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
        
        // بررسی می‌کنیم که آیا هدر فرعی معتبر است یا خیر
        // اگر هدر فرعی همان هدر اصلی باشد یا مشابه آن باشد، آن را نادیده می‌گیریم
        const isDuplicateSubHeader = normalizedSub === normalizedMain || 
                                     normalizedSub === '' || 
                                     normalizedSub === '__EMPTY' ||
                                     // هدرهای فرعی که مشابه هدر اصلی هستند
                                     (normalizedSub && (
                                       // شامل هدر اصلی باشد
                                       normalizedSub.includes(normalizedMain) ||
                                       normalizedMain.includes(normalizedSub) ||
                                       // تغییرات کوچک در کاراکترها
                                       normalizedSub.replace(/ي|ی/g, 'ی') === normalizedMain.replace(/ي|ی/g, 'ی') ||
                                       // برای موارد خاص شناخته شده
                                       normalizedSub === 'پایه_سنواتي_گذشته' ||
                                       normalizedSub === 'درصد_افزايش'
                                     ));
        
        const rawKey = !isDuplicateSubHeader && normalizedSub ? 
                       `${normalizedMain}_${normalizedSub}` : normalizedMain;
        const fullKey = (headerAliases[rawKey] || rawKey).replace(/\s+/g, '_');
        const key = headerAliases[normalizedMain] || normalizedMain;
        
        // ستون زمانی nested است که هدر فرعی معتبر و متفاوت از هدر اصلی داشته باشد
        const isNested = !isDuplicateSubHeader && Boolean(normalizedSub);

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
                        // ستون‌های دو سطحی: اضافه به periodLevelKeys و periodLevelGroups
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
                        // ستون‌های یک سطحی: فقط اضافه به periodLevelKeys
                        if (!periodLevelKeys.includes(fullKey)) {
                            periodLevelKeys.push(fullKey);
                        }
                        // ستون‌های یک سطحی نباید در periodLevelGroups قرار گیرند
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

        // بررسی ردیف کاملاً خالی (همه سلول‌ها خالی)
        const isEmptyRow = row.every(cell => 
            cell === null || cell === undefined || cell === '' || String(cell).trim() === ''
        );
        
        // بررسی ردیف تقریباً خالی (فقط چند ستون اول خالی هستند)
        // سطرهایی که فقط در ستون‌های اولیه (سال و ماه) خالی هستند اما بقیه ستون‌ها داده دارند
        // باید با دقت بیشتری بررسی شوند
        const hasYear = row[0] !== null && row[0] !== undefined && String(row[0]).trim() !== '';
        const hasMonth = row[1] !== null && row[1] !== undefined && String(row[1]).trim() !== '';
        
        // ردیف‌های کاملاً خالی را نادیده می‌گیریم
        if (isEmptyRow) {
            console.log(`⚠️ ردیف کاملاً خالی ${rowIndex + 1} نادیده گرفته شد`);
            continue;
        }

        // اگر ردیف سال ندارد اما ماه دارد، این یک خطا در داده است
        // برای سازگاری با داده‌های فعلی، اگر ماه دارد آن را پردازش می‌کنیم
        const record = {};

        // پردازش ستون‌ها - بدون تغییر
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
            const def = keyMap[colIndex];
            if (!def) continue;

            const value = row[colIndex];
            const normalizedValue = value === '' || value === undefined || value === null || String(value).trim() === '' ? null : value;

            if (def.isNested) {
                // ستون‌های دو سطحی (مثل نوبت کاری ماهیانه)
                if (!record[def.normalizedMain] || typeof record[def.normalizedMain] !== 'object') {
                    record[def.normalizedMain] = {};
                }
                record[def.normalizedMain][def.sub] = normalizedValue;
            } else {
                // ستون‌های یک سطحی
                // از def.key استفاده می‌کنیم که ممکن است alias شده باشد
                record[def.key] = normalizedValue;
            }
        }

        // مدیریت ردیف‌های بدون سال
        if (!record['سال_كاركرد'] && lastYear !== null) {
            // اگر ردیف سال ندارد اما ماه کارکرد دارد، از سال قبلی استفاده می‌کنیم
            // این برای سال‌های چنددوره‌ای ضروری است
            if (record['تعداد_ماه_کارکرد'] !== null || row[1] !== undefined) {
                record['سال_كاركرد'] = lastYear;
                console.log(`   ➕ ردیف ${rowIndex + 1}: سال از ${lastYear} تکمیل شد (چنددوره‌ای)`);
            }
        } else if (record['سال_كاركرد']) {
            lastYear = record['سال_كاركرد'];
        }

        // اگر بعد از تکمیل هم سال نداشت، ردیف را نادیده می‌گیریم
        if (!record['سال_كاركرد']) {
            console.log(`⚠️ ردیف ${rowIndex + 1} بدون سال نادیده گرفته شد`);
            continue;
        }

        // ردیف‌های ناقص/زباله‌ای که فقط متادیتا یا رفرنس‌های بی‌معنی دارند
        // نباید به عنوان دورهٔ جدید محسوب شوند؛ حداقل باید یک مقدار عددی اصلی دوره وجود داشته باشد.
        const meaningfulPeriodFields = new Set([
            'تعداد_ماه_های_کارکرد_سال',
            'تعداد_روزهای_سال',
            'تعداد_جمعه_های_سال',
            'تعداد_تعطيلات_رسمی_سال',
            'کل_تعطیلات_رسمی_سال',
            'تعداد_ساعات_کارکرد_موظفی_کارگر_در_سال',
            'مبلغ_حداقل_مزد_روزانه_مصوب_شورای_عالی_کار',
            'درصد_افزايش',
            'پایه_سنواتی_جاری',
            'مبلغ_اضافه_كاری_یک_ساعت',
            'مبلغ_شب_کاری_یک_ساعت',
            'مبلغ_جمعه_کاری_یک_روز',
            'حق_تاهل',
            'مبلغ_عائله_مندی_یک_فرزند_واجد_شرایط',
            'مبلغ_حداقل_عیدی_پاداش_ماهیانه',
            'مبلغ_حداکثر_عیدی_پاداش_ماهیانه'
        ]);

        const hasMeaningfulPeriodData = Object.entries(record).some(([key, value]) => {
            if (key === 'سال_كاركرد') return false;
            if (value === null || value === undefined || value === '') return false;

            if (typeof value === 'object') {
                return Object.values(value).some(nestedValue => {
                    if (nestedValue === null || nestedValue === undefined || nestedValue === '') return false;
                    return typeof nestedValue === 'number' && Number.isFinite(nestedValue);
                });
            }

            if (meaningfulPeriodFields.has(key)) {
                return typeof value === 'number' && Number.isFinite(value);
            }

            return false;
        });

        if (!hasMeaningfulPeriodData) {
            console.log(`⚠️ ردیف ${rowIndex + 1} بدون دادهٔ واقعی دوره نادیده گرفته شد`);
            continue;
        }

        records.push(record);
    }

    console.log(`✓ کل ردیف‌های خوانده‌شده: ${records.length}\n`);

    // فیلتر کردن رکوردهایی که واقعاً داده دارند
    const validRecords = records.filter(record => {
        // بررسی می‌کنیم که رکورد حداقل یک فیلد غیر null داشته باشد
        const hasValidData = Object.values(record).some(value => 
            value !== null && value !== undefined && String(value).trim() !== ''
        );
        return hasValidData;
    });

    console.log(`✓ رکوردهای معتبر بعد از فیلتر: ${validRecords.length}\n`);
    
    // نمایش اطلاعات درباره حذف رکوردها
    if (records.length !== validRecords.length) {
        console.log(`⚠️ ${records.length - validRecords.length} رکورد نامعتبر حذف شدند\n`);
    }

    // گروپ‌بندی بر اساس سال
    const yearMap = new Map();
    
    validRecords.forEach(record => {
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
                if (Object.prototype.hasOwnProperty.call(entry, key)) {
                    period[key] = entry[key];
                    delete entry[key];
                } else {
                    period[key] = null;
                }
            });
            
            periods.push(period);
            
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

            yearRecords.forEach((record, index) => {
                const period = {};

                periodLevelKeys.forEach(key => {
                    const value = record[key];
                    const hasValue = value !== undefined && value !== null && String(value).trim() !== '';

                    if (hasValue) {
                        period[key] = value;
                        lastSeenValues[key] = value;
                    } else if (carryForwardFields.has(key) && lastSeenValues[key] !== undefined) {
                        period[key] = lastSeenValues[key];
                    } else {
                        period[key] = null;
                    }
                });

                periods.push(period);
            });
            
            // حذف فیلدهای دوره‌ای از entry
            periodLevelKeys.forEach(key => {
                delete entry[key];
            });
            
            // اگر دوره‌ای باقی نمانده، آن را سال تک‌دوره‌ای می‌کنیم
            if (periods.length === 0) {
                console.log(`⚠️ سال ${year} بدون دوره معتبر، به تک‌دوره‌ای تبدیل شد`);
                entry.periods = [{}];
                entry['تعداد_دوره_ها'] = 1;
            } else {
                entry.periods = periods;
                entry['تعداد_دوره_ها'] = periods.length;
            }
            
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
