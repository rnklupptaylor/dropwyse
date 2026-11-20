const fs = require('node:fs');
const path = require('node:path');
const { version } = require('../package.json');
const root = path.resolve(__dirname, '..');
const baseline = process.argv.includes('--baseline');
const output = path.join(root, 'build', baseline ? 'baseline' : 'deploy');
const source = fs.readFileSync(path.join(root, 'src/index.html'));
fs.mkdirSync(output, { recursive: true });
if (baseline) {
  fs.writeFileSync(path.join(output, 'index.html'), source);
} else {
  const marker = '<p class="credit-line">';
  const html = source.toString('utf8');
  if (html.split(marker).length !== 2) throw new Error('Expected one credit line for the version');
  fs.writeFileSync(path.join(output, 'index.html'), html.replace(marker, marker + '<span class="app-version">v' + version + ' · </span>'));
}
console.log('Built ' + path.relative(root, output));
