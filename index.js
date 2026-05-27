// ============================================================
//   Launcher — تحميل Chrome وتشغيل البوت
// ============================================================

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

// ── مسارات Chrome المحتملة ──────────────────────────────────
const CHROME_PATHS = [
  // Linux Server
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/snap/bin/chromium',
  // Puppeteer cache — Linux
  '/home/container/.cache/puppeteer/chrome/linux-121.0.6167.85/chrome-linux64/chrome',
  '/root/.cache/puppeteer/chrome/linux-121.0.6167.85/chrome-linux64/chrome',
  // Windows
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

// ── البحث عن Chrome ─────────────────────────────────────────
let foundChrome = CHROME_PATHS.find(p => {
  try { return fs.existsSync(p); } catch (_) { return false; }
});

// لو مش موجود، دور في مجلد puppeteer cache
function searchPuppeteerCache() {
  const bases = [
    '/home/container/.cache/puppeteer/chrome',
    '/root/.cache/puppeteer/chrome',
    `${process.env.HOME || ''}/.cache/puppeteer/chrome`,
  ];
  for (const base of bases) {
    if (!fs.existsSync(base)) continue;
    try {
      const versions = fs.readdirSync(base);
      for (const v of versions) {
        const candidates = [
          path.join(base, v, 'chrome-linux64', 'chrome'),
          path.join(base, v, 'chrome-linux', 'chrome'),
          path.join(base, v, 'chrome'),
        ];
        for (const c of candidates) {
          if (fs.existsSync(c)) return c;
        }
      }
    } catch (_) {}
  }
  return null;
}

if (!foundChrome) {
  console.log('🔍 جاري البحث عن Chrome في مجلدات puppeteer...');
  foundChrome = searchPuppeteerCache();
}

// لو مش موجود خالص → حمّله
if (!foundChrome) {
  try {
    console.log('⏳ جاري تحميل متصفح Chrome...');
    execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
    console.log('✅ تم تحميل Chrome!');
    // دور تاني بعد التحميل
    foundChrome = CHROME_PATHS.find(p => { try { return fs.existsSync(p); } catch (_) { return false; } });
    if (!foundChrome) foundChrome = searchPuppeteerCache();
  } catch (err) {
    console.warn('⚠️ تعذّر تحميل Chrome تلقائياً:', err.message);
  }
}

// ── تعيين المسار ────────────────────────────────────────────
if (foundChrome) {
  process.env.PUPPETEER_EXECUTABLE_PATH = foundChrome;
  console.log(`✅ Chrome: ${foundChrome}`);
} else {
  console.warn('⚠️ لم يتم العثور على Chrome — سيحاول puppeteer تلقائياً.');
}

// ── تشغيل البوت ─────────────────────────────────────────────
require('./bot.js');
