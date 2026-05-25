const fs = require('fs');
const path = require('path');
const srcDir = process.cwd();
const destDir = path.join(process.cwd(), 'reports', 'axe');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
const files = fs.readdirSync(srcDir).filter(f => /^axe-.*\.json$/.test(f));
files.forEach(f => {
  const src = path.join(srcDir, f);
  const dest = path.join(destDir, f);
  try {
    fs.renameSync(src, dest);
    console.log('moved', f);
  } catch (err) {
    console.error('error moving', f, err.message);
  }
});
console.log('done');
