# Stored marketplace previews

A preview belongs to the **published application at its owning installation**, not to a visitor or to a browsing session. Community previews are generated once by the Community API and served from that API to all installations. Self-hosted services generate only their own local marketplace previews.

## Pipeline

1. `MarketplacePreviewWorker` reconciles the locally owned marketplace catalogue at startup and every minute. It requires both sharing flags, normal application status, and an actual published version. It never falls back to draft DSL. This also backfills existing listings and detects version deletion/rollback, published module changes, and workspace theme changes.
2. The worker hashes the static published layout, resolved published modules, theme settings, and renderer version/viewport. An unchanged hash produces no new job. Query/event/preload JavaScript changes do not invalidate the static image.
3. `marketplacePreview` in the existing MongoDB holds one durable job and the last successful JPEG per app. Atomic compare-and-set updates and lease claims coordinate API replicas. A job has a unique lease token, a three-minute lease, a persisted attempt count, and backoff. A stale worker cannot overwrite a newer job or recovered lease. Rendering has a shorter 90-second request deadline.
4. The owner API sends an HMAC-authenticated request to the internal Node endpoint `POST /node-service/api/marketplace/render`. Node renders at most two jobs concurrently, with no in-memory waiting queue. Busy responses defer a job without consuming its retry budget. Other failures get at most three attempts per layout hash. Restarting services preserves completed images and resumes eligible jobs after lease expiry.
5. The API verifies the current published layout again before committing an image. A previous image remains available while an updated layout is being captured. Successful images have **no hourly expiry**; they remain until the content hash changes.
6. Browsers make a lazy image read from `GET /api/v1/applications/{id}/marketplace-preview/image` on the app's owning API. This endpoint never queues, retries, or renders work; it only checks marketplace access/publication and reads the stored JPEG. Conditional requests use an ETag and `private, no-cache`, rechecking authorization before either 200 or 304. Unsharing/recycling denies subsequent reads. These reads do not create app-view analytics events.

**1,000 visits to an unchanged app cause zero captures.** A new or changed app is captured in the background even with zero visitors. There is no browser polling and no per-installation Community capture fallback.

## Renderer boundaries

The isolated `marketplace-preview.html` entry uses Lowcoder's existing components and published styles. Queries, preload JavaScript, event handlers, and data responders are removed. Chromium has no user session; requests are limited to the configured frontend's assets and official component bundles. Live data, external frames/assets, and third-party components requiring network access may not appear. Images are static layout previews, not live demos.

Chromium runs with its sandbox enabled. Docker images include the pinned Playwright Chromium and required libraries. Container hosts must support its sandbox; do not disable it for untrusted apps. JPEG output is limited to 2 MiB and stored directly in MongoDB, below its document limit. Include this collection in normal database backups.

## Configuration and rollout

- `LOWCODER_NODE_SERVICE_SECRET`: the existing shared API/Node secret must match on both services. Without it, automatic generation is disabled and internal render requests are rejected. Do not expose the internal Node rendering route through a public reverse proxy.
- `LOWCODER_NODE_SERVICE_URL`: existing API-to-Node connection configuration.
- `LOWCODER_PREVIEW_FRONTEND_URL`: trusted frontend origin hosting `marketplace-preview.html`; defaults to `http://localhost:3000`, or `http://lowcoder-frontend:3000` in the multi-container configuration.
- `LOWCODER_PREVIEW_CHROMIUM_PATH`: optional local Chromium executable. Docker uses the installed Playwright browser.
- `LOWCODER_PREVIEW_RECONCILE_MS`: API catalogue reconciliation interval, default 60000 milliseconds. It controls discovery of changed layouts, not image expiration.

Origins must be HTTP(S) origins without credentials, paths, queries, or fragments. Neither a browser nor the signed render payload can select a capture URL. Increment `MarketplacePreviewWorker.RENDER_VERSION` when a renderer/component release should regenerate otherwise unchanged layouts.

Deploy the API, Node renderer, and frontend capture entry together on the **Community installation** to backfill shared previews centrally. Deploy the same components on each self-hosted installation for its local apps. Until an owning API has this endpoint and images, the UI shows a placeholder; opening apps remains available. No fallback to the old viewer-triggered renderer is provided.

## Validation and local development

`yarn test:marketplace` checks internal request authentication, render limits, payload sanitization, and asset restrictions. Java `MarketplacePreviewTest` checks read-only delivery (including 1,000 reads), revocation, static hashes, draft exclusion, and publication changes during rendering. `MarketplacePreviewSecurityTest` exercises anonymous cross-installation delivery through the real security filters and rechecks private-marketplace denial. `MarketplacePreviewMongoTest` uses disposable databases when `LOWCODER_PREVIEW_TEST_MONGO_URI` is supplied; it covers competing replicas, durable images, lease recovery, fencing, and bounded retries.

For local renderer development, run `yarn preview:dev` with the shared secret, frontend origin, and a Chromium executable configured. It binds to loopback port 6061 and exposes only the internal POST route. Point the development API's Node URL at this port. Vite must proxy ordinary API image reads to the development API; never proxy a browser-facing capture route.
