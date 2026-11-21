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
`chartsGeoMap`, `openLayersGeoMap`, `hillchart`, `jsonLottie`, "class C" of plan p2) is not covered; their structural
lifecycle (insert, save, publish, load) is covered by S1 when `@insert-all` runs. No CI workflow runs this suite
(`.github/workflows/` has no e2e job).

## Design documents (untracked local files)

The plans and defect reports live in `../client/` as untracked local files of the owner. They are not in git and are
absent from a clean clone. This README and AGENTS.md summarise what a contributor needs, so nothing below depends on them:
`../client/E2E-TESTING-p0-index-plan.md` (base suite; p1 to p5 siblings), `../client/E2E-TESTING-components-p0-index-plan.md`
to `...-p7-priorities-plan.md` (p1 inventory, p2 testability, p3 simple scenarios, p4 data, p5 logic, p6 modules, p7
priorities and gates), `../client/E2E-TESTING-defects-report.md` (D-1 to D-5) and
`../client/E2E-TESTING-components-defects-report.md` (CD-1 to CD-7, observations O-1 to O-15). `e2e/evidence/` is
git-ignored, local only, and is never a source for claims in git.

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
- **Fixed app host name `lowcoder-e2e-app`** (`scripts/app-host.sh`): network alias of the app container;
  `LOWCODER_BASE_URL` is `http://lowcoder-e2e-app:3000`. Reason: the client's hocuspocus URL
  (`REACT_APP_HOCUSPOCUS_URL=ws://lowcoder-e2e-app:3000/hocuspocus`) is baked in at client build time and the guard
  compares every WebSocket host with the host of `LOWCODER_BASE_URL`. The name exists only inside a run's network; with
  `E2E_HOST_PORT` the chat components do not connect in a host browser.
- **Network guard** (`src/fixtures.ts`): HTTP(S) requests of a context to another origin are aborted with
  `blockedbyclient`; WebSockets to another host are closed with `socket.close()`. Service workers are blocked. The guard
  is installed only by the custom `test` exported from `src/fixtures.ts` (automatic fixture `networkGuard`, and
  `newUserSession` for further contexts). A spec that imports `test` from `@playwright/test` bypasses it; always import
  `test` and `expect` from `src/fixtures`. `blocked-requests.txt` is attached only for the primary `networkGuard`;
  URLs blocked in a `newUserSession` context are not attached. The guard covers browser contexts, not requests made by
  the backend inside the app container (which needs internet only for `@npm`: node-service fetches npm packages).
- **Users and isolation:** most tests use the `apiUser` fixture (own user and organisation, registered through the
  API). Exceptions: helper and unit tests register no user, `smoke/signup.spec.ts` registers through the UI, and
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
E2E_INCLUDE_INSERT_ALL=1 E2E_INCLUDE_QUARANTINE=1 e2e/scripts/run-in-docker.sh   # everything
```

Gates (a gate run must not pass `--reporter=...`, see below):

```bash
# General repeat gate for a new or changed test or file (repository root)
e2e/scripts/run-in-docker.sh --repeat-each=10 --workers=4 tests/components/inputs.spec.ts

# S1, the insert-every-component test (112 tests): ONCE, not --repeat-each; nightly command (repository root)
E2E_INCLUDE_INSERT_ALL=1 e2e/scripts/run-in-docker.sh --grep @insert-all --workers=4

# M3, the module host built in the editor (repository root)
e2e/scripts/run-in-docker.sh --repeat-each=10 --workers=4 tests/modules/module-editor-host.spec.ts
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

Untagged is normal (most component, unit and helper tests). The two opt-in variables are independent; a test with both
tags runs only when both are set (`src/run-selection.ts`). Tag strings inside `foundation/run-selection.spec.ts` are test
data; its tests are untagged.

| Variable | Read by | Effect |
|---|---|---|
| `LOWCODER_E2E_IMAGE` | run-in-docker.sh | app image (default `...:3.0.0-e2e`; a missing default image stops the run) |
| `PLAYWRIGHT_IMAGE` | run-in-docker.sh | runner image; version must equal `@playwright/test` in `package-lock.json` (1.64.0) |
| `POSTGRES_IMAGE` | run-in-docker.sh | PostgreSQL sidecar image |
| `E2E_INCLUDE_QUARANTINE`, `E2E_INCLUDE_INSERT_ALL` | script and config | non-empty: include that opt-in group |
| `E2E_HOST_PORT` | run-in-docker.sh | publish the app on `127.0.0.1:<port>` while the run lasts |
| `E2E_WORKERS` | playwright.config.ts | worker count, effective only when `playwright test` is run directly; NOT forwarded by the script |
| `CI` | script, config | `forbidOnly` and one retry |
| `LOWCODER_BASE_URL` | config | origin under test; set by the script; any URL works for `--list` |
| `E2E_POSTGRES_HOST` | `src/postgres.ts` | set by the script |
| `BASE_IMAGE`, `TARGET_IMAGE`, `CLIENT_REF` | build-e2e-image.sh | build inputs (defaults `...:3.0.0`, `...:3.0.0-e2e`, tag `3.0.0`) |

Exit code: the one of `playwright test` once it started; before that the script's own failure decides it (lock held,
missing image, version mismatch, Docker, PostgreSQL or app start-up, `npm ci`). One run per checkout at a time (lock
`e2e/.run.lock`). Both scripts say "from any directory": that holds only when the path you type resolves; use the
repository root paths above.

## Folder layout

