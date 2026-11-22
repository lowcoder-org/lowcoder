# Lowcoder end-to-end tests (Playwright)

Playwright suite (Chromium only) for the Lowcoder all-in-one Docker image. It checks that the web client and the
bundled backend work together: sign-up and sign-in, app lists, the editor (insert, move, resize, rename, properties,
queries), the published view, PostgreSQL queries and tables, query triggers, temporary state, local storage, modules,
the Extensions panel and the visual components. Apps are seeded through the HTTP API from DSL built by helpers
(`src/dsl/builders.ts`) and opened in the published view; the editor is driven only where the editor is the subject.

Rules for writing or changing tests: [AGENTS.md](AGENTS.md).

Not covered: Firefox and WebKit; the multi-container compose setup; databases other than PostgreSQL; the server and
node-service as separate units; any request to a real external host (the network guard blocks them); the app-level
layouts `navLayout` and `mobileTabLayout` (open decision). The functional behaviour of the nine components that need a
cloud service, credentials, third-party scripts or a device (3 Agora meetings, `turnstileCaptcha`, `scanner`,
`chartsGeoMap`, `openLayersGeoMap`, `hillchart`, `jsonLottie`, the components of the "cloud service or device" class) is not covered; their structural
lifecycle (insert, save, publish, load) is covered by S1 when `@insert-all` runs. No CI workflow runs this suite
(`.github/workflows/` has no e2e job).

`e2e/evidence/` is git-ignored, local only, and is never a source for claims in git.

## Architecture

- **Image under test:** `lowcoderorg/lowcoder-ce:3.0.0-e2e` = the published `3.0.0` all-in-one image with its web client
  rebuilt from tag `3.0.0` plus [client-hooks.patch](client-hooks.patch). The patch adds test hooks (`data-editor-ready`,
  `data-testid="insert-comp-<type>"` on insert-panel tiles, `role="tab"`/`role="tablist"`, `data-comp-name`), but it also
  touches the editor's save code (`appEditorInternal.tsx`). A defect found on this image is assumed to exist in 3.0.0
  only where the patch does not touch the involved code; that equivalence is NOT VERIFIED. The image is a locally built tag.
- **Isolated Docker network per run:** `scripts/run-in-docker.sh` creates `lowcoder-e2e-<pid>-net`, starts the app
  container and a PostgreSQL sidecar, waits for `GET /api/configs`, runs Playwright from
  `mcr.microsoft.com/playwright:v1.64.0-noble` with `e2e/` bound at `/work`, and removes everything on exit. Every run
  executes `npm ci` inside the runner, so the runner needs access to the npm registry (and Docker must be able to pull
  the images) even when `@npm` tests are excluded. There is no offline mode.
- **PostgreSQL sidecar:** `postgres:17-alpine` (pinned by digest) with `fixtures/sql/init.sql`: `items` (2 rows),
  `products` (25 shared read-only rows), `notes` (writes, owner-scoped). Host name in `E2E_POSTGRES_HOST`; connection
  constants are `POSTGRES` in `src/constants.ts`.
