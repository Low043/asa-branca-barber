const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');

const userArgs = process.argv.slice(2);
const hasConfigArg = userArgs.some(
  (arg) => arg === '--config' || arg.startsWith('--config='),
);

const configPath = resolve(__dirname, './prisma.config.js');
const prismaCli = require.resolve('prisma/build/index.js');
const args = hasConfigArg ? userArgs : ['--config', configPath, ...userArgs];

const result = spawnSync(process.execPath, [prismaCli, ...args], {
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
