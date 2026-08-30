#!/usr/bin/env node

/**
 * این اسکریپت دیتابیس را ریست می‌کند تا seed جدید اجرا شود.
 * استفاده: node scripts/reset-db.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// مسیر دیتابیس Expo
const dbPath = path.join(
  os.homedir(),
  'Library',
  'Application Support',
  'Expo'
);

// یا برای Windows
const windowsDbPath = path.join(
  os.homedir(),
  'AppData',
  'Local',
  'Expo'
);

console.log('⚠️  برای ریست کامل DB:');
console.log('۱. اپلیکیشن را ببند');
console.log('۲. اپلیکیشن را دوباره باز کن تا seed جدید اجرا شود');
console.log('۳. اگر مسائلی باقی ماند، این دایرکتوری را پاک کن:');
console.log(`   ${dbPath} (macOS)`);
console.log(`   ${windowsDbPath} (Windows)`);
console.log('');
console.log('✅ seedVersion از ۴ به ۵ تغییر کرده است');
console.log('✅ دستور npm start یا eas build دوباره seed را اجرا می‌کند');