```
e2e/
  package.json, package-lock.json   @playwright/test 1.64.0, typescript
  playwright.config.ts              config; grepInvert from src/run-selection.ts; D-3 reporter
  tsconfig.json                     strict, noUncheckedIndexedAccess
  client-hooks.patch                test hooks applied to the 3.0.0 client
  scripts/                          run-in-docker.sh, build-e2e-image.sh, app-host.sh
  fixtures/sql/init.sql             PostgreSQL data: items, products, notes
  fixtures/dsl/<type>.json          112 DSL defaults recorded from the editor
  src/
    constants.ts                    TAGS, RUN_FLAGS, D3_RETRY_ANNOTATION, API paths, timeouts with reasons, PRODUCTS, labels
    fixtures.ts                     `test` with networkGuard, apiUser, newUserSession; uniqueEmail
    run-selection.ts                grepInvert from the two opt-in variables
    postgres.ts                     postgresConnection()
    media.ts                        data: URI fixtures (PNG_RED, PNG_BLUE, WAV, WEBM, MP4, PDF, PDF_RAW_B64)
    api/client.ts                   HTTP API helpers
    dsl/builders.ts                 DSL builders; dsl/recorded.ts loads fixtures/dsl (RecordedFixtureError)
    pages/                          page objects: AppList, AppView, Auth, Editor, Extensions panel, Login, Property panel, Query panel, TableView, UserMenu
    logic/helpers.ts                rawLocalStorage, countAfterEquals, parseCounter, expectTextStays, DEBOUNCE_SETTLE_MS
    datasource/notes-queries.ts     query builders: shared read-only products, owner-scoped notes
    components/                     insert-all.ts (S1 helpers), insert-catalog.ts (112 types), scenario.ts (boundText, withValueAt, openSeededView)
    simple-components/seed.ts       container and slot seeds, openSeededApp
    modules/moduleScenario.ts       module scenario DSL, saved-instance polling, HandlerRetryBudget
    reporters/d3-threshold-reporter.ts   fails the run when more than half of S1 or M3 tests carry `D-3 retry`
  tests/                            specs by area (catalogue below)
  evidence/                         git-ignored, local only
  playwright-report/, test-results/ git-ignored output of the last run
```

## Scenarios

Test titles carry these ids (from the component plans p3 to p6).

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
default **242 tests in 59 files**; with `E2E_INCLUDE_QUARANTINE=1` **244 in 60**; with both opt-in variables **356 in 61**.
Default-run tag counts: `@smoke` 5, `@core` 29, `@slow` 39, `@npm` 32; `@quarantine` 2 and `@insert-all` 112 on request.

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

### foundation (80, unit and builder tests; several touch the stack)

| File | Proves | Tags | Tests |
|---|---|---|---|
| foundation/builders.spec.ts | every DSL builder's output shape | none | 35 |
| foundation/recorded.spec.ts | recorded-fixture parsing and errors | none | 5 |
| foundation/run-selection.spec.ts | `grepInvertFor` for the four flag cases | none | 8 |
| foundation/media.spec.ts | media fixtures have the right signatures | none | 8 |
| foundation/create-module.spec.ts | `createModule` request shape | none | 4 |
| foundation/module-host.spec.ts | module created through the API works in a host; republish rules | none | 2 |
| foundation/editor-modules.spec.ts | module page objects in the editor | @slow | 3 |
| foundation/extensions-panel.spec.ts | `ExtensionsPanel` page object | @npm @slow | 2 |
| foundation/logic-builders.spec.ts | logic builders seed an app the view runs | none | 1 |
| foundation/products-table.spec.ts | products fixture and `TableView` | none | 2 |
| foundation/table-view-header.spec.ts | header lookup is exact | none | 1 |
| foundation/d3-threshold-reporter.spec.ts | D-3 gate verdicts of the reporter | none | 9 |

## Known defects, observations and candidates

| Id | What | Suite handling |
|---|---|---|
| D-3 | an edit made right after the editor opens can be lost; `EditorPage.open()` waits for `data-editor-ready` and `GRID_SETTLE_MS`, which narrows but does not close the race | tests that save through the editor poll the saved DSL; S1 and M3 retry once (below) |
| D-5 | a component dropped right after ready is saved with width 0 | `GRID_SETTLE_MS` in `src/constants.ts`; `editor/drop-size.spec.ts` asserts the desired width and is `@quarantine` (no annotation) |
| CD-3 | the timer's `start`/`resume` events and state do not reach bindings | `components/timer.spec.ts` asserts display text and the `pause` event only (no annotation) |
| CD-5 | OBSERVATION in the report, not a confirmed defect: `barChart1.data` reads empty while the chart draws the bound data | `components/npm-components.spec.ts` (bound barChart test) asserts today's `chart=0` and carries `{type:"defect", description:"CD-5"}`; `datasource/query-feeds-components.spec.ts` asserts the binding through a text |
| CD-7 | `setIn` with a bad path or on a scalar fails silently (query ends as success) | `logic/temporary-state.spec.ts` asserts today's behaviour, annotation `{type:"defect", description:"CD-7"}`, default run |
| CD-8 candidate | `transfer` list titles are in the wrong order | conditional `defect` annotation in `components/choices.spec.ts`; not yet in the report |
| CD-9 candidate | an icon switched from a name to an image URL keeps the old icon | `components/displays.spec.ts`, `@quarantine`, `defect` annotation; not yet in the report |
| CD-4 | npm components fail silently without internet; version is `latest` | `@npm`, render-only assertions |

Quarantine decision rule: a test that asserts the DESIRED behaviour and fails today is `@quarantine`. A
characterisation or workaround test that passes while documenting a defect (CD-5, CD-7, CD-3 limits, D-3 handling) is not.

Annotation types used: `defect` (description = defect id) for a test that asserts or works around a defect;
`D-3 retry` and `handler retry` for the retries of S1/M3 and the editor-module tests; `observation` for a recorded
observation (`modules/module-versions.spec.ts`, O-12).

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
