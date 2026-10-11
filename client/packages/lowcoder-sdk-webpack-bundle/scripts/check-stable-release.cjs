// Deploy Hooks build a branch head, not a release tag. Fail closed unless that
// exact head is the current stable release and is still the head of main.
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');

function validateRelease(release, head, main, tagCommit) {
  assert.equal(release.draft, false, 'Drafts must not deploy');
  assert.equal(release.prerelease, false, 'Pre-releases must not deploy');
  assert.match(release.tag_name, /^v?\d+\.\d+\.\d+$/, 'Expected a stable version tag');
  assert.equal(head, main, 'Only the current main commit may deploy');
  assert.equal(head, tagCommit, 'Main must point to the exact stable release commit');
}

async function checkStableRelease() {
  const response = await fetch('https://api.github.com/repos/lowcoder-org/lowcoder/releases/latest', {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'lowcoder-sdk-release' },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Cannot verify stable release: HTTP ${response.status}`);
  const release = await response.json();
  // Validate before using the tag in Git arguments.
  assert.match(release.tag_name, /^v?\d+\.\d+\.\d+$/, 'Expected a stable version tag');
  const git = args => execFileSync('git', args, {
    cwd: path.resolve(__dirname, '../../../..'), encoding: 'utf8', timeout: 60000,
  }).trim();
  const head = git(['rev-parse', 'HEAD']);
  // Read both refs together; support lightweight and annotated release tags.
  const refs = git(['ls-remote', 'origin', 'refs/heads/main', `refs/tags/${release.tag_name}`, `refs/tags/${release.tag_name}^{}`]).split('\n');
  const main = (refs.find(line => line.endsWith('refs/heads/main')) || '').split(/\s/)[0];
  const tagLines = refs.filter(line => line.includes('refs/tags/'));
  const tagRef = tagLines.find(line => line.endsWith('^{}')) || tagLines[0];
  const tagCommit = tagRef.split(/\s/)[0];
  validateRelease(release, head, main, tagCommit);
  console.log(`Verified stable release ${release.tag_name} at ${head}`);
  return release;
}

module.exports = { validateRelease, checkStableRelease };
if (require.main === module) checkStableRelease().catch(error => { console.error(error.message); process.exitCode = 1; });
