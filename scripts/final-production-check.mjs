import { mkdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const output = join(root, 'modules', 'rpd-production', 'output');

await mkdir(output, { recursive: true });

const checks = [];

async function check(name, fn) {
  try {
    await fn();
    checks.push([name, true]);
    console.log(`PASS  ${name}`);
  } catch (error) {
    checks.push([name, false]);
    console.error(`FAIL  ${name}`);
    console.error(error?.message ?? error);
  }
}

await check('repository', async () => {
  await stat(join(root, 'package.json'));
});

await check('runtime', async () => {
  await stat(join(root, 'modules', 'rpd-runtime', 'runtime.ts'));
});

await check('renderer', async () => {
  await stat(join(root, 'modules', 'render-intelligence', 'renderer.ts'));
});

await check('production pipeline', async () => {
  await stat(join(root, 'modules', 'rpd-production', 'pipeline.ts'));
});

await check('output directory writable', async () => {
  const file = join(output, '.production-check');
  await import('node:fs/promises').then(({ writeFile, rm }) =>
    writeFile(file, 'ok').then(() => rm(file))
  );
});

console.log('');
console.log('===== PRODUCTION CHECK =====');

const failed = checks.filter(([, ok]) => !ok);

if (failed.length) {
  console.error(`${failed.length} production checks failed.`);
  process.exit(1);
}

console.log('ALL PRODUCTION CHECKS PASS');
