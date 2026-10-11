const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateRelease } = require('../scripts/check-stable-release.cjs');
const stable = { tag_name: 'v3.0.1', draft: false, prerelease: false };
test('only an exact stable main release passes publication checks', () => {
  assert.doesNotThrow(() => validateRelease(stable, 'release', 'release', 'release'));
  for (const invalid of [{ ...stable, draft: true }, { ...stable, prerelease: true }, { ...stable, tag_name: 'v3.0.1-rc1' }]) {
    assert.throws(() => validateRelease(invalid, 'release', 'release', 'release'));
  }
  assert.throws(() => validateRelease(stable, 'feature', 'main', 'feature'));
  assert.throws(() => validateRelease(stable, 'main', 'main', 'older-release'));
  assert.throws(() => validateRelease(stable, 'old-main', 'new-main', 'old-main'));
});
