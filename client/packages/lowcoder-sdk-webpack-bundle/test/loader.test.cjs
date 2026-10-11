const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/loader.js'), 'utf8').replace('__SDK_FILES__', JSON.stringify(['assets/runtime.abc.js', 'assets/vendor.def.js', 'assets/main.ghi.js']));
function page() {
  const scripts = [], events = [];
  const window = { dispatchEvent(event) { events.push(event.type); } };
  const context = vm.createContext({ window, URL, Promise, CustomEvent: class { constructor(type) { this.type = type; } }, console: { error() {} }, document: {
    currentScript: { src: 'https://preview.example/versions/3/bundle.js', nonce: 'nonce-value' },
    createElement: () => ({}), head: { appendChild(script) { scripts.push(script); } },
  }});
  vm.runInContext(source, context);
  return { window, scripts, events, context };
}
test('fetches every chunk immediately, preserves evaluation order, origin, path and CSP nonce', async () => {
  const p = page();
  assert.equal(p.scripts.length, 3);
  p.scripts.forEach(s => { assert.equal(s.async, false); assert.equal(s.nonce, 'nonce-value'); assert.equal(s.crossOrigin, 'anonymous'); });
  assert.equal(p.scripts[0].src, 'https://preview.example/versions/3/assets/runtime.abc.js');
  let ready = false;
  p.window.LowcoderSDK.ready.then(() => { ready = true; });
  p.scripts[2].onload(); p.scripts[1].onload();
  await Promise.resolve(); assert.equal(ready, false);
  p.window.LowcoderSDK.mount = () => {};
  p.scripts[0].onload();
  assert.equal(await p.window.LowcoderSDK.ready, p.window.LowcoderSDK);
  assert.deepEqual(p.events, ['lowcoder:ready']);
});
test('duplicate bundle tags share one runtime and one readiness promise', () => {
  const p = page(), promise = p.window.LowcoderSDK.ready;
  vm.runInContext(source, p.context);
  assert.equal(p.scripts.length, 3); assert.equal(p.window.LowcoderSDK.ready, promise);
});
test('a failed chunk rejects readiness and reports the failed URL', async () => {
  const p = page(); p.scripts[1].onerror();
  await assert.rejects(p.window.LowcoderSDK.ready, /vendor.def.js/);
  assert.deepEqual(p.events, ['lowcoder:error']);
});
test('loaded scripts without an initialized entry do not report success', async () => {
  const p = page(); p.scripts.forEach(s => s.onload());
  await assert.rejects(p.window.LowcoderSDK.ready, /did not initialize/);
});
test('the browser build supplies every frontend build constant', () => {
  const declarations = fs.readFileSync(path.join(__dirname, '../../lowcoder/src/app-env.d.ts'), 'utf8');
  const names = [...declarations.matchAll(/declare var (REACT_APP_\w+)/g)].map(m => m[1]);
  const defined = new Set(require('../src/dev-utils/buildVars.cjs').buildVars.map(v => v.name));
  for (const name of names) assert.ok(defined.has(name), `Missing SDK build definition: ${name}`);
});