- **HTTP echo sidecar** (`scripts/echo-server.js`, started by `run-in-docker.sh` on the already pinned runner image, so no extra image or
  download; network alias `e2e-echo`, port 8080; the runner gets `E2E_ECHO_URL`): the target of the requests the SERVER makes inside the
  app container (node-service's npm registry proxy, the n8n plugin). It records `{ method, path, headers, body }` of every request in
  memory (bodies cut at 65536 bytes, 10000 records kept) and answers `{}`; `GET /__e2e/requests?prefix=<p>` returns the records whose
  path starts with `<p>`. The `echo` fixture of `src/fixtures.ts` gives each test its own target `<E2E_ECHO_URL>/t/<worker>-<repeat>-<retry>-<random>`
  (`url`, `received()`), so parallel tests never read each other's records; its one request context is created on first use and
  disposed after the test. The records die with the container (`cleanup` removes it however the run ends). Limits: the browser guard
  does not apply to these requests (they are made by the backend), so the echo is the only host the tests point the backend at; the
  sidecar starts in every run, also on the enterprise profile; an echo test that finds nothing proves nothing unless a positive control
  shows that the echo does receive from that path (every denial row of `outbound*.spec.ts` has one). The app and runner containers resolve `e2e-echo` through `--add-host e2e-echo:<sidecar IP>` (read with `docker inspect` after the sidecar starts), not DNS: measured with the sidecar stopped, `getent hosts e2e-echo` in the app container printed the sidecar's network IP and `curl` failed with "No route to host" (the runner got ECONNREFUSED on the same IP); without the entry the name resolved to a LAN address on the measuring host.
- **Fixed app host name `lowcoder-e2e-app`** (`scripts/app-host.sh`): network alias of the app container;
  `LOWCODER_BASE_URL` is `http://lowcoder-e2e-app:3000`. Reason: the client's hocuspocus URL
  (`REACT_APP_HOCUSPOCUS_URL=ws://lowcoder-e2e-app:3000/hocuspocus`) is baked in at client build time and the guard
  compares every WebSocket host with the host of `LOWCODER_BASE_URL`. The name exists only inside a run's network; with
  `E2E_HOST_PORT` the chat components do not connect in a host browser.
- **Network guard** (`src/fixtures.ts`): HTTP(S) requests of a context to another origin are aborted with
  `blockedbyclient`; WebSockets to another host are closed with `socket.close()`. Service workers are blocked. The guard
  is installed only by the custom `test` exported from `src/fixtures.ts` (automatic fixture `networkGuard`, and
  `newUserSession` for further contexts). A spec that imports `test` from `@playwright/test` bypasses it; always import
  `test` and `expect` from `src/fixtures` (stack-free unit specs that open no page are the accepted exception, `AGENTS.md` section 8). `blocked-requests.txt` is attached only for the primary `networkGuard`;
  URLs blocked in a `newUserSession` context are not attached. The guard covers browser contexts, not requests made by
  the backend inside the app container (which needs internet only for `@npm`: node-service fetches npm packages).
- **Users and isolation:** most tests use the `apiUser` fixture (own user and organisation, registered through the
  API). Exceptions: stack-free unit tests register no user (the `actor` fixture of the security helpers registers its own users), `smoke/signup.spec.ts` registers through the UI, and
  `auth/login.spec.ts` calls `registerUser` directly. Writes to `notes` are scoped by an `owner` value; `products` is
  shared and read-only.
- **Config** (`playwright.config.ts`): `testDir ./tests`, 4 workers, test timeout 60 s, expect timeout 15 s, viewport
  1600x1000, `fullyParallel`. One global retry exists and only under `CI` (`retries: IS_CI ? 1 : 0`); S1 and M3 switch it
  off with `test.describe.configure({ retries: 0, ... })`. Reporters: list, html, junit and the D-3 threshold reporter.
  `LOWCODER_BASE_URL` is required.

## Quick start

All commands run from the repository root unless a directory is stated. Paths after `run-in-docker.sh` are relative to
`e2e/` (it is bound at `/work`), so write `tests/smoke/signup.spec.ts`, not `e2e/tests/...`.

Prerequisites for running: Docker (network, pulls of the app, PostgreSQL and Playwright images), `flock` (macOS:
`brew install flock`), network access to the npm registry from the runner.

Prerequisites for building the image (`e2e/scripts/build-e2e-image.sh`, several minutes): git with the ref `3.0.0`
present locally (`CLIENT_REF`), `tar`, `patch`, Docker, network access for image pulls, `apt-get` and `yarn --immutable`
inside the build container.

```bash
# repository root, once: build the image under test
e2e/scripts/build-e2e-image.sh

# repository root: default selection on a fresh stack (removed afterwards)
e2e/scripts/run-in-docker.sh

ls e2e/playwright-report e2e/test-results
```

Checks without a stack, from `e2e/`:

```bash
cd e2e
npm ci
./node_modules/.bin/tsc --noEmit        # success = exit status 0 and no TypeScript diagnostics
LOWCODER_BASE_URL=http://localhost:1 ./node_modules/.bin/playwright test --list --reporter=list
```

Always add `--reporter=list` to `--list`: the configured html and junit reporters write into `playwright-report` and
`test-results` and fail in a read-only workspace.

## Run recipes

Repository root. Arguments after the script go to `playwright test`.

```bash
e2e/scripts/run-in-docker.sh                                        # default run
e2e/scripts/run-in-docker.sh tests/smoke/signup.spec.ts             # one file
e2e/scripts/run-in-docker.sh tests/smoke/signup.spec.ts:6           # one test (file:line)
e2e/scripts/run-in-docker.sh -g "sign-up through the UI"            # one test by title
e2e/scripts/run-in-docker.sh --grep @smoke                          # by tag: @smoke @core @slow @npm
E2E_INCLUDE_QUARANTINE=1 e2e/scripts/run-in-docker.sh --grep @quarantine
E2E_INCLUDE_SUPERADMIN=1 e2e/scripts/run-in-docker.sh --grep @superadmin   # SEC-R16a, SEC-R16b (R16c, R16d also need E2E_INCLUDE_QUARANTINE=1)
E2E_INCLUDE_INSERT_ALL=1 E2E_INCLUDE_QUARANTINE=1 E2E_INCLUDE_SUPERADMIN=1 e2e/scripts/run-in-docker.sh   # everything on the default stack (not the @enterprise tests)
E2E_STACK_PROFILE=enterprise e2e/scripts/run-in-docker.sh tests/security/enterprise.spec.ts   # the ENTERPRISE stack, SEC-E01 to E04, E06a, E06b
E2E_INCLUDE_QUARANTINE=1 E2E_INCLUDE_ENTERPRISE_TAKEOVER=1 E2E_STACK_PROFILE=enterprise e2e/scripts/run-in-docker.sh   # SEC-E05 ALONE (no other test), on its own stack
```

Gates (a gate run must not pass `--reporter=...`, see below):

```bash
# General repeat gate for a new or changed test or file (repository root)
e2e/scripts/run-in-docker.sh --repeat-each=10 --workers=4 tests/components/inputs.spec.ts

# S1, the insert-every-component test (112 tests): ONCE, not --repeat-each; nightly command (repository root)
E2E_INCLUDE_INSERT_ALL=1 e2e/scripts/run-in-docker.sh --grep @insert-all --workers=4

# M3, the module host built in the editor (repository root)
e2e/scripts/run-in-docker.sh --repeat-each=10 --workers=4 tests/modules/module-editor-host.spec.ts

# The ENTERPRISE stack (SEC-E01 to E04, E06a, E06b): not part of the P0 set, not pull-request blocking (repository root)
E2E_STACK_PROFILE=enterprise e2e/scripts/run-in-docker.sh --repeat-each=10 --workers=4 tests/security/enterprise.spec.ts
```

`--workers` only works as a CLI argument: `run-in-docker.sh` does not forward `E2E_WORKERS` into the runner.
A CLI `--reporter=...` REPLACES the reporters of `playwright.config.ts`, including the D-3 threshold reporter, so a
real S1 or M3 gate must not use it; a passing run prints `D-3 gate within the limit: ...` on stderr, and a missing line
means the gate did not run. `--reporter=list` is for `--list` only.

Tags (`TAGS` in `src/constants.ts`):

| Tag | Meaning | In default run |
|---|---|---|
| `@smoke` | fastest checks of the harness and the main flow | yes |
| `@core` | main user flows of the base suite | yes |
| `@slow` | noticeably longer (PostgreSQL, npm, many steps) | yes |
| `@npm` | needs the app container to reach the npm registry | yes |
| `@quarantine` | asserts the desired behaviour of a known product defect and fails today | no, `E2E_INCLUDE_QUARANTINE=1` |
| `@insert-all` | S1: insert, save, publish and load each of the 112 types | no, `E2E_INCLUDE_INSERT_ALL=1` |
| `@security` | access-control tests of `tests/security/` | yes (except the rows that also carry an opt-in tag) |
| `@enterprise` | the second stack in ENTERPRISE workspace mode (SEC-E01 to SEC-E06b, `tests/security/enterprise*.spec.ts`); SEC-E05 also carries `@quarantine`, `@enterprise-takeover` and `@superadmin` | no, never on the default stack; the only ones with `E2E_STACK_PROFILE=enterprise` (SEC-E05 aside) |
| `@enterprise-takeover` | SEC-E05 only: it resets the super admin's password, so it never shares a stack with another test | no, never on the default stack; on the enterprise profile only with `E2E_INCLUDE_ENTERPRISE_TAKEOVER=1` (plus `E2E_INCLUDE_QUARANTINE=1`), and then it is the ONLY test of the run |
| `@superadmin` | every test that uses the `superAdmin` fixture: SEC-R16a to SEC-R16d and the fixture test of `foundation/security-helpers.spec.ts` (D-47: they break a stack of more than about 420 workspaces); a guard test in `foundation/run-selection.spec.ts` fails when a spec has a test with that fixture and without the tag | no, `E2E_INCLUDE_SUPERADMIN=1` |

Untagged is normal (most component, unit and helper tests). The three opt-in variables are independent; a test with several
opt-in tags runs only when all their variables are set (SEC-R16c and SEC-R16d carry `@quarantine` and `@superadmin`) (`src/run-selection.ts`). Tag strings inside `foundation/run-selection.spec.ts` are test
data; its tests are untagged.

| Variable | Read by | Effect |
|---|---|---|
| `LOWCODER_E2E_IMAGE` | run-in-docker.sh | app image (default `...:3.0.0-e2e`; a missing default image stops the run) |
| `PLAYWRIGHT_IMAGE` | run-in-docker.sh | runner image; version must equal `@playwright/test` in `package-lock.json` (1.64.0) |
| `POSTGRES_IMAGE` | run-in-docker.sh | PostgreSQL sidecar image |
| `E2E_INCLUDE_QUARANTINE`, `E2E_INCLUDE_INSERT_ALL`, `E2E_INCLUDE_SUPERADMIN` | script and config | non-empty: include that opt-in group |
| `E2E_STACK_PROFILE` | run-in-docker.sh, config | `default` (the default) or `enterprise`: the app container gets `LOWCODER_WORKSPACE_MODE=ENTERPRISE` and the run keeps only the `@enterprise` tests (`grep`); another value stops the run. On the enterprise profile `E2E_INCLUDE_QUARANTINE` still opens the quarantined test (SEC-E05), `E2E_INCLUDE_INSERT_ALL` and `E2E_INCLUDE_SUPERADMIN` change nothing (the stack has one workspace, so the D-47 limit does not arise). A `--grep` of the command line narrows the profile's selection further; it does not replace it (measured with Playwright 1.64: enterprise profile with `--grep SEC-R01b` lists 0 tests, with `--grep SEC-E02` lists 1, with the default profile `--grep SEC-E02` lists 0) |
| `E2E_INCLUDE_ENTERPRISE_TAKEOVER` | run-in-docker.sh, config | non-empty, enterprise profile only (any other profile stops the script): run SEC-E05 alone; it is also quarantined, so `E2E_INCLUDE_QUARANTINE=1` is needed too |
| `E2E_HOST_PORT` | run-in-docker.sh | publish the app on `127.0.0.1:<port>` while the run lasts |
| `E2E_WORKERS` | playwright.config.ts | worker count, effective only when `playwright test` is run directly; NOT forwarded by the script |
| `CI` | script, config | `forbidOnly` and one retry |
| `LOWCODER_BASE_URL` | config | origin under test; set by the script; any URL works for `--list` |
| `E2E_POSTGRES_HOST` | `src/postgres.ts` | set by the script |
| `E2E_ECHO_URL` | run-in-docker.sh, `src/security/echo.ts` (`ECHO_ENV`) | set by the script: `http://e2e-echo:8080`, the HTTP echo sidecar; the `echo` fixture throws, naming the variable, when it is missing |
| `E2E_SUPERUSER_USERNAME`, `E2E_SUPERUSER_PASSWORD` | run-in-docker.sh, `src/security/super-admin.ts` | set by the script for each run (a caller's value is overwritten; the password is random per run and never printed); the app gets the same pair as `LOWCODER_SUPERUSER_*` |
| `BASE_IMAGE`, `TARGET_IMAGE`, `CLIENT_REF` | build-e2e-image.sh | build inputs (defaults `...:3.0.0`, `...:3.0.0-e2e`, tag `3.0.0`) |

Exit code: the one of `playwright test` once it started; before that the script's own failure decides it (lock held,
missing image, version mismatch, Docker, PostgreSQL or app start-up, `npm ci`). One run per checkout at a time (lock
`e2e/.run.lock`). Both scripts say "from any directory": that holds only when the path you type resolves; use the
repository root paths above.

## Folder layout

```
e2e/
  package.json, package-lock.json   @playwright/test 1.64.0, typescript
  playwright.config.ts              config; grep and grepInvert from src/run-selection.ts; D-3 reporter
  tsconfig.json                     strict, noUncheckedIndexedAccess
  client-hooks.patch                test hooks applied to the 3.0.0 client
  scripts/                          run-in-docker.sh, build-e2e-image.sh, app-host.sh, echo-server.js (the HTTP echo sidecar)
  fixtures/sql/init.sql             PostgreSQL data: items, products, notes
  fixtures/dsl/<type>.json          112 DSL defaults recorded from the editor
  fixtures/dsl/n8n/                 n8nQuery.json (the query the editor saved for "Retrieve all workflows", reduced to type and action) and n8nDatasource.json (the data source form's create body, without workspace, target or key); no id or timestamp of the recording session survives (a unit test checks); a subfolder so the component catalog test does not count them
  src/
    constants.ts                    TAGS, RUN_FLAGS, D3_RETRY_ANNOTATION, API paths, timeouts with reasons, PRODUCTS, labels
    fixtures.ts                     `test` with networkGuard, apiUser, newUserSession, actor, superAdmin; uniqueEmail
    run-selection.ts                grepInvert from the three opt-in variables, grep from the stack profile
    postgres.ts                     postgresConnection()
    media.ts                        data: URI fixtures (PNG_RED, PNG_BLUE, WAV, WEBM, MP4, PDF, PDF_RAW_B64)
    api/client.ts                   HTTP API helpers
    dsl/builders.ts                 DSL builders; dsl/recorded.ts loads fixtures/dsl (RecordedFixtureError)
    pages/                          page objects: AppList, AppView, Auth, Datasource, Editor, Extensions panel, Login, Property panel, Query panel, Setting, TableView, UserMenu
    logic/helpers.ts                rawLocalStorage, countAfterEquals, parseCounter, expectTextStays, DEBOUNCE_SETTLE_MS
    datasource/notes-queries.ts     query builders: shared read-only products, owner-scoped notes
    components/                     insert-all.ts (S1 helpers), insert-catalog.ts (112 types), scenario.ts (boundText, withValueAt, openSeededView)
    simple-components/seed.ts       container and slot seeds, openSeededApp
    modules/moduleScenario.ts       module scenario DSL, saved-instance polling, HandlerRetryBudget
    security/echo.ts                `echoTargetPath`, `echoReadPrefix`, `echoBaseUrl`, `recordsContain` (boolean: never prints the needle), `EchoRecord`, `EchoTarget` (the `echo` fixture)
    security/actors.ts, scene.ts, quarantine.ts, assertions.ts, tokens.ts, super-admin.ts   security helpers (joinWorkspace, makeDeveloper, grantApp, seedPrivateApp, adminOfApiUser, sceneOf, memberOf, roleOf), the quarantine list and `securityCandidateDetails`, `expectAnswer` (status and code), forged, unsigned and wrongly signed API-key tokens, `superAdminCredentials` (reads `SUPER_ADMIN_ENV`); security/enterprise.ts: `enterpriseAdmin` (the admin of the one workspace of the ENTERPRISE stack)
    reporters/d3-threshold-reporter.ts   fails the run when more than half of S1 or M3 tests carry `D-3 retry`
  tests/                            specs by area (catalogue below)
  evidence/                         git-ignored, local only
  playwright-report/, test-results/ git-ignored output of the last run
```

## Scenarios

Test titles carry these ids.

- S1 insert, save, publish, load every one of the 112 types (`@insert-all`; catalog unit tests in `insert-catalog.spec.ts`).
- S2 text inputs; S3 choice components; S4 date and time; S5 sliders and colour picker; S6 buttons and menus; S7 display components.
- S8 containers and slots; S9 overlays (modal, drawer, toast, tour); S10 forms; S11 file, signature, rich text, custom.
- S12 media (data: URIs); S13 listView and grid; S14 timer; S15 npm-loaded components (render only).
- S16 npm plugins in the Extensions panel; S17 AI Chat; S18 chat controller and iframe; S19 npm templates; S20 chat box.
- L1 temporary states; L2 local storage; L3 query triggers.
- D1 a PostgreSQL query feeds a text and a table, write queries re-read; D2 table with query data (sort, page, filter, edit).
- M1 two module instances, every direction across the boundary; M2 which module version a host shows; M3 host built in the editor.

## Test catalogue

Counts: `LOWCODER_BASE_URL=http://localhost:1 ./node_modules/.bin/playwright test --list --reporter=list` from `e2e/`:
default **438 tests in 76 files**; with `E2E_INCLUDE_QUARANTINE=1` **486 in 78**; with `E2E_INCLUDE_SUPERADMIN=1` **441 in 76**; with both of those **491 in 78**;
with `E2E_INCLUDE_INSERT_ALL=1` **550 in 77**; with all three opt-in variables **603 in 79** (the takeover variable changes nothing on the default stack). With `E2E_STACK_PROFILE=enterprise`:
**6 in 1** (SEC-E01 to E04, E06a, E06b; also with `E2E_INCLUDE_QUARANTINE=1` alone), **1 in 1** with `E2E_INCLUDE_QUARANTINE=1 E2E_INCLUDE_ENTERPRISE_TAKEOVER=1` (SEC-E05 alone), **0** with the takeover variable alone (SEC-E05 is quarantined too); `E2E_INCLUDE_INSERT_ALL` and `E2E_INCLUDE_SUPERADMIN` add nothing there. `@enterprise` is 7 tests, none in a default-stack listing.
Default-run tag counts: `@smoke` 5, `@core` 51, `@slow` 39, `@npm` 32, `@security` 96. On request: `@quarantine` 50 (48 with `E2E_INCLUDE_QUARANTINE=1` alone; the two that
also carry `@superadmin` need both variables), `@superadmin` 5 (the four SEC-R16 tests and the `superAdmin` fixture helper test), `@insert-all` 112.

### smoke (4)

| File | Proves | Tags | Tests |
|---|---|---|---|
| smoke/signup.spec.ts | sign-up through the UI lands on the empty app list | @smoke | 1 |
| smoke/published-view.spec.ts | an API-seeded app renders in the published view | @smoke | 1 |
| smoke/editor-drag.spec.ts | a component dragged from the insert panel is on the canvas and saved (D-3 prone) | @smoke | 1 |
| smoke/network-guard.spec.ts | requests to lowcoder.cloud are blocked, the app is let through | @smoke | 1 |

### auth, workspace, apps (11)

| File | Proves | Tags | Tests |
|---|---|---|---|
| auth/login.spec.ts | sign-in and sign-out; wrong password stays on sign-in | @core | 2 |
| workspace/member-access.spec.ts | invited member sees only shared apps; invitation link flow | @core | 2 |
| apps/public-app.spec.ts | public app renders for an anonymous visitor, a private one does not | @core | 1 |
| apps/publish-draft.spec.ts | published view shows the last published version, not the draft | @smoke @core | 1 |
| apps/trash-restore.spec.ts | trash and restore | @core | 1 |
| apps/card-menu.spec.ts | export/import, duplicate, rename, trash from the card menu | @core | 4 |

### editor (6)

| File | Proves | Tags | Tests |
|---|---|---|---|
| editor/edit-property.spec.ts | a property edit is shown, saved, survives a reload | @core | 1 |
| editor/rename-component.spec.ts | rename on canvas, in the saved app, after reload | @core | 1 |
| editor/move-resize.spec.ts | drag and resize handle are saved | @core | 2 |
| editor/js-query.spec.ts | a JS query written in the editor runs | @core | 1 |
| editor/drop-size.spec.ts | a component dropped right after ready has width above 0 (D-5) | @quarantine | 1 |

### datasource (10)

| File | Proves | Tags | Tests |
|---|---|---|---|
| datasource/postgres.spec.ts | PostgreSQL query written in the editor; published app shows its data | @core @slow | 2 |
| datasource/table.spec.ts | D2: editor-built table bound to a query; published table; sort, page, select, filter, notes edit/save | @core @slow | 3 |
| datasource/query-feeds-components.spec.ts | D1: query feeds text and table, owner-scoped writes re-read, chart renders | @core @slow @npm | 1 |
| datasource/notes-queries.spec.ts | unit tests of the query builders | none | 4 |

### logic (21)

| File | Proves | Tags | Tests |
|---|---|---|---|
| logic/state-and-queries.spec.ts | load query, button sets temp state, local storage survives reload | @core | 3 |
| logic/temporary-state.spec.ts | L1: state set by event, JS query, query event; transformer, data responder; `setIn` error path (CD-7) | @core | 2 |
| logic/local-storage.spec.ts | L2: local storage component | @core | 1 |
| logic/triggers.spec.ts | L3: page load, manual, input change, timeout, periodic, condition, before unload | @core, one also @slow | 6 |
| logic/helpers.spec.ts | unit tests of `src/logic/helpers.ts` | none | 9 |

### modules (10)

| File | Proves | Tags | Tests |
|---|---|---|---|
| modules/module-io-events.spec.ts | M1: two instances of one module: inputs, output, method, event | none | 1 |
| modules/module-versions.spec.ts | M2: which module version a host shows | none | 2 |
| modules/module-editor-host.spec.ts | M3: host built in the editor, D-3 retry and handler retry | @slow | 1 |
| modules/module-helpers.spec.ts | unit tests of `src/modules/moduleScenario.ts` | none | 6 |

### components (101 default, 214 with S1 and the quarantined one)

| File | Proves | Tags | Tests |
|---|---|---|---|
| components/inputs.spec.ts | S2 typed value reaches the bound text of every input component | none | 1 |
| components/choices.spec.ts | S3 one action per choice component changes only its bound text | none | 1 |
| components/date-time.spec.ts | S4 typed dates and times; invalid date refused | none | 1 |
| components/sliders-color.spec.ts | S5 slider, rangeSlider, colorPicker | none | 1 |
| components/buttons.spec.ts | S6 each button, link, dropdown, navigation, step, floatingButton handler | none | 1 |
| components/displays.spec.ts | S7 bound properties change on state change; icon cases | none, @quarantine for the icon switch | 3 |
| components/containers.spec.ts | S8 container bodies and slots | none | 8 |
| components/overlays.spec.ts | S9 modal, drawer, toast, tour | none | 4 |
| components/forms.spec.ts | S10 form, jsonSchemaForm | none | 3 |
| components/rich-inputs.spec.ts | S11 file, signature, richTextEditor, custom | none | 4 |
| components/media.spec.ts | S12 image, carousel, avatarGroup, comment, card, audio, video, fileViewer | none | 8 |
| components/lists.spec.ts | S13 listView and grid rows | none | 5 |
| components/timer.spec.ts | S14 display runs, stops after Pause, `pause` event (CD-3 limits it) | none | 1 |
| components/chat.spec.ts | S17 AI Chat, S18 chat controller, S20 chat box | none | 7 |
| components/iframe.spec.ts | S18 `url` decides `src` | none | 1 |
| components/npm-components.spec.ts | S15 npm components render; calendar with a pinned clock; barChart bound to a query (annotation CD-5) | @npm @slow | 26 |
| components/npm-plugins.spec.ts | S16/S19 npm plugin and template listed, kept after reload | @npm | 3 |
| components/insert-catalog.spec.ts | S1 catalog and saved-DSL helpers (unit tests) | none | 10 |
| components/insert-all.spec.ts | S1 every one of the 112 types inserts, saves, publishes, loads | @insert-all @slow | 112 |
| components/scenario-helpers.spec.ts | unit tests of `src/components/scenario.ts` | none | 5 |
| components/simple-helpers.spec.ts | unit tests of `src/simple-components/seed.ts` | none | 9 |

### security (98 default; 47 more with `E2E_INCLUDE_QUARANTINE=1`; 4 more with `E2E_INCLUDE_SUPERADMIN=1`, SEC-R16c and R16d only with both variables; needs the stack)

Access-control tests, API level plus UI checks in SEC-R01a, R02a, R04a+, R05b, R06b, R06d+, R07a, R07c, R08d, R10b, R11a, R13, A06a, A11 and the UI rows of the cross-workspace tests (page objects `SettingPage`, `DatasourcePage`, `AppListPage`, `AppViewPage`, `EditorPage`; where a measurement contradicts the expected UI behaviour, the test encodes what was measured and says so).
Titles are `SEC-<id> <text>`, tags `@security` (the P0 set also `@core`); each denial asserts HTTP status and `code` (`API_ERRORS`; exceptions: SEC-A10b, whose desired answer is only "no workspace id in the body", SEC-R15c, which accepts the two refusals of the folder grant but asserts one exact answer for the decisive step, and the rows that are not a denial, SEC-A11 to A13); the
scenarios that try to change something also read the resource back with the owner's session (read-only scenarios assert a before control
and the denial). A scenario that asserts the desired behaviour and fails on the 3.0.0 image is `@quarantine` with the `defect` annotation
of `src/security/quarantine.ts` (`FIXED_ON_BRANCH`, `OPEN_DEFECTS`); a failure nobody expected is first a "candidate" (`securityCandidateDetails`, annotation `<id> candidate: ...`) until it gets a D id in the table "Security findings" below; none is open now.
The P0 set is 22 of them, selected by id (repository root; the trailing space in the pattern keeps `SEC-C03` from matching `SEC-C03x`):
`e2e/scripts/run-in-docker.sh --grep "SEC-(C01a|C02a|C03|C06|C12a|C12b|C14a|C16d|R01b|R02a|R02b|R02c|R03d|R03e|R06a|R07a|R10b|R10c|A01a|A03a|A06a|A07b) "`.
The set tests the 3.0.0 server and the 3.0.0 client of the image, not a pull request's client.

