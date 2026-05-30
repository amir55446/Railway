// ============================================================
//   Launcher — تحديث yt-dlp + تحميل Chrome + تشغيل البوت
// ============================================================

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const { updateYtDlp } = require('./update-ytdlp');

// ── مسارات Chrome المحتملة ──────────────────────────────────
const CHROME_PATHS = [
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/snap/bin/chromium',
  '/home/container/.cache/puppeteer/chrome/linux-121.0.6167.85/chrome-linux64/chrome',
  '/root/.cache/puppeteer/chrome/linux-121.0.6167.85/chrome-linux64/chrome',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

function searchPuppeteerCache() {
  const bases = [
    '/home/container/.cache/puppeteer/chrome',
    '/root/.cache/puppeteer/chrome',
    `${process.env.HOME || ''}/.cache/puppeteer/chrome`,
  ];
  for (const base of bases) {
    if (!fs.existsSync(base)) continue;
    try {
      for (const v of fs.readdirSync(base)) {
        for (const c of [
          path.join(base, v, 'chrome-linux64', 'chrome'),
          path.join(base, v, 'chrome-linux', 'chrome'),
          path.join(base, v, 'chrome'),
        ]) {
          if (fs.existsSync(c)) return c;
        }
      }
    } catch (_) {}
  }
  return null;
}

async function main() {
  // ── 1. تحديث yt-dlp ───────────────────────────────────────
  await updateYtDlp();

  // ── 2. البحث عن Chrome ────────────────────────────────────
  let foundChrome = CHROME_PATHS.find(p => { try { return fs.existsSync(p); } catch (_) { return false; } });
  if (!foundChrome) foundChrome = searchPuppeteerCache();

  if (!foundChrome) {
    try {
      console.log('⏳ جاري تحميل Chrome...');
      execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
      foundChrome = CHROME_PATHS.find(p => { try { return fs.existsSync(p); } catch (_) { return false; } });
      if (!foundChrome) foundChrome = searchPuppeteerCache();
    } catch (err) {
      console.warn('⚠️ تعذّر تحميل Chrome:', err.message);
    }
  }

  if (foundChrome) {
    process.env.PUPPETEER_EXECUTABLE_PATH = foundChrome;
    console.log(`✅ Chrome: ${foundChrome}`);
  } else {
    console.warn('⚠️ لم يتم العثور على Chrome — سيحاول puppeteer تلقائياً.');
  }

  // ── 3. تشغيل البوت ────────────────────────────────────────
  require('./bot.js');
}

main().catch(err => {
  console.error('❌ فشل تشغيل البوت:', err.message);
  process.exit(1);
});
