// ============================================================
//   تحديث yt-dlp تلقائياً عند تشغيل البوت
//   يُستدعى من index.js قبل تشغيل bot.js
// ============================================================

const { execSync, exec } = require('child_process');

function updateYtDlp() {
  return new Promise((resolve) => {
    console.log('🔄 جاري تحديث yt-dlp...');

    const commands = [
      // طريقة 1: pip3
      'pip3 install -U yt-dlp --break-system-packages',
      // طريقة 2: pip
      'pip install -U yt-dlp --break-system-packages',
      // طريقة 3: python3 -m pip
      'python3 -m pip install -U yt-dlp --break-system-packages',
    ];

    let tried = 0;

    function tryNext() {
      if (tried >= commands.length) {
        // كل طرق pip فشلت → جرب self-update للـ binary
        exec('yt-dlp -U', { timeout: 60000 }, (err, stdout) => {
          if (!err) {
            console.log('✅ yt-dlp تم تحديثه (binary self-update)');
          } else {
            console.warn('⚠️ فشل تحديث yt-dlp — هيشتغل بالإصدار الحالي');
          }
          resolve();
        });
        return;
      }

      const cmd = commands[tried++];
      exec(cmd, { timeout: 120000 }, (err, stdout, stderr) => {
        if (!err) {
          // تحقق من الإصدار بعد التحديث
          try {
            const version = execSync('yt-dlp --version', { timeout: 10000 }).toString().trim();
            console.log(`✅ yt-dlp تم تحديثه: v${version}`);
          } catch (_) {
            console.log('✅ yt-dlp تم تحديثه');
          }
          resolve();
        } else {
          tryNext();
        }
      });
    }

    tryNext();
  });
}

module.exports = { updateYtDlp };