Outbound requests of the server (SEC-X01a to X01d, X02a, X02b; the HTTP echo sidecar of "Architecture"): the app is pointed at the test's own echo target and the
echo's records are read back. SEC-X01 (`security/outbound.spec.ts`): an org admin points the workspace's npm registry at the echo (`setNpmRegistry`, a
dummy bearer token `e2e-dummy-<id>`); X01a+ is the positive control (the admin's `GET /api/npm/registry/{app}/e2e-pkg` reaches the echo with
the token), X01b and X01c (D-35, open) assert that an anonymous caller and a signed-in outsider are refused (4xx) and that nothing of their
call reaches the echo (both are asserted softly, so a failure reports both dimensions; each is shown after the admin's control call, so the echo can receive from that path), X01d+ shows that an anonymous
call on a PUBLIC app still reaches the echo (intended use: public apps load their npm components). SEC-X02 (`security/outbound-n8n.spec.ts`): an n8n data
source (`createN8nDatasource`, spec v1.1.1; X02b sets `forwardAllCookies: true`, the form's "Forward All Cookies") whose `serverURL` is the echo target and a saved query "Retrieve all workflows" (`n8nWorkflowsQuery`, recorded in
`fixtures/dsl/n8n/`); X02a+ is the positive control (the literal marker parameter and the data source's key arrive), X02b (D-27, fixed on this branch's server)
asserts, after a positive control that a benign cookie set in A's browser context does reach the echo, that the caller's session cookie value is in no record: the parameter is `{{LOWCODER_CE_SELFHOST_TOKEN}}` as the WHOLE value, because the 3.0.0 server puts every
request cookie into the plugin's evaluation context and a whole-value segment becomes the cookie entry, which the plugin sends as JSON in the URL (measured: the
cookie value appeared in the path; inside a longer string the entry prints as `[object Object]`). The cookie value is compared as a boolean and never put in a message; the
file turns the trace off because the echo's answer to a read would carry it.

