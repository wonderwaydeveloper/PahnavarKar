const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../pahnavarkar.db');

console.log('Reset project: فایل دیتابیس و کش پاک می‌شود');

try {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✅ دیتابیس حذف شد:', dbPath);
  } else {
    console.log('⚠️ فایل دیتابیس وجود ندارد، چیزی برای حذف نیست.');
  }
} catch (error) {
  console.error('❌ خطا هنگام حذف دیتابیس:', error);
  process.exit(1);
}

console.log('✅ ریست پروژه انجام شد.');
console.log('برای بارگذاری مجدد دیتابیس، برنامه را اجرا کنید.');
