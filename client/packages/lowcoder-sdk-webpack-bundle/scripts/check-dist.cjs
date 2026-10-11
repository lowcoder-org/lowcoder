const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../dist');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'sdk-manifest.json')));
let raw = 0, gzip = 0, largest = 0;
for (const {file} of manifest.files) {
  assert.match(file, /^assets\/[\w.-]+\.[a-f0-9]{12}\.js$/);
  const data = fs.readFileSync(path.join(root,file));
  raw += data.length; gzip += zlib.gzipSync(data).length; largest = Math.max(largest,data.length);
}
assert.ok(largest < 2 * 1024 * 1024, `Initial chunk exceeds 2 MiB: ${largest}`);
assert.ok(raw < 16 * 1024 * 1024, `Initial SDK exceeds 16 MiB: ${raw}`);
for (const file of ['bundle.js','index.html','guide.html','reference.html','reference.css','reference.js','recipes.html','demo.json','site.css','playground.js','_headers','404.html','custom_component.html']) assert.ok(fs.existsSync(path.join(root,file)),file);
for (const file of ['robots.txt', 'sitemap.xml', ...Object.values(require('../social-images.json'))]) {
  assert.ok(fs.existsSync(path.join(root, file)), `Missing SEO asset: ${file}`);
}
for (const { file } of Object.values(require('../seo.json'))) {
  const output = fs.readFileSync(path.join(root, path.basename(file)), 'utf8');
  const source = fs.readFileSync(path.join(root, '..', file), 'utf8');
  assert.equal(output, source, `Built HTML differs from validated source: ${file}`);
}
const files = fs.readdirSync(root,{recursive:true}).filter(f=>fs.statSync(path.join(root,f)).isFile());
for (const file of files) assert.ok(fs.statSync(path.join(root,file)).size < 25 * 1024 * 1024, `Cloudflare size limit: ${file}`);
console.log(JSON.stringify({initialRequests:manifest.files.length,initialBytes:raw,initialGzipBytes:gzip,largestInitialChunkBytes:largest,totalFiles:files.length},null,2));
