// Cloudflare Builds entrypoint, run from client/. Keep the tested build and
// asset-retention steps identical for manual and Git-connected releases.
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const client = path.resolve(__dirname, '../../..');
const run = (args) => execFileSync(process.execPath, args, {
  cwd: client,
  stdio: 'inherit',
  env: { ...process.env, NODE_OPTIONS: '--max_old_space_size=6144' },
});
const yarn = '.yarn/releases/yarn-3.6.4.cjs';
run([yarn, 'install', '--immutable']);
run([yarn, 'workspace', 'lowcoder-sdk-webpack-bundle', 'test']);
run([yarn, 'workspace', 'lowcoder-sdk-webpack-bundle', 'build']);
run(['packages/lowcoder-sdk-webpack-bundle/scripts/prepare-release.cjs', 'https://sdk.lowcoder.cloud']);
run(['packages/lowcoder-sdk-webpack-bundle/scripts/check-dist.cjs']);