Super admin (SEC-R16a to R16d, `superAdmin` fixture of `src/fixtures.ts`): `run-in-docker.sh` creates the instance super admin
`e2e-superadmin@example.test` with a new random password per run and passes both values to the runner as `E2E_SUPERUSER_USERNAME` /
`E2E_SUPERUSER_PASSWORD` (name-only `docker run -e NAME`, so the password is on no command line; `SUPER_ADMIN_ENV` in `src/constants.ts`
holds the names). The 3.0.0 image honours `LOWCODER_SUPERUSER_USERNAME/PASSWORD` (measured: the sign-in works and the user is a
`super_admin` member of every new workspace). The account is shared by all workers: tests never switch its workspace or change its
password; SEC-R16c and R16d act only on the test's own workspace. Rules: the sign-in is an automatic worker fixture that runs before the
first test of a worker, because Playwright traces every request context created while a test runs (measured: a sign-in made inside a
test put the login body, with the password, into the trace and the HTML report). Leak check, measured with a deliberately failing
SEC-R16a: `find e2e/test-results e2e/playwright-report -name '*.zip' -exec unzip -p {} \; | grep -a -c '"loginId":"e2e-superadmin@example.test"'`
printed 1 when the test signed the super admin in through `page.request` (positive control) and 0 with the fixture alone. SEC-R16b also proves identity (the request context is signed in as the fixture user, which is a `super_admin` member of the workspace while a plain member is not), because on the 3.0.0 image any signed-in user can write a config key. A run
started without the two variables fails the super-admin tests at once with an error naming both variables; other tests are unaffected.
LIMIT (D-47, measured on the 3.0.0 image, cause not found, HEAD not measured): once the stack holds more than about 420 workspaces every
request of the super admin hangs until the gateway answers 504 (400 workspaces: about 100 ms; 450: 120 to 240 s; an early session does not
help). Each security test creates one to three workspaces, so `--repeat-each=10 tests/security` (about 1000 workspaces) failed SEC-R16a and
R16b from the third repeat. Therefore the four SEC-R16 tests carry the tag `@superadmin`: they are out of the default run and of every
`@security` or P0 run, and run only with `E2E_INCLUDE_SUPERADMIN=1 e2e/scripts/run-in-docker.sh --grep @superadmin` (R16c and R16d also carry
`@quarantine` and then need `E2E_INCLUDE_QUARANTINE=1` too). Keep such runs short.

