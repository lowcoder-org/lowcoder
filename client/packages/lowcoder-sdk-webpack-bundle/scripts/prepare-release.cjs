// Preserve versioned files used by open tabs and the pre-migration browser loader.
// Run after building, before publishing. Never replace a freshly built file.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../dist');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const isRuntimeAsset = file => /^assets\/[\w.-]+$/.test(file) || /^[\w.-]+\.bundle\.js(?:\.LICENSE\.txt)?$/.test(file) || /^[a-f\d]+\.(?:woff2?|ttf|otf)$/.test(file);
async function main() {
  const previous = process.argv[2];
  if (previous) {
    const origin = new URL(previous);
    if (origin.protocol !== 'https:') throw new Error('The previous release must use HTTPS.');
    const response = await fetch(new URL('/sdk-assets.json', origin));
    if (!response.ok) throw new Error(`Cannot retain previous release: HTTP ${response.status}`);
    const manifest = await response.json();
    const queue = manifest.files;
    if (!Array.isArray(queue) || queue.length > 15000) throw new Error('Invalid asset manifest.');
    let cursor = 0;
    await Promise.all(Array.from({length:8},async()=>{
      while(cursor < queue.length) {
        const asset = queue[cursor++];
        if (!isRuntimeAsset(asset.file) || !/^[a-f\d]{64}$/.test(asset.sha256)) throw new Error('Invalid asset record.');
        const target = path.join(root,asset.file);
        try { await fs.access(target); continue; } catch {}
        const response = await fetch(new URL('/'+asset.file,origin));
        if (!response.ok) throw new Error(`Cannot retain ${asset.file}: HTTP ${response.status}`);
        const data = Buffer.from(await response.arrayBuffer());
        if (sha(data) !== asset.sha256) throw new Error(`Hash mismatch: ${asset.file}`);
        await fs.mkdir(path.dirname(target),{recursive:true}); await fs.writeFile(target,data);
      }
    }));
  }
  const files = [];
  for (const file of (await fs.readdir(root,{recursive:true})).sort()) {
    if (!isRuntimeAsset(file)) continue;
    const data = await fs.readFile(path.join(root,file));
    files.push({file,bytes:data.length,sha256:sha(data)});
  }
  await fs.writeFile(path.join(root,'sdk-assets.json'),JSON.stringify({files},null,2)+'\n');
  console.log(`Release contains ${files.length} verified runtime assets.`);
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
