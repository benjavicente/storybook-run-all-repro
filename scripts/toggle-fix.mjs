import { readFile, rename, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const mode = process.argv[2];
if (!['apply', 'restore'].includes(mode)) {
  throw new Error('Usage: node scripts/toggle-fix.mjs apply|restore');
}

const packageRoot = new URL('../node_modules/storybook/', import.meta.url);
const { version } = JSON.parse(await readFile(new URL('package.json', packageRoot), 'utf8'));
if (version !== '10.6.5') {
  throw new Error(`Expected Storybook 10.6.5, found ${version}. This helper is version-specific.`);
}

const stock = 'onRunAll: (listener) => universalTestProviderStore2.subscribe("run-all", listener),';
const candidate = `onRunAll: (listener) => universalTestProviderStore2.subscribe("run-all", (_event, info) => {
      if (
        info.actor.environment === "MANAGER" &&
        universalTestProviderStore2.actor.environment === "MANAGER" &&
        info.actor.id !== universalTestProviderStore2.actor.id
      ) return;
      listener();
    }),`;
const [from, to] = mode === 'apply' ? [stock, candidate] : [candidate, stock];
const bundles = ['dist/manager-api/index.js', 'dist/manager/globals-runtime.js'];
const changes = [];
for (const bundle of bundles) {
  const url = new URL(bundle, packageRoot);
  const source = await readFile(url, 'utf8');
  if (source.split(to).length === 2 && !source.includes(from)) continue;
  if (source.split(from).length !== 2 || source.includes(to)) {
    throw new Error(`Unexpected bundle contents: ${bundle}. No changes applied.`);
  }
  changes.push({ url, source: source.replace(from, to) });
}

for (const { url, source } of changes) {
  // Replace the inode so pnpm's shared package-store content is not modified.
  const temporary = fileURLToPath(url) + `.run-all-${process.pid}.tmp`;
  await writeFile(temporary, source);
  await rename(temporary, url);
}
console.log(mode === 'apply' ? 'Candidate Run All guard applied.' : 'Stock Storybook restored.');
console.log('Restart Storybook and hard-refresh every manager tab before testing.');