ENTERPRISE stack (SEC-E01 to SEC-E06b, `E2E_STACK_PROFILE=enterprise`): the same image started with `LOWCODER_WORKSPACE_MODE=ENTERPRISE`
(`run-in-docker.sh` adds the variable; there is no compose file). Measured on the 3.0.0 image: the container hands both
`LOWCODER_WORKSPACE_MODE` and the super-admin variables to the server. The super admin's own workspace is the ONE enterprise workspace
OE (SEC-E01: its name is "<super admin e-mail>'s workspace", a new user's only workspace is OE, role `member`, the super admin is
`super_admin` there and has no other workspace). Creating a workspace is refused with 400 / 5003 (SEC-E06a), and the
lookup of workspaces by e-mail answers OE for a known and for an unknown address alike (SEC-E06b). OE has no admin but the super admin, so a test
signs up an actor and the super admin promotes it (`enterpriseAdmin`). True deactivation (SEC-E02 to E04): a removal by an admin marks the
user deleted (`markUserDeletedAndInvalidConnectionsAtEnterpriseMode`, state DELETED, connection sources renamed); measured: the removed user's
session and API key answer 401 without a body at once, and signing in again with its password answers 403 / 5608 (`INVALID_PASSWORD`, the answer of
a wrong password; no session results, the context stays anonymous). SEC-E05 (D-40) resets the super admin's password on a server with the
defect, so it lives alone in `security/enterprise-takeover.spec.ts`, tagged `@enterprise-takeover`, and runs on a stack of its own: the tag is
left out of every run unless `E2E_INCLUDE_ENTERPRISE_TAKEOVER=1` is set (with the enterprise profile and `E2E_INCLUDE_QUARANTINE=1`), and a run with
the flag selects that one test only (`grep` is then `/@enterprise-takeover/`), so it cannot break other tests; measured: the reset answers 200.
That file turns trace, screenshot and video off and passes no response body to any assertion, because the reset answer carries a new password
Leak check, measured on the 3.0.0 image: the run `E2E_INCLUDE_QUARANTINE=1 E2E_INCLUDE_ENTERPRISE_TAKEOVER=1 E2E_STACK_PROFILE=enterprise e2e/scripts/run-in-docker.sh`
failed as expected (200 instead of 400 / 5003). A script searched `test-results/`, `playwright-report/` (zip archives unpacked) and the run log for the two new
passwords the test saw (the control's and the attack's), printing only counts: 0 matches in 5 files and the log, with no trace archive written. The same search
with the trace switched on found both values (2 matches in 2 trace archives), so the search can see them. The control's reset does not leak either.
Rules for the one shared workspace: a test names only its own users, never counts the members of OE, and never removes, demotes or
re-passwords the super admin. The gate `--repeat-each=10 --workers=4 tests/security/enterprise.spec.ts` (60 tests) passed; the developer quota
of `checkDeveloperCount` was not reached with 40 admins in OE. The enterprise profile selects by tag, so the unit specs of `foundation/` do not run on it.
Listing, from `e2e/` (no stack): `E2E_STACK_PROFILE=enterprise LOWCODER_BASE_URL=http://localhost:1 ./node_modules/.bin/playwright test --list --reporter=list`.

