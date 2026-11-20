const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const pkg = require('../package.json');
for (const args of [['--baseline'], []]) {
  execFileSync(process.execPath, [path.join(root, 'tools/build.cjs'), ...args]);
}
const source = fs.readFileSync(path.join(root, 'src/index.html'));
assert.deepEqual(fs.readFileSync(path.join(root, 'build/baseline/index.html')), source);
const marker = '<p class="credit-line">';
const expected = source.toString('utf8').replace(marker, marker + '<span class="app-version">v' + pkg.version + ' · </span>');
const deployed = fs.readFileSync(path.join(root, 'build/deploy/index.html'), 'utf8');
assert.equal(deployed, expected);
assert.equal(deployed.split('class="app-version"').length, 2);
const bootstrap = source.toString('utf8').match(/const hashLanguage=[\s\S]*?document\.documentElement\.lang=language;/)[0];
for (const [hash, search, expectedLanguage] of [
  ['', '', 'en'], ['#de', '', 'de'], ['', '?lang=de', 'de'],
  ['#en', '?lang=de', 'en'], ['#DE', '?lang=en', 'de'],
  ['#other', '?lang=de', 'de'], ['#other', '?lang=other', 'en']
]) {
  const context = vm.createContext({ location: { hash, search }, URLSearchParams, document: { documentElement: {} } });
  vm.runInContext(bootstrap, context);
  assert.equal(vm.runInContext('language', context), expectedLanguage);
  assert.equal(context.document.documentElement.lang, expectedLanguage);
}
const worker = JSON.parse(fs.readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8'));
assert.equal(worker.name, 'dropwyse');
assert.equal(worker.assets.directory, './build/deploy');
assert.equal(worker.preview_urls, true);
assert.deepEqual(worker.previews, {});
assert(!/@font-face|data:font|file:\/\/\/|[CD]:[\\/]|chatgpt\.com\/(?:c|g)\//i.test(source.toString('utf8')));
assert(fs.readFileSync(path.join(root, '.gitattributes'), 'utf8').includes('src/index.html -text'));
assert.equal(fs.readdirSync(path.join(root, 'docs')).length, 1);
console.log('Migration checks passed: verbatim baseline, version-only deployment change, language links, hosting configuration and publication hygiene.');
