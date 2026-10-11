const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const document = new JSDOM(read('site/reference.html')).window.document;
const source = file => ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declaration = (tree, name) => tree.statements.find(node => node.name?.text === name);
const names = nodes => nodes.map(node => node.name?.text).filter(Boolean);
const documented = attribute => [...document.querySelectorAll(`[${attribute}]`)].map(node => node.getAttribute(attribute));

test('reference covers each public instance member, option, event and React prop in source', () => {
  const instance = source('../lowcoder/src/appView/AppViewInstance.tsx');
  const members = declaration(instance, 'AppViewInstance').members.filter(node =>
    !ts.isConstructorDeclaration(node) &&
    !node.modifiers?.some(modifier => [ts.SyntaxKind.PrivateKeyword, ts.SyntaxKind.ProtectedKeyword].includes(modifier.kind))
  );
  for (const name of names(members)) assert.ok(documented('data-api').includes(`AppViewInstance.${name}`), name);
  assert.deepEqual(documented('data-option').sort(), names(declaration(instance, 'AppViewInstanceOptions').members).sort());
  assert.deepEqual(documented('data-event').sort(), names(declaration(instance, 'EventHandlerMap').members).sort());
  const react = source('../lowcoder/src/appView/LowcoderAppView.tsx');
  assert.deepEqual(documented('data-prop').sort(), names(declaration(react, 'LowcoderAppViewProps').members).sort());
  for (const api of ['LowcoderAppView', 'bootstrapAppAt']) assert.ok(documented('data-api').includes(api), api);
});

test('reference covers the browser facade exported by the entry and loader', () => {
  const expected = new Set();
  for (const file of ['index.jsx', 'src/loader.js']) {
    function visit(node) {
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
          ts.isPropertyAccessExpression(node.left) && node.left.expression.getText() === 'api') {
        expected.add(`LowcoderSDK.${node.left.name.text}`);
      }
      ts.forEachChild(node, visit);
    }
    visit(source(file));
  }
  assert.deepEqual(documented('data-api').filter(name => name.startsWith('LowcoderSDK.')).sort(), [...expected].sort());
});

test('documentation has valid local anchors, unique IDs and parseable JS/JSX examples', () => {
  const pages = new Map([
    ['/', new JSDOM(read('index.html')).window.document],
    ...['guide', 'reference', 'recipes'].map(name => [`/${name}`, new JSDOM(read(`site/${name}.html`)).window.document]),
  ]);
  for (const [name, page] of pages) {
    const ids = [...page.querySelectorAll('[id]')].map(node => node.id);
    assert.equal(ids.length, new Set(ids).size, `${name}: duplicate IDs`);
    for (const link of page.querySelectorAll('a[href]')) {
      const href = link.getAttribute('href');
      if (!href.startsWith('/') && !href.startsWith('#')) continue;
      const url = new URL(href, `https://sdk.lowcoder.cloud${name}`);
      const target = pages.get(url.pathname);
      if (target && url.hash) assert.ok(target.getElementById(url.hash.slice(1)), `${name}: broken ${href}`);
    }
    for (const card of page.querySelectorAll('.code-card')) {
      const language = card.querySelector('.code-toolbar span')?.textContent;
      if (!['JavaScript', 'React / JSX'].includes(language)) continue;
      const example = ts.createSourceFile('example.tsx', card.querySelector('pre').textContent, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      assert.equal(example.parseDiagnostics.length, 0, `${name}: example syntax error`);
    }
    assert.equal(page.querySelectorAll('script[src*="bundle.js"]').length, 0, `${name}: docs must not download the runtime`);
  }
});

test('search filters full section content, clears, and reveals a hidden cross-reference', () => {
  const dom = new JSDOM(read('site/reference.html'), { url: 'https://sdk.lowcoder.cloud/reference', runScripts: 'outside-only' });
  const { window } = dom;
  window.HTMLElement.prototype.scrollIntoView = function () {};
  window.eval(read('site/reference.js'));
  const input = window.document.getElementById('reference-search');
  const search = value => { input.value = value; input.dispatchEvent(new window.Event('input')); };
  search('positional');
  assert.equal(window.document.getElementById('methods').hidden, false);
  assert.equal(window.document.getElementById('sdk-ready').hidden, true);
  assert.match(window.document.getElementById('search-status').textContent, /matching/);
  search('not-a-real-api');
  assert.equal(window.document.getElementById('search-empty').hidden, false);
  window.document.getElementById('clear-search').click();
  assert.equal(input.value, '');
  assert.equal(window.document.querySelectorAll('article > section[hidden]').length, 0);
  search('positional');
  window.location.hash = '#sdk-ready';
  window.dispatchEvent(new window.HashChangeEvent('hashchange'));
  assert.equal(window.document.getElementById('sdk-ready').hidden, false);
  assert.equal(input.value, '');
  assert.equal(window.document.querySelectorAll('.copy-button').length, window.document.querySelectorAll('.code-card').length);
  window.close();
});