| File | Proves | Tags | Tests |
|---|---|---|---|
| security/enterprise.spec.ts | SEC-E01 (new users join the super admin's workspace as members), E02 and E03 (a removed user's session and API key stop at once), E04 (a removed user cannot sign in again), E06a (no second workspace), E06b (no account oracle in the e-mail lookup) | @security, @enterprise, @superadmin for E01 to E04 and E06a | 6, only with `E2E_STACK_PROFILE=enterprise` |
| security/enterprise-takeover.spec.ts | SEC-E05 (D-40): an admin resets the super admin's password; alone on its own stack | @security, @enterprise, @enterprise-takeover, @superadmin, @quarantine | 1, only with `E2E_STACK_PROFILE=enterprise`, `E2E_INCLUDE_QUARANTINE=1` and `E2E_INCLUDE_ENTERPRISE_TAKEOVER=1` |
| security/cross-org.spec.ts | cross-workspace rows (C01 to C22): another workspace's app, datasource, query, settings, roles, members, folders, groups, permission rows; 18 tests are `@quarantine` (C09, C10, C11, C13, C15, C16b, C16c, C16f, C17a, C17b, C17c, C18b, C19a, C19b, C20, C21, C22e) | @security, @core for 8 (the P0 rows), @quarantine for 18 | 24 default + 18 quarantined (C17c has an API and a UI test) |
| security/bundles.spec.ts | C23 (another workspace's bundle cannot be viewed, recycled, shared, reordered, published, renamed or created in; C23a and C23c `@quarantine`) and R17 (a developer's bundle: R17a+ positive, R17d viewer cannot recycle or delete, R17e editor cannot grant owner, R17f the creator's recycle; R17b, R17c and R17f `@quarantine`) | @security, @quarantine for 5 | 7 default + 5 quarantined |
| security/roles.spec.ts | R01 to R10: member without grant, viewer, editor, developer, plain member, anonymous visitor are held to their rights, the data source rows (R09), the workspace admin rows (R07, R08); R16: the instance super admin opens a private app's editing view and writes a config key (R16a, R16b), a workspace admin cannot demote or remove it (R16c D-23, R16d D-24); quarantined: R01d, R03b, R06c, R07d, R08c, R08d, R09c, R09d, R16c, R16d | @security, @core for the 10 P0 rows, @quarantine for 10, @superadmin for 4 (R16a to R16d) | 30 default + 8 quarantined + 2 `@superadmin` + 2 `@quarantine @superadmin` (R16c, R16d) |
| security/group-grants.spec.ts | R05 (group grants, a member removed from the group loses the right, UI after reload) and R14 (group administration) | @security | 6 |
| security/membership-changes.spec.ts | R11 to R13 (a removed member, a demoted admin, a removed permission row with a session open) and R15 (folder rights); quarantined: R11b, R15c | @security, @quarantine for 2 | 7 default + 2 quarantined |
| security/credentials.spec.ts | A01 to A05: forged, unsigned and wrongly signed tokens, API keys (a removed member's key, a member's key), logged-out and made-up cookies, forwarding headers; quarantined: A02a (D-45: the 3.0.0 server keeps the user's last API key after a delete), A04 | @security, @core for A01a and A03a, @quarantine for 2 | 7 default + 2 quarantined |
| security/mass-assignment.spec.ts | A06 to A08: a member cannot promote itself, an update cannot move an app or change its creator or public flag, a viewer's eight write routes (A08a to A08h); quarantined: A06b, A07a | @security, @core for A06a and A07b, @quarantine for 2 | 11 default + 2 quarantined |
| security/public-leakage.spec.ts | A09 and A10: what a public app and the session-free routes show an anonymous visitor (A09b and A09d are pins); quarantined: A09a, A09c, A10a, A10b, A10c | @security, @quarantine for 5 | 2 default + 5 quarantined |
| security/outbound.spec.ts | SEC-X01a to X01d: the npm registry proxy against the echo sidecar (X01a+ and X01d+ pass; X01b and X01c, D-35, `@quarantine`) | @security, @quarantine for 2 | 2 default + 2 quarantined |
| security/outbound-n8n.spec.ts | SEC-X02a and X02b: the n8n plugin's request against the echo sidecar (X02a+ passes; X02b, D-27, `@quarantine`); trace off for the file | @security, @quarantine for 1 | 1 default + 1 quarantined |
| security/collab-room.spec.ts | A11: a chat controller of another workspace joins the room of a private app (two browser sessions, the image's hocuspocus); `@quarantine` | @security, @quarantine | 1 quarantined |
| security/transport.spec.ts | A12 (CORS: a foreign origin is allowed with credentials, `@quarantine`) and A13 (session cookie flags) | @security, @quarantine for 1 | 1 default + 1 quarantined |

Quarantined tests that behave unexpectedly on the 3.0.0 image: SEC-R09d is order-dependent (the batched data-source check; measured 8 failures and 2 passes in 10 repeats), so a quarantine run can show it passing. Accounting of `E2E_INCLUDE_QUARANTINE=1 e2e/scripts/run-in-docker.sh --workers=4 --reporter=list --grep "@quarantine" tests/security` (measured before the @superadmin tag existed, so it included SEC-R16c and R16d; they now need `E2E_INCLUDE_SUPERADMIN=1` as well): 44 listed, 43 failed, 1 passed (SEC-R09d), 0 skipped, 0 did not run; the two quarantined tests of `foundation/security-helpers.spec.ts` are outside that folder.

### foundation (201, unit and builder tests; several touch the stack)

| File | Proves | Tags | Tests |
|---|---|---|---|
| foundation/builders.spec.ts | every DSL builder's output shape, and the n8n recordings with `n8nWorkflowsQuery` | none | 40 |
| foundation/recorded.spec.ts | recorded-fixture parsing and errors | none | 5 |
| foundation/run-selection.spec.ts | `grepInvertFor`, `grepFor`, `excludedTags`, `runFlagsFromEnv`, `stackProfileFromEnv` for the four opt-in flags and the stack profile (every flag combination on both stacks: SEC-E05 runs only with its own flag and then alone), and the guard that every `superAdmin` fixture test carries `@superadmin` (parses each spec with the TypeScript compiler: `test` and every local name bound to it, by an aliased import of the fixtures or of `@playwright/test` or by a `test.extend(...)` variable; `test.only/skip/fixme/fail`, hooks, tags on an enclosing `test.describe`; comments, titles and annotations never count; the guard itself is tested on synthetic sources) | none | 25 |
| foundation/media.spec.ts | media fixtures have the right signatures | none | 8 |
| foundation/create-module.spec.ts | `createModule` request shape | none | 4 |
| foundation/module-host.spec.ts | module created through the API works in a host; republish rules | none | 2 |
| foundation/editor-modules.spec.ts | module page objects in the editor | @slow | 3 |
| foundation/extensions-panel.spec.ts | `ExtensionsPanel` page object | @npm @slow | 2 |
| foundation/logic-builders.spec.ts | logic builders seed an app the view runs | none | 1 |
| foundation/products-table.spec.ts | products fixture and `TableView` | none | 2 |
| foundation/table-view-header.spec.ts | header lookup is exact | none | 1 |
| foundation/d3-threshold-reporter.spec.ts | D-3 gate verdicts of the reporter | none | 9 |
| foundation/security-helpers.spec.ts | the security helpers of `src/api/client.ts`, `src/security/actors.ts` and `src/security/scene.ts` against the stack (`apiRaw`, `actor`, `joinWorkspace`, `makeDeveloper`, grants, folders, datasources, API keys, bundles, `signIn`, `getApp`, `listGroupMembers`, `sceneOf`, `memberOf`, `roleOf`, `permissionIdOf`, `adminOfApiUser`, the `superAdmin` fixture, ...); 2 tests are `@quarantine` (D-45 API-key delete, D-46 bundle recycle) | none, @superadmin for 1, @quarantine for 2 | 36 default + 1 `@superadmin` + 2 quarantined |
| foundation/security-pages.spec.ts | the page objects `SettingPage` (settings sidebar, members rows and role selects, provider page) and `DatasourcePage` (the form's save answer) as admin, developer and plain member, and `AppViewPage.openAndAwaitQuery` (the status of the query a seeded app runs on load) | none | 4 |
| foundation/security-echo.spec.ts | the echo sidecar (`scripts/echo-server.js` started on a loopback port: record and read back, per-target prefixes, control paths, body cut) and `src/security/echo.ts`, `n8nDatasourceBody`, `npmRegistryPath` (no stack) | none | 15 |
| foundation/security-api-raw.spec.ts | `apiRaw` against a local server: status, code, body, params, request and response headers (no stack) | none | 7 |
| foundation/security-quarantine.spec.ts | `securityTestDetails`, `securityCandidateDetails` and the two quarantine maps (no stack) | none | 9 |
| foundation/security-constants.spec.ts | `API_ERRORS`, roles, security path builders (no stack) | none | 6 |
| foundation/security-tokens.spec.ts | `src/security/tokens.ts`: the HS256 signer against RFC 7515 A.1, forged, unsigned and wrongly signed tokens (no stack) | none | 8 |
| foundation/security-assertions.spec.ts | `expectAnswer` and `expectDeniedAs` pass on a match and fail on a wrong status or code (no stack) | none | 6 |
| foundation/security-super-admin.spec.ts | `superAdminCredentials` (both variables, missing or empty ones name both variables and the script, never a value) and `withCapacityHint` (no stack) | none | 8 |

## Known defects, observations and candidates

| Id | What | Suite handling |
|---|---|---|
| D-3 | an edit made right after the editor opens can be lost; `EditorPage.open()` waits for `data-editor-ready` and `GRID_SETTLE_MS`, which narrows but does not close the race | tests that save through the editor poll the saved DSL; S1 and M3 retry once (below) |
| D-5 | a component dropped right after ready is saved with width 0 | `GRID_SETTLE_MS` in `src/constants.ts`; `editor/drop-size.spec.ts` asserts the desired width and is `@quarantine` (no annotation) |
| CD-3 | the timer's `start`/`resume` events and state do not reach bindings | `components/timer.spec.ts` asserts display text and the `pause` event only (no annotation) |
| CD-5 | an OBSERVATION, not a confirmed defect: `barChart1.data` reads empty while the chart draws the bound data | `components/npm-components.spec.ts` (bound barChart test) asserts today's `chart=0` and carries `{type:"defect", description:"CD-5"}`; `datasource/query-feeds-components.spec.ts` asserts the binding through a text |
| CD-7 | `setIn` with a bad path or on a scalar fails silently (query ends as success) | `logic/temporary-state.spec.ts` asserts today's behaviour, annotation `{type:"defect", description:"CD-7"}`, default run |
| CD-8 candidate | `transfer` list titles are in the wrong order | conditional `defect` annotation in `components/choices.spec.ts`; not confirmed as a defect yet |
| CD-9 candidate | an icon switched from a name to an image URL keeps the old icon | `components/displays.spec.ts`, `@quarantine`, `defect` annotation; not confirmed as a defect yet |
| CD-4 | npm components fail silently without internet; version is `latest` | `@npm`, render-only assertions |
| O-11 | observation: back-to-back key presses on a slider are lost | `components/sliders-color.spec.ts` asserts the bound text after every press |
| O-12 | observation: publishing an existing version tag of a module answers HTTP 500 / code 5000, not a tag-specific error | `modules/module-versions.spec.ts` asserts only that the call fails with the API error type and records the message in an `observation` annotation |
| O-13 | observation: a mounted host never reloads a module that was republished under it while the module id is unchanged | `modules/module-versions.spec.ts` asserts the old version stays over `MOUNTED_HOST_OBSERVATION_MS` |
| O-14 | observation: the chat controller's `messageSent` fires only when the answer succeeds, `messageReceived` fires either way | `components/chat.spec.ts` |
| O-15 | observation: the bound `connectionStatus` of the chat controller reads `Online` at its first read | `components/chat.spec.ts` uses a received frame as the signal of the connection |
| D-45 | on the 3.0.0 image `DELETE /api/auth/api-key/{id}` of the user's last key answers 200 but the key stays listed and keeps authenticating (fixed on the branch by `86fe43f9d`, NOT VERIFIED at runtime) | `security/credentials.spec.ts` SEC-A02a and the helper test in `foundation/security-helpers.spec.ts`, `@quarantine`, annotation `D-45` |
| D-46 | on the 3.0.0 image recycling a bundle sets the status and answers 500 / 5005 (suspected open at HEAD, NOT VERIFIED) | `security/bundles.spec.ts` SEC-R17f and the helper test, `@quarantine`, annotation `D-46`; `recycleBundle` tolerates exactly this answer |

## Security findings

Ids `D-6` to `D-47` are the defects the security tests use (annotation `{ type: "defect", description: "D-n" }`, and the maps `FIXED_ON_BRANCH` and
`OPEN_DEFECTS` of `src/security/quarantine.ts`). Status: `open` = present in the 3.0.0 image and in the code of this branch;
`fixed on branch` = present in the 3.0.0 image, fixed in this branch's server by the named commit (the image under test still has it, so the
test is `@quarantine`; it leaves the quarantine by deleting its id from `FIXED_ON_BRANCH` once a run against an updated server passes it);
`suspected` = read in the code, the runtime behaviour is not established. D-45, D-46 and D-47 were found by running tests; the other
findings were read in the code and each scenario asserts the desired behaviour. "pin" means the test asserts the current good behaviour
and passes.

| Id | Finding | Status | Scenarios |
|---|---|---|---|
| D-6 | an admin of any workspace renames any user or replaces or deletes their photo (the route checks the admin role of the path's workspace, not that the user belongs to it) | open | SEC-C19a, C19b |
| D-7 | any workspace admin renames another workspace's folder and grants permissions on it; a plain member can escalate inside a workspace through folder grants copied onto later apps | open | SEC-C09, C11, C22e, R15c |
| D-8 | any signed-in user reads the permission list of any folder | open | SEC-C10 |
| D-9 | an app editor sets the app's status (recycled, deleted) through the update route, which needs only edit rights | suspected | SEC-R03b |
| D-10 | viewers, and anonymous visitors of public apps, run unpublished (draft) queries | suspected | SEC-A09c |
| D-11 | a plain member creates apps in a workspace when it is a developer in its current workspace | suspected | SEC-R06c |
| D-12 | anonymous callers resolve names of apps, users, workspaces and more by id (`POST /api/meta/`) | open | SEC-A10a |
| D-13 | anonymous callers list the workspaces of any e-mail address (`GET /api/organizations/byuser/{email}`) | open | SEC-A10b |
| D-14 | the workspace answer carries the auth configs' client secret | open | SEC-R07d |
| D-15 | API keys are signed with a published default secret; a forged token is refused only because it must equal a stored key | open, defended (pin) | SEC-A01a |
| D-16 | any signed-in user writes deployment-wide server config | fixed on branch (`24295707f`) | SEC-R08c (positive half SEC-R16b) |
| D-17 | library queries of other workspaces can be read and run | fixed on branch (`e84499a0b`) | SEC-C15 |
| D-18 | any signed-in user invites itself into any workspace | fixed on branch (`2ae399ef2`) | SEC-C17a, C17b |
| D-19 | folder create with a client-chosen id replaces another workspace's folder | fixed on branch (`f3e4b2908`) | SEC-A07a |
| D-20 | a query naming its datasource by gid skips the use permission | fixed on branch (`a8e6531ec`) | SEC-R09c |
| D-21 | any signed-in user lists any app's versions | fixed on branch (`f698f98ef`) | SEC-C20 |
| D-22 | any signed-in user lists any workspace's users through a group id | fixed on branch (`3eb3c4a05`) | SEC-C18b |
| D-23 | a workspace admin grants `super_admin` or changes a super admin's role | fixed on branch (`bf53d64b9`) | SEC-A06b, R16c |
| D-24 | an admin removes a super admin or the last admin | fixed on branch (`928d02040`) | SEC-R08d, R16d |
| D-25 | app views, the anonymous view of a public app included, carry the workspace's password-reset mail template | fixed on branch (`7f2b48e4a`) | SEC-A09a |
| D-26 | an app's creator who left the workspace, and any user on a template app, open the editing view | fixed on branch (`c377186ad`) | SEC-R11b |
| D-27 | the session cookie is forwarded to JS datasource queries | fixed on branch (`f4fc9f3ec`) | SEC-X02b |
| D-28 | any signed-in user sets any workspace's slug and reads any workspace | fixed on branch (`22e4419b1`, `893e7ebd0`) | SEC-C16b, C16c |
| D-29 | any signed-in user reads any datasource's structure and makes it connect | fixed on branch (`fe745f3bd`) | SEC-C13 |
| D-30 | signing in with `?orgId=` joins that workspace without an invitation (may be intended for the per-workspace sign-in page; needs an owner decision) | suspected | SEC-C17c |
| D-31 | an editor of any app reads any history snapshot by id | open | SEC-C21 |
| D-32 | any workspace member reads the full live DSL of any of its apps | open | SEC-R01d |
| D-33 | credentialed CORS from any origin with CSRF protection off (default allowed origins `*`) | open | SEC-A12 (`@quarantine`), SEC-A13 (pin) |
| D-34 | sessions survive a password change | open | SEC-A04 |
| D-35 | anonymous callers use any app's workspace npm registry settings | open | SEC-X01b, X01c |
| D-36 | the collaboration server checks neither the user nor the room | open | SEC-A11 |
| D-37 | the app slug route has no permission check (latent while no slug is stored) | open | SEC-C16f |
| D-38 | a batched permission lookup takes the workspace and the admin role from the first id | suspected | SEC-R09d |
| D-39 | actuator metrics (`/api/status/**`) are anonymous | open | SEC-A10c |
| D-40 | in ENTERPRISE mode a workspace admin resets the instance super admin's password and receives it | open (measured on the 3.0.0 image: the reset answers 200 and the password) | SEC-E05 (`security/enterprise-takeover.spec.ts`, alone on its own enterprise stack) |
| D-41 | a plain member creates bundles in a workspace when it is a developer in its current workspace | suspected | SEC-R17b |
| D-42 | a bundle's element list carries the editing DSL of every app in it, with no check on the apps | open | SEC-R17c |
| D-43 | any signed-in user lists any bundle's elements, each app's editing DSL included | fixed on branch (`bd6308331`) | SEC-C23a |
| D-44 | an app's owner adds or moves it into any bundle of any workspace | fixed on branch (`a63df54ac`) | SEC-C23c |
| D-45 | deleting a user's last API key answers 200 but the key stays listed and keeps authenticating (measured on the image) | fixed on branch (`86fe43f9d`, not verified at runtime on the branch) | SEC-A02a and the helper test in `foundation/security-helpers.spec.ts` |
| D-46 | recycling a bundle sets the status and then answers 500 / 5005 (measured on the image) | suspected open on the branch (not verified at runtime) | SEC-R17f and the helper test; `recycleBundle` tolerates exactly this answer |
| D-47 | the instance super admin's requests hang (HTTP 504) once the stack holds more than about 420 workspaces (measured on the 3.0.0 image: 400 ok in about 100 ms, 450 and more 504 after about 120 s; cause not found) | open, cause not found, measured on 3.0.0, HEAD not measured | SEC-R16a to R16d, tagged `@superadmin` |

Quarantine decision rule: a test that asserts the DESIRED behaviour and fails today is `@quarantine`. A
characterisation or workaround test that passes while documenting a defect (CD-5, CD-7, CD-3 limits, D-3 handling) is not.

Annotation types used: `defect` (description = defect id) for a test that asserts or works around a defect;
`D-3 retry` and `handler retry` for the retries of S1/M3 and the editor-module tests; `observation` for a recorded
observation (`modules/module-versions.spec.ts`, O-12). Observations O-11 to O-15 are listed in the table above.

D-3 retry and threshold rules (code: `src/components/insert-all.ts`, `src/modules/moduleScenario.ts`,
`src/reporters/d3-threshold-reporter.ts`):

- S1 and M3 wait up to `SAVE_POLL_TIMEOUT_MS` (20 s) for the saved DSL to hold the edit. On a timeout the test adds the
  annotation `D-3 retry` and redoes its editor steps on a fresh app once; a second lost save fails the test.
- M3 has a second retry, `handler retry`, for its event-handler step. At most one of each per test.
- Both files set `test.describe.configure({ retries: 0, timeout: 180_000 })`, switching off the one CI retry.
- The reporter counts, per gated file, the tests that RAN and fails the run when more than `floor(ran / 2)` carry
  `D-3 retry`. The limits 56 of 112 (S1) and 5 of 10 (M3) apply to the complete gates above. A targeted run of fewer
  tests gets a proportionally smaller limit; a one-test run allows zero D-3 retries. A file that did not run is not judged.
- Limit: a regression that loses fewer than half of the first saves passes.

## Troubleshooting

- `another run uses .../e2e (lock .../e2e/.run.lock)`: a second `run-in-docker.sh` in the same checkout. Wait or use
  another checkout.
- `test-results` is empty or gone after a run: a concurrent run in the same checkout cleaned it (Playwright recreates
  `outputDir` at the start of a run). Never run two stacks, or a direct `playwright test`, in one checkout at once.
- Chat tests cannot connect (`ws://localhost:3006` in blocked requests): the image predates the baked
  `REACT_APP_HOCUSPOCUS_URL`; rebuild with `e2e/scripts/build-e2e-image.sh`.
- `image ... does not exist; build it with e2e/scripts/build-e2e-image.sh`: the default image is only a local tag.
- `@npm` tests time out or components render an empty area: the app container cannot reach the npm registry (CD-4 shows
  no error). `--grep-invert @npm` skips those tests, but the run still needs the npm registry for `npm ci`.
- `@playwright/test ... does not match the runner image`: align `package-lock.json` and `PLAYWRIGHT_IMAGE`; the script
  header has the lockfile command.
- A component dropped right after the editor opens is thin or zero-width: D-5; use `EditorPage.open()`.
- The app does not answer within 300 s: the script prints the last 60 log lines of the container.
