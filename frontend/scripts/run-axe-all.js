const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const htmlDir = path.join(process.cwd(), 'html');
const outDir = path.join(process.cwd(), 'reports', 'axe');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));
for (const f of files) {
  const name = path.basename(f, '.html');
  const url = `http://127.0.0.1:8000/html/${f}`;
  const out = path.join(outDir, `axe-${name}-after-fix.json`);
  console.log('\n=== Scanning', url, '->', out, '===');
  const res = spawnSync('node', ['scripts/run-axe-puppeteer.js', url, out], { stdio: 'inherit', timeout: 180000 });
  if (res.error) console.error('Error scanning', f, res.error.message);
}

console.log('\nAll scans finished. Outputs saved to', outDir);
