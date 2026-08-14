const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
const dataSourceDir = path.join(assetsDir, 'data-source');
const candidateExcelFiles = [
    path.join(dataSourceDir, 'data.xlsx'),
    path.join(dataSourceDir, 'data.xls'),
    path.join(assetsDir, 'calculator-data.xlsx'),
    path.join(dataSourceDir, 'calculator-data.xlsx'),
    path.join(dataSourceDir, 'calculator-data.xls'),
    path.join(assetsDir, 'calculator-data.xls'),
];
const preferredSheetNames = [
    'پایه سنوات عادی و داده ها',
    'پایه سنوات عادی',
    'محاسبات عددی',
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
    throw new Error('❌ هیچ فایل Excel پیدا نشد! (data.xlsx یا calculator-data.xlsx / .xls)');
}

console.log('\n📊 تحلیل ساختار هدرهای فایل اکسل\n');
console.log(`📖 فایل: ${excelFile}\n`);

try {
    // خواندن فایل اکسل
    const workbook = XLSX.readFile(excelFile);
    const sheetName = preferredSheetNames.find((name) => workbook.SheetNames.includes(name))
        ?? workbook.SheetNames.find((name) => /داده|کارکرد|مزد|سنوات/i.test(name))
        ?? workbook.SheetNames[0];
    console.log(`📋 شیت: ${sheetName}\n`);

    const worksheet = workbook.Sheets[sheetName];
    
    // خواندن مستقیم از worksheet برای دریافت مقادیر دقیق
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const rows = [];
    
    for (let R = range.s.r; R <= Math.min(range.e.r, 10); R++) { // فقط 10 سطر اول
        const row = [];
        for (let C = range.s.c; C <= range.e.c; C++) {
            const cellAddress = XLSX.utils.encode_col(C) + XLSX.utils.encode_row(R);
            const cell = worksheet[cellAddress];
            
            if (cell === undefined) {
                row.push('');
            } else if (cell.t === 'n') {
                row.push(cell.v);
            } else if (cell.t === 's') {
                row.push(cell.v);
            } else {
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

    console.log(`📈 آمار هدرها:`);
    console.log(`   • هدرهای اصلی: ${mainHeaders.filter(h => h && h !== '__EMPTY').length} ستون`);
    console.log(`   • هدرهای فرعی: ${subHeaders.filter(h => h && h !== '__EMPTY').length} ستون`);
    console.log(`   • کل ستون‌ها: ${mainHeaders.length}\n`);

    // تحلیل ساختار هدرها
    console.log('🔍 تحلیل دقیق هدرها:\n');

    const headerAnalysis = [];
    let prevMain = '';

    for (let colIndex = 0; colIndex < mainHeaders.length; colIndex++) {
        const main = String(mainHeaders[colIndex] || '').trim();
        const sub = String(subHeaders[colIndex] || '').trim();
        
        const hasMainHeader = Boolean(main && main !== '__EMPTY');
        const hasSubHeader = Boolean(sub && sub !== '__EMPTY');
        
        if (!hasMainHeader && !hasSubHeader) {
            continue;
        }

        const mainText = hasMainHeader ? main : prevMain;
        const normalizedMain = mainText.replace(/\s+/g, '_');
        const normalizedSub = hasSubHeader ? sub.replace(/\s+/g, '_') : '';
        
        // تشخیص نوع هدر
        let headerType = '';
        if (!hasSubHeader) {
            headerType = 'سطحی-ساده';
        } else if (normalizedSub === normalizedMain) {
            headerType = 'سطحی-تکراری';
        } else if (normalizedSub.includes(normalizedMain) || normalizedMain.includes(normalizedSub)) {
            headerType = 'سطحی-مشابه';
        } else {
            headerType = 'چندسطحی';
        }

        headerAnalysis.push({
            colIndex: colIndex + 1,
            mainHeader: mainText,
            subHeader: sub,
            normalizedMain,
            normalizedSub,
            hasMainHeader,
            hasSubHeader,
            headerType,
            key: normalizedSub ? `${normalizedMain}_${normalizedSub}` : normalizedMain
        });

        if (hasMainHeader) {
            prevMain = main;
        }
    }

    // گروه‌بندی بر اساس نوع
    const groupedByType = {};
    headerAnalysis.forEach(item => {
        if (!groupedByType[item.headerType]) {
            groupedByType[item.headerType] = [];
        }
        groupedByType[item.headerType].push(item);
    });

    // نمایش نتایج
    console.log('📋 لیست هدرهای یک سطحی (ساده):');
    const singleLevel = groupedByType['سطحی-ساده'] || [];
    singleLevel.forEach(item => {
        console.log(`   ${item.colIndex}. ${item.mainHeader} -> ${item.normalizedMain}`);
    });
    console.log(`   تعداد: ${singleLevel.length}\n`);

    console.log('📋 لیست هدرهای یک سطحی (تکراری):');
    const duplicateLevel = groupedByType['سطحی-تکراری'] || [];
    duplicateLevel.forEach(item => {
        console.log(`   ${item.colIndex}. ${item.mainHeader} / ${item.subHeader} -> ${item.normalizedMain}`);
    });
    console.log(`   تعداد: ${duplicateLevel.length}\n`);

    console.log('📋 لیست هدرهای یک سطحی (مشابه):');
    const similarLevel = groupedByType['سطحی-مشابه'] || [];
    similarLevel.forEach(item => {
        console.log(`   ${item.colIndex}. ${item.mainHeader} / ${item.subHeader} -> ${item.key}`);
    });
    console.log(`   تعداد: ${similarLevel.length}\n`);

    console.log('📋 لیست هدرهای چندسطحی:');
    const multiLevel = groupedByType['چندسطحی'] || [];
    multiLevel.forEach(item => {
        console.log(`   ${item.colIndex}. ${item.mainHeader} / ${item.subHeader} -> ${item.key}`);
    });
    console.log(`   تعداد: ${multiLevel.length}\n`);

    // نمایش نمونه داده‌ها برای بررسی
    console.log('🔎 نمونه داده‌ها برای 3 سطر اول:');
    for (let rowIndex = 2; rowIndex < Math.min(5, rawData.length); rowIndex++) {
        const row = rawData[rowIndex] || [];
        console.log(`\n   سطر ${rowIndex + 1}:`);
        
        // نمایش 5 ستون اول
        for (let colIndex = 0; colIndex < Math.min(5, row.length); colIndex++) {
            const header = headerAnalysis.find(h => h.colIndex === colIndex + 1);
            if (header) {
                const value = row[colIndex];
                console.log(`     ${header.mainHeader}: ${value !== undefined ? value : 'خالی'}`);
            }
        }
    }

    // خلاصه تحلیل
    console.log('\n📊 خلاصه تحلیل:');
    console.log(`   • هدرهای یک سطحی (ساده): ${singleLevel.length}`);
    console.log(`   • هدرهای یک سطحی (تکراری): ${duplicateLevel.length}`);
    console.log(`   • هدرهای یک سطحی (مشابه): ${similarLevel.length}`);
    console.log(`   • هدرهای چندسطحی: ${multiLevel.length}`);
    console.log(`   • کل هدرهای تحلیل شده: ${headerAnalysis.length}`);

    // پیشنهادات برای extract-clean.js
    console.log('\n💡 پیشنهادات برای بهبود extract-clean.js:');
    
    const problematicHeaders = [...similarLevel, ...duplicateLevel].filter(h => 
        h.headerType === 'سطحی-مشابه' || h.headerType === 'سطحی-تکراری'
    );
    
    if (problematicHeaders.length > 0) {
        console.log('   هدرهای مشکل‌ساز که نیاز به اصلاح دارند:');
        problematicHeaders.forEach(item => {
            console.log(`     • "${item.mainHeader}" / "${item.subHeader}" -> باید به عنوان هدر یک سطحی پردازش شود`);
        });
        
        console.log('\n   کد پیشنهادی برای headerAliases در extract-clean.js:');
        console.log('   const headerAliases = {');
        problematicHeaders.forEach(item => {
            const aliasKey = item.normalizedSub ? `${item.normalizedMain}_${item.normalizedSub}` : item.normalizedMain;
            console.log(`       "${aliasKey}": "${item.normalizedMain}",`);
        });
        console.log('   };');
    }

} catch (error) {
    console.error('\n❌ خطا:', error.message, '\n');
    process.exit(1);
}