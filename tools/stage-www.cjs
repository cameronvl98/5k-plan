// Copies the web app into www/ for Capacitor. No build step: these are the same
// files GitHub Pages serves, minus sw.js (the native shell bundles everything).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const f of ['index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png']) {
  fs.copyFileSync(path.join(root, f), path.join(out, f));
}
if (fs.existsSync(path.join(root, 'fonts'))) fs.cpSync(path.join(root, 'fonts'), path.join(out, 'fonts'), { recursive: true });
console.log('www/ staged:', fs.readdirSync(out).join(', '));
