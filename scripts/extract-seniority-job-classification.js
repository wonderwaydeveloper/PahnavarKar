const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const workbookPath = path.join(__dirname, '..', 'assets', 'data-source', 'data.xlsx');
const outputPath = path.join(__dirname, '..', 'assets', 'data-source', 'seniority-classification.json');

if (!fs.existsSync(workbookPath)) {
  throw new Error(`فایل اکسل پیدا نشد: ${workbookPath}`);
}

const workbook = XLSX.readFile(workbookPath);
const sheetName = 'پایه سنوات طبقه بندی مشاغل';

if (!workbook.SheetNames.includes(sheetName)) {
  throw new Error(`شیت موردنظر پیدا نشد: ${sheetName}`);
}

const worksheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(worksheet, {
  header: 1,
  raw: false,
  blankrows: false,
  defval: '',
});

const yearRow = rows[0] || [];
const increaseRow = rows[1] || [];
const notesRow = rows[2] || [];
const monthCountRow = rows[3] || [];
const dataRows = rows.slice(4).filter((row) => Array.isArray(row) && row.some((cell) => String(cell).trim() !== ''));

const years = [];
const yearMap = new Map();

for (let index = 0; index < yearRow.length; index += 1) {
  const value = String(yearRow[index] ?? '').trim();
  if (!value) continue;

  const year = Number(value);
  if (!Number.isFinite(year)) continue;

  years.push(year);
  yearMap.set(year, index);
}

const yearMeta = {};
const notedYears = new Set();

const extractMonthCount = (value) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;
  // استخراج عدد از "تعداد ماه های کارکرد سال - X ماه"
  const match = trimmed.match(/(\d+)\s*ماه/);
  return match ? Number(match[1]) : null;
};

for (const year of years) {
  const index = yearMap.get(year);
  const rawIncrease = increaseRow[index];
  const numericIncrease = Number(String(rawIncrease ?? '').trim());
  const monthCount1 = extractMonthCount(monthCountRow[index]);
  const monthCount2 = extractMonthCount(monthCountRow[index + 1]);
  const hasMultiPeriod = monthCount1 !== null && monthCount2 !== null;

  const periodMonthCounts = hasMultiPeriod
    ? [monthCount1, monthCount2]
    : null;

  yearMeta[year] = {
    year,
    periodCount: hasMultiPeriod ? 2 : 1,
    percentIncrease: Number.isFinite(numericIncrease) ? numericIncrease : null,
    periodMonthCounts,
  };

  if (hasMultiPeriod) {
    notedYears.add(year);
  }
}

const getNumericCellValue = (value) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed.replace(/٬/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
};

const groups = [];
for (const row of dataRows) {
  const groupValue = row[0];
  const group = Number(String(groupValue ?? '').trim());
  if (!Number.isFinite(group)) continue;

  const values = {};
  for (const year of years) {
    const index = yearMap.get(year);
    const primaryValue = getNumericCellValue(row[index]);
    const periodCount = Number(yearMeta[year]?.periodCount ?? 1);

    if (periodCount === 2) {
      const secondaryValue = getNumericCellValue(row[index + 1]);
      const periodValues = [primaryValue, secondaryValue].filter((value) => value !== null);

      if (periodValues.length > 0) {
        values[year] = periodValues.length === 1 ? periodValues[0] : periodValues;
      }
      continue;
    }

    if (primaryValue !== null) {
      values[year] = primaryValue;
    }
  }

  groups.push({ group, values });
}

const payload = {
  sheet: sheetName,
  years,
  yearCount: years.length,
  groupCount: groups.length,
  multiPeriodYears: [...notedYears],
  yearMeta,
  groups,
  notes: notesRow.filter((cell) => String(cell).trim() !== '').join(' | '),
};

fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8');

console.log(`\n✅ استخراج بهینه‌شده انجام شد\n`);
console.log(`📄 فایل خروجی: ${outputPath}`);
console.log(`📊 تعداد سال‌ها: ${years.length}`);
console.log(`👥 تعداد گروه‌ها: ${groups.length}`);
console.log(`📌 سال‌های دو‌دوره‌ای: ${[...notedYears].join(', ') || 'هیچ'}`);
console.log(`📌 نمونه: گروه 1 -> ${JSON.stringify(groups[0])}`);
