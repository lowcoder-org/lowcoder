# Lowcoder browser SDK and playground

This workspace builds the native DOM embedding SDK and the public site at
https://sdk.lowcoder.cloud. The npm SDK lives alongside it in `../lowcoder-sdk`.

## Build and verify

From `client/`, with Node 22 and the repository's Yarn version:

```sh
node .yarn/releases/yarn-3.6.4.cjs install --immutable
node .yarn/releases/yarn-3.6.4.cjs workspace lowcoder-sdk-webpack-bundle test
node .yarn/releases/yarn-3.6.4.cjs workspace lowcoder-sdk-webpack-bundle build
node .yarn/releases/yarn-3.6.4.cjs workspace lowcoder-sdk-webpack-bundle check:dist
```

`index.html` and `site/` are lightweight static pages. The playground loads the SDK
only on request and mounts `site/demo.json` through the real SDK. It exchanges
module inputs, outputs and events, and demonstrates unmount/remount.

## Browser integration

```html
<div id="app"></div>
<script src="https://sdk.lowcoder.cloud/bundle.js"></script>
<script>
  LowcoderSDK.ready.then(async sdk => {
    const app = await sdk.mount('#app', {
      appId: 'YOUR_PUBLISHED_APP_ID',
      moduleInputs: { customerId: 'customer-42' }
    });
    app.on('moduleOutputChange', console.log);
    app.on('moduleEventTriggered', console.log);
    // await sdk.unmount('#app') when your screen is removed.
  }).catch(console.error);
</script>
```

`ready` covers SDK initialization. Mount resolves after app data is loaded and
rendering is scheduled, not after every query/component finishes. One backend per
host page is supported: SDK config, Redux, history, styles and plugin globals are
shared. CSS is not sandboxed. Configure backend access/authentication separately.
Existing `.lowcoder-module-container` markup and callbacks still work; call
`LowcoderSDK.scan()` for later markup. See `/guide.html` for the complete example.

## Chunk boundaries

Webpack partitions its dependency graph, with one runtime and one set of React,
styled-components and plugin globals. The loader resolves URLs from its own script,
fetches chunks concurrently, evaluates in dependency order, propagates CSP nonces,
and exposes explicit failure/readiness. Content-hashed assets have immutable cache
headers; `bundle.js` and manifests must revalidate. Never split generated JS bytes.

The SDK still includes component authoring/editor dependencies. These changes make
transfer/caching more granular; they do not claim a small independent renderer.
`check:dist` measures the emitted initial scripts and enforces release size limits.

## Cloudflare deployment

`wrangler.jsonc` deploys the static `dist/` folder to the `lowcoder-sdk` Worker.
The GitHub workflow tests and builds pull requests. Cloudflare Builds handles
production releases through its existing GitHub connection and build token:

- Repository: `lowcoder-org/lowcoder`; production branch: `main`.
- Root: `client`; Node version: `22.22.2`.
- Build: `node packages/lowcoder-sdk-webpack-bundle/scripts/build-release.cjs`.
- Deploy: `npx --yes wrangler@4.129.0 deploy --config packages/lowcoder-sdk-webpack-bundle/wrangler.jsonc`.
- Disable preview builds: this production config owns the public SDK route.

These settings require this change to be promoted to `main` before its next
automatic release. No npm package is published by this pipeline.

Before publishing an update:

```sh
node scripts/prepare-release.cjs https://sdk.lowcoder.cloud
node scripts/check-dist.cjs
npx wrangler deploy
```

The release step downloads the previous public asset manifest, checks SHA-256,
and retains old runtime files so cached loaders/open tabs survive deployments.
It deliberately fails if the previous release cannot be verified. The first
migration seeded this manifest from the verified Netlify deployment
`684309148dd28d5fbb335d1e` (870 public files; Netlify's deployment configuration is
not a served asset). Netlify remains available for rollback; no site deletion is
part of migration. Retained assets are not loaded by new visitors.

For a standalone first preview, omit the previous origin. For production updates,
never omit asset retention. Cloudflare serves true 404 responses for missing files,
not the landing page as JavaScript. Keep custom-component sandbox files in place.

Production uses the `sdk.lowcoder.cloud/*` Worker route and a proxied placeholder
DNS A record (`192.0.2.0`); the static Worker serves every path without an origin.
To roll back to Netlify, restore the proxied CNAME `sdk` →
`lowcoder-sdk.netlify.app`, then remove the SDK Worker route. Leave the Worker
assets available until caches and any new integrations have been considered.
