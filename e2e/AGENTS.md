# AGENTS.md: how to write and change tests in e2e/

Source of truth for AI coding agents. What the suite is, how to run it, the catalogue, the defect table and the
D-3 rules: [README.md](README.md).
Mark anything you did not check as NOT VERIFIED. Never guess a locator, a timing or a product behaviour: measure it.
Rules say when they apply. "Existing exception" means reviewed code that deviates; do not copy it into new tests.

## 1. Adding a test: steps

1. Pick the scenario (README, "Scenarios") and the folder (section 2). Read one existing spec of that folder.
2. Read the helpers: `src/dsl/builders.ts`, `src/api/client.ts`, `src/constants.ts`, the `src/<area>/` helpers (table in section 8).
3. Read the client source of the component for its events, exposed values and timings. Cite the path in a comment; a line number is optional.
4. Seed the app through the API from builders (section 3).
5. Write the assertions (section 4). Import `test` and `expect` from `src/fixtures`, never from `@playwright/test` (accepted exception: stack-free unit specs, section 8).
6. Tags (section 6) and defect annotation (section 7) where they apply.
7. From `e2e/`: `./node_modules/.bin/tsc --noEmit`. Success = exit status 0 and no TypeScript diagnostics.
8. From the repository root: `e2e/scripts/run-in-docker.sh <path relative to e2e/>`.
9. Gate for your change type (section 9).
10. Invert the key assertion once, show it FAILS, restore (section 9).
11. Re-measure `--list` counts after the last edit and update the README catalogue.

## 2. Where things go

| Kind of test | Folder |
|---|---|
| fastest checks of harness and main flow | `tests/smoke/` |
| sign-in, sign-up | `tests/auth/` |
| invitation, sharing | `tests/workspace/` |
| app list, card menu, trash, publish | `tests/apps/` |
| editor interaction (drag, resize, rename, property, JS query) | `tests/editor/` |
| PostgreSQL and node-service data source queries, tables | `tests/datasource/` |
| triggers, temporary state, local storage | `tests/logic/` |
| modules | `tests/modules/` |
| visual components, npm components, Extensions panel | `tests/components/` |
| access control: cross-workspace, roles, groups, forged credentials, mass assignment, public leakage, collaboration rooms, CORS | `tests/security/` |
| profile, password, API keys of a user (user lifecycle) | `tests/account/` |
| unit tests of builders, fixtures, page objects, helpers | `tests/foundation/` or next to the area |

MUST:
- Put reusable or exported helpers in `src/<area>/` (`src/logic/`, `src/datasource/`, `src/components/`,
  `src/simple-components/`, `src/modules/`, `src/pages/`, `src/security/`) and give each a unit test (pattern:
  `tests/logic/helpers.spec.ts`, `tests/components/scenario-helpers.spec.ts`).
- Edit shared files additively: `src/dsl/builders.ts`, `src/constants.ts`, `src/pages/*.ts`, `src/fixtures.ts`,
  `playwright.config.ts`, `src/api/client.ts`, `fixtures/sql/init.sql`. Re-read the file right before editing; others
  edit them. Do not reorder, rename or reformat existing code there.
- Keep `PRODUCTS` in `src/constants.ts` and `fixtures/sql/init.sql` equal.

Accepted exception: setup utilities used by one spec only may stay in that spec (existing: `insertAndSave` in
`components/insert-all.spec.ts`, `buildHostInEditor` in `modules/module-editor-host.spec.ts`, test factories in
`foundation/*.spec.ts`, `openApp` in `components/chat.spec.ts`). Move a function to `src/<area>/` as soon as a second spec needs it.

## 3. Building a test case

MUST:
- Seed through the API: `createApp` and `publishApp` (`src/api/client.ts`), DSL from `appDsl(items, parts)`. Helpers:
  `openSeededView` (`src/components/scenario.ts`), `openSeededApp` (`src/simple-components/seed.ts`).
- Use `component(type, { id, testId, ... })`: it starts from the recorded default in `fixtures/dsl/<type>.json`. Hook
  types (`modal`, `drawer`, `toast`, `chatController`, `meeting`) use `hook` or `recordedHookOf`.
- Bind one text per observed value (`boundText`) and assert one target per text, so a failure names the property.
- Locate by `data-testid` (`view.byTestId`, `view.buttonByTestId`) or role first. `view.byCompName` only for types in
  `TYPES_WITHOUT_TEST_ID` (`src/components/insert-catalog.ts`).
- Drive the editor through page objects in `src/pages/`; add a method there when one is missing.
- Use the fixtures of `src/fixtures.ts`: `apiUser` (own user and organisation), `newUserSession`, `uniqueEmail`. Parallel tests share nothing.
- Scope every PostgreSQL write by the test's own `owner` (`OWNER_STATE_NAME`, `OWNER_FILTER`,
  `insertUpdateDeleteQueries` in `src/datasource/notes-queries.ts`). `products` and `items` are read-only and shared.
- Use data: URIs from `src/media.ts` for images, audio, video, PDF (the guard blocks external hosts).
- Use `page.clock` for time-driven behaviour where possible (`tests/logic/triggers.spec.ts`).

Accepted exceptions:
- CSS-class, positional (`nth`, `first`, `last`) or `.ant-*` locators inside a component are allowed when the component
  exposes no role or test id and a comment says why. Existing: `components/choices.spec.ts`, `media.spec.ts`,
  `rich-inputs.spec.ts`, `sliders-color.spec.ts`, `src/pages/PropertyPanel.ts`, `src/pages/TableView.ts`. Prefer
  adding the lookup to a page object.
- Editor-built apps are allowed when the editor flow is the subject (`tests/editor/`, `smoke/editor-drag.spec.ts`, M3).

MUST NOT:
- Hard-code credentials, host names, ports or generated resource ids: use `uniqueEmail`, `TEST_PASSWORD`, `POSTGRES`, `FIREBIRD`,
  `APP_PAGE`, ids returned by the API. Deterministic DSL item ids and test ids local to one spec are fine.
- Let tests depend on each other or on test order.

## 4. Waiting and assertions

MUST:
- Use web-first `expect(locator)` and `expect.poll`. Expect timeout is 15 s (`playwright.config.ts`).
- Prove a state transition: assert the "before" state, act, assert the "after" state (pattern:
  `tests/components/displays.spec.ts`). An assertion already true before the action proves nothing. This applies to
  assertions meant to prove an action's effect; initial-render, structural, error and pure unit assertions need no "before".
- Give `expect` a message when several assert in a row in an integration test (`expect(x, "numberInput value")`).
  Optional on isolated, self-explanatory unit assertions (`tests/foundation/`, `tests/logic/helpers.spec.ts`).
- For "nothing must happen" in new tests, use `expectTextStays(page, locator, expected, description, { windowMs })`
  (`src/logic/helpers.ts`) over `NEGATIVE_EVENT_WINDOW_MS`.
- Name every fixed wait as a constant with the measured reason in its doc comment. Existing: `GRID_SETTLE_MS`,
  `DEBOUNCE_SETTLE_MS`, `NEGATIVE_EVENT_WINDOW_MS`, `RTE_REMOUNT_SETTLE_MS` (`tests/components/rich-inputs.spec.ts`),
  `VIEW_OBSERVATION_MS` (`src/components/insert-all.ts`).
- Set a per-test timeout from a named constant when a test needs more than 60 s.

MUST NOT:
- Use `waitForTimeout` as an assertion, or to "let things settle" without a named, measured constant.
- Use `networkidle` as proof that a feature works.

Accepted exceptions:
- `toBeVisible` is valid when visibility is the behaviour (a dialog opens, a panel shows). Do not use it where a text or
  attribute can be asserted.
- Negative checks that do NOT use `expectTextStays` (existing, NOT to copy): `components/chat.spec.ts` and
  `foundation/logic-builders.spec.ts` (fixed `waitForTimeout`), `foundation/module-host.spec.ts` and
  `components/timer.spec.ts` (own polling or gap).

## 5. Constants

MUST:
- Use `TAGS`, `RUN_FLAGS`, `API_PATHS`, `applicationPath(...)`, `APP_PAGE`, `UI_PATHS`, `TABLE_LABELS`,
  `EXTENSIONS_LABELS`, `EVENT_HANDLER_LABELS` from `src/constants.ts` instead of repeating them.
- Name, with a doc comment, every credential, generated-id prefix, shared UI label, route and timing value whose reason
  is not obvious. Shared ones go to `src/constants.ts`; area-only ones to `src/<area>/` or the top of the spec.

MUST NOT:
- Write routes (`"/api/applications"`), tags (`"@slow"`), credentials or unexplained timings (`15000`) inline.

Coordinates, DSL item ids, test ids and labels used by one spec only may be local literals.

## 6. Tags

- `@smoke`: only the few fastest checks of harness and main flow (`tests/smoke/`, `apps/publish-draft.spec.ts`).
- `@core`: a main user flow of the base suite (auth, apps, editor, datasource, logic, workspace).
- `@security`: an access-control test of `tests/security/` (`TAGS.SECURITY`); the P0 set also carries `@core` and is selected by its ids, see README "security".
- `@lifecycle`: a user-lifecycle test (sign-up to deletion), ids `LC-<area><nn>`, details from `lifecycleTestDetails` / `lifecycleCandidateDetails` in `src/security/quarantine.ts` (`TAGS.LIFECYCLE`); in the default run, quarantined through the same two maps as the security ids.
- `@superadmin`: the four instance-super-admin tests SEC-R16a to SEC-R16d (`TAGS.SUPERADMIN`, pass `[TAGS.SUPERADMIN]` as `extraTags` of `securityTestDetails`). Opt-in like `@quarantine`: out of the default run and of the `@security` and P0 runs, in only with `E2E_INCLUDE_SUPERADMIN=1` (README, D-47). A test that carried both `@quarantine` and `@superadmin` would need both variables (none does since SEC-R16c and SEC-R16d left the quarantine).
- `@enterprise`: a test of the second stack in ENTERPRISE workspace mode (SEC-E01 to SEC-E07b, `TAGS.ENTERPRISE`, pass it in `extraTags` of `securityTestDetails`). Never runs on the default stack; with `E2E_STACK_PROFILE=enterprise` it is the only selection (README, "ENTERPRISE stack"). All its tests share ONE workspace: name only your own users, never count the members, never remove, demote or re-password the super admin. SEC-E05 resets the super admin's password, so it also carries `@enterprise-takeover` (`TAGS.ENTERPRISE_TAKEOVER`), which every run leaves out unless `E2E_INCLUDE_ENTERPRISE_TAKEOVER=1` (enterprise profile, with `E2E_INCLUDE_QUARANTINE=1`); then it is the ONLY test of the run. Its file keeps trace, screenshot and video off and passes no response body to an assertion (the reset answer holds a password).
- `@slow`: the test needs noticeably longer (PostgreSQL, npm, many editor steps).
- `@npm`: the test needs the app container to reach the npm registry.
- `@quarantine` and `@insert-all`: see section 7 and the README.
- `@node-service`: the node-service data source tests (`tests/datasource/node-plugins-catalogue.spec.ts`, D3; `tests/datasource/plugin-duckdb.spec.ts`, D4; `tests/datasource/plugin-turso-slack.spec.ts`, D5; `tests/datasource/plugin-graphql.spec.ts`, D6; `tests/datasource/plugin-openapi.spec.ts`, D7; `tests/datasource/plugin-openapi-wrappers-data.spec.ts`, D8; `tests/datasource/plugin-openapi-wrappers-apps.spec.ts`, D9; `tests/datasource/plugin-aws-sdk.spec.ts`, D10; `tests/datasource/plugin-supabase-storage.spec.ts`, D11; `tests/datasource/plugin-firebird.spec.ts`, D12, `tests/datasource/plugin-turso-libsql.spec.ts`, D13, and `tests/datasource/plugin-couchdb.spec.ts`, D14, which also wear the opt-in tag of the next bullet; `TAGS.NODE_SERVICE`). A selection tag (`--grep @node-service`), not an opt-in one: the tests stay in the default run, and `excludedTags` does not list it. The stack-free unit spec `tests/foundation/node-plugins.spec.ts` carries it too: the one exception to the next bullet.
- `@node-service-sidecar`: a node-service data source test that needs a real server of its own to be pointed at: either the echo cannot serve the plugin's protocol (Firebird, a wire protocol, `tests/datasource/plugin-firebird.spec.ts`, D12) or the echo's canned answers say nothing about the real server's behaviour (a libSQL server for the Turso plugin, `tests/datasource/plugin-turso-libsql.spec.ts`, D13, and a CouchDB server for the CouchDB plugin, `tests/datasource/plugin-couchdb.spec.ts`, D14); `TAGS.NODE_SERVICE_SIDECAR`. Worn NEXT TO `@node-service`. Opt-in like `@superadmin`: out of the default run (neither listed nor run, and `run-in-docker.sh` starts no such container), in only with `E2E_INCLUDE_NODE_SERVICE_SIDECARS=1` (default stack only). A spec that calls `firebirdConnection()`, `libsqlConnection()` or `couchdbConnection()` must tag every test with it (a guard in `foundation/run-selection.spec.ts` parses the spec: write `{ tag: [TAGS.NODE_SERVICE, TAGS.NODE_SERVICE_SIDECAR] }` on the describe or the test, not through a variable). Never put the tag text in a test title: the default `grepInvert` matches titles too and would drop the test. The helper that reads a sidecar's host variable throws when it is unset, so a test selected without its sidecar fails loudly. All three sidecars start together under the one flag; later sidecars add their container under it too.
- Untagged is normal: component scenarios (S2 to S20), unit, helper and foundation tests carry no tag (exception: `foundation/node-plugins.spec.ts`, `@node-service`).
- Always use `TAGS.*`. A test with a tag string in its title only as test data stays untagged (`foundation/run-selection.spec.ts`).

## 7. Defects

MUST:
- Quarantine rule: a test that asserts the DESIRED behaviour and fails today gets `tag: TAGS.QUARANTINE` (excluded from
  the default run). Existing: `editor/drop-size.spec.ts` (D-5) and the icon switch in `components/displays.spec.ts` (CD-9 candidate, with a `defect` annotation).
- A characterisation or workaround test that passes while documenting a defect is NOT quarantined. Give it
  `annotation: { type: "defect", description: "<id>" }` (examples: `tests/logic/temporary-state.spec.ts` CD-7, `components/npm-components.spec.ts` CD-5; conditional form
  `testInfo.annotations.push({ type: "defect", description })` in `components/choices.spec.ts`, CD-8 candidate). D-5's
  `drop-size.spec.ts` and CD-3's `timer.spec.ts` carry no annotation today; adding one is allowed.
- Other annotation types: `D-3 retry`, `handler retry` (retries of S1, M3, `foundation/editor-modules.spec.ts`), `observation`
  (`modules/module-versions.spec.ts`).
- Cite the defect id in a comment where a test works around it (D-3, D-5, CD-3, CD-5, CD-7). The README table defines them.
  CD-5 is an observation, not a confirmed defect.
- Add a new finding to the README ("Security findings" for the security tests, "Known defects" otherwise); until it is there, name it "<id> candidate" in the annotation.
- Use the D-3 retry only in the editor-save specs S1 (`tests/components/insert-all.spec.ts`) and M3
  (`tests/modules/module-editor-host.spec.ts`): one retry on a fresh app, annotation `D3_RETRY_ANNOTATION`
  (`src/constants.ts`), `test.describe.configure({ retries: 0, timeout: 180_000 })`. Reporter:
  `src/reporters/d3-threshold-reporter.ts` (`D3_GATED_SPEC_FILES`); add a spec there only after agreeing it with the user.

MUST NOT:
- Weaken, loosen or delete an assertion to hide a product defect.
- Enable Playwright retries on S1 or M3. `playwright.config.ts` has one global retry under `CI` only; S1 and M3 switch it off.
- Apply the D-3 retry to a test whose save is not the subject (S16 and S19 change organisation settings, not the DSL).
- Pass `--reporter=...` in a real S1 or M3 gate run: it replaces the config's reporters and bypasses the D-3 gate.
  `--reporter=list` is for `--list` commands only. Expect `D-3 gate within the limit: ...` on stderr.

D-3 threshold: the reporter counts tests that ran per gated file and fails above `floor(ran / 2)`. The limits 56 of 112
and 5 of 10 apply to the complete gates only. A targeted run of fewer S1 or M3 tests gets a smaller limit; a one-test
run allows zero D-3 retries and fails if that test uses its retry.

## 8. Prohibited, and helpers to reuse

MUST NOT:
- Run two `run-in-docker.sh` stacks against the same checkout at once (lock `e2e/.run.lock`; they share `node_modules`,
  `test-results`, `playwright-report`), and do not run `playwright test` directly while a stack of this checkout runs.
- Edit anything in `e2e/evidence/` (git-ignored, local). Do not cite it as if it were in git.
- Reach a real external host, switch the guard off, or add a route that allows another origin. Only `@npm` tests need
  the app container to reach the npm registry. The places the backend may be pointed at are the run's own echo sidecar (`echo` fixture, `src/security/echo.ts`) and, only in a run with `E2E_INCLUDE_NODE_SERVICE_SIDECARS=1`, the opt-in node-service sidecars: the Firebird sidecar (`firebirdConnection()`, `src/datasource/firebird.ts`), the libSQL server sidecar (`libsqlConnection()`, `src/datasource/libsql.ts`) and the CouchDB sidecar (`couchdbConnection()`, `src/datasource/couchdb.ts`). Later opt-in sidecars add their names to this sentence. Never give a data source or a registry entry any other URL, and never rely on a placeholder host failing to resolve: every connection of a sidecar test goes to the sidecar.
- Import `test` from `@playwright/test` in a spec that opens a page or uses the stack: the network guard exists only in the `test` of `src/fixtures.ts` (accepted exception for stack-free unit specs below).
- Commit secrets. The PostgreSQL password in `src/constants.ts` is the throw-away one of the sidecar. The Firebird password in `src/constants.ts` is likewise the throw-away one of its own sidecar, and so are the libSQL tokens (`LIBSQL`): signed with a key pair generated once, whose private half was thrown away, and the CouchDB admin of its sidecar (`COUCHDB`).
- Let the super admin's password (`E2E_SUPERUSER_PASSWORD`, new every run, set by `run-in-docker.sh`) reach a command line, log, trace, report, test title, annotation or error message; keep `set -x` off in the script. Never give the password to a matcher as the expected or received value (`expect(text).not.toContain(password)` prints it when it fails): assert `text.includes(password)` is `false`. The sign-in lives in an automatic worker fixture (`superAdminState`) because a request context created inside a test lands in its trace; do not sign the super admin in from a test or a helper, and create no request context in a helper. Every test that uses the `superAdmin` fixture carries `TAGS.SUPERADMIN` (a guard in `foundation/run-selection.spec.ts` checks it by parsing the spec with the TypeScript compiler: write the tag as `TAGS.SUPERADMIN` in the test's or its describe's details, a mention in a comment or title does not count). The super admin is ONE account shared by all workers: never switch its workspace or change its password. It hangs once the stack holds more than about 420 workspaces (README, security section): the SEC-R16 tests therefore carry `@superadmin` and run only on request (`E2E_INCLUDE_SUPERADMIN=1`); keep such runs short.
- Duplicate a helper that exists:

| Need | Helper | File |
|---|---|---|
| user, app, module, permissions, datasource | `registerUser`, `createApp`, `createModule`, `publishApp`, `updateApp`, `getAppDsl`, `setPublicToAll`, `grantAppPermission`, `createPostgresDatasource`, `createN8nDatasource`, `createNodePluginDatasource`, `nodePluginDatasourceBody`, `supportedDatasourceTypes`, `testDatasourceRaw`, `pluginDynamicConfigRaw`, `setNpmRegistry`, `createInvitation`, `acceptInvitation` | `src/api/client.ts` |
| component from its recording | `component`, `recordedItem`, `recordedHook`, `recordedHookOf`, `hook` | `src/dsl/builders.ts`, `src/dsl/recorded.ts` |
| layout and app | `stackItems`, `containerOf`, `appDsl`, `button`, `text`, `input`, `table`, `barChart` | `src/dsl/builders.ts` |
| events and actions | `eventHandler`, `executeQuery`, `setTempState`, `runScript`, `executeComp`, `triggerModuleEvent` | `src/dsl/builders.ts` |
| queries, state, logic | `postgresQuery`, `jsQuery`, `n8nWorkflowsQuery` (recordings in `fixtures/dsl/n8n/`, loaded by `recordedN8nQuery` and `recordedN8nDatasource`), `nodePluginQuery` (recordings in `fixtures/dsl/plugins/<id>/`, loaded by `recordedPluginQuery` (a plugin whose saved query differs by action has one recording per action: `<id><Action>Query.json`, `recordedPluginQuery(id, "<Action>")`) and `recordedPluginDatasource`, checked by `parsePluginRecording`), `tempState`, `transformer`, `dataResponder` | `src/dsl/builders.ts` |
| modules | `moduleApp`, `moduleInstance`, `scenarioModuleDsl`, `waitForSavedInstance`, `HandlerRetryBudget` | `src/dsl/builders.ts`, `src/modules/moduleScenario.ts` |
| bound text, nested override, seeded view | `boundText`, `withValueAt`, `openSeededView` | `src/components/scenario.ts` |
| containers and slots | `containerWithChildren`, `slotChild`, `slotContainers`, `openSeededApp` | `src/simple-components/seed.ts` |
| catalogue, saved-DSL polling | `INSERT_TYPES`, `HOOK_TYPES`, `searchTextOf`, `waitForSavedType`, `prepareForPublish` | `src/components/insert-catalog.ts`, `src/components/insert-all.ts` |
| notes and products queries | `selectProductsQuery`, `selectNotesQuery`, `noteWriteQuery`, `insertUpdateDeleteQueries` | `src/datasource/notes-queries.ts` |
| node-service plugin ids and catalogue | `NODE_PLUGIN_IDS`, `nodePluginIdsOf`, `NODE_PLUGIN_FIXTURE_PLACEHOLDER_URL`, `OPEN_API_FIXTURE_SPEC` (canned OpenAPI document for the generic `openApi` plugin), `parseBasicAuthorization` (decodes a Basic `Authorization` header an echo record holds), `parseSigV4Authorization` (splits an AWS SigV4 `Authorization` header into key, date, region, service, signed headers and signature) | `src/datasource/node-plugins.ts` |
| negative and counter reads, local storage | `expectTextStays`, `countAfterEquals`, `parseCounter`, `rawLocalStorage` | `src/logic/helpers.ts` |
| media | `PNG_RED`, `PNG_BLUE`, `WAV`, `WEBM`, `MP4`, `PDF`, `PDF_RAW_B64` | `src/media.ts` |
| security actors, quarantine, answers, tokens | `Actor`, `adminOfApiUser`, `joinWorkspace`, `makeDeveloper`, `makeAdmin`, `grantApp`, `seedPrivateApp`, `sceneOf`, `memberOf`, `roleOf`, `permissionIdOf`, `securityTestDetails`, `securityCandidateDetails`, `expectAnswer`, `expectDeniedAs`, `forgeApiKeyToken`, `forgeUnsignedToken`, `withRandomSignature`, `tokenIsSignedWith`, `superAdminCredentials`, `SUPER_ADMIN_ENV`, `enterpriseAdmin` (ENTERPRISE stack: an actor the super admin makes admin of the one workspace), `echoTargetPath`, `echoReadPrefix`, `echoBaseUrl`, `echoUrlByIp` (an echo target URL with its host replaced by the echo's IP address, `E2E_ECHO_IP`: for a plugin that derives a host name from its endpoint, e.g. an S3 bucket call; never address a bucket of the `e2e-echo` alias), `recordsContain` (requests the SERVER makes, read back from the HTTP echo sidecar: the `echo` fixture gives a test its own target `url` and `received()`; a denial must follow a positive control that the echo does receive from that path; compare a secret with `recordsContain(...)` as a boolean, never as a matcher's value) (the `actor`, `superAdmin` and `echo` fixtures are in `src/fixtures.ts`; the raw-answer helper `apiRaw` and the other security API helpers are in `src/api/client.ts`) | `src/security/actors.ts`, `scene.ts`, `quarantine.ts`, `assertions.ts`, `tokens.ts`, `super-admin.ts`, `enterprise.ts`, `echo.ts` |
| Firebird sidecar connection (opt-in sidecar: throws `FirebirdSidecarMissingError` when `E2E_FIREBIRD_HOST` is unset), the rows of `fixtures/firebird/init.sql` | `firebirdConnection`, `FirebirdSidecarMissingError`, `FIREBIRD_ITEMS` | `src/datasource/firebird.ts` |
| libSQL sidecar connection (opt-in sidecar: throws `LibsqlSidecarMissingError` when `E2E_LIBSQL_HOST` is unset) and a direct pipeline call to it from the test process (the control that shows the server's own answer) | `libsqlConnection`, `libsqlDirect`, `LibsqlSidecarMissingError`, `LIBSQL_PIPELINE_PATH` | `src/datasource/libsql.ts` |
| CouchDB sidecar connection (opt-in sidecar: throws `CouchdbSidecarMissingError` when `E2E_COUCHDB_HOST` is unset) and a direct HTTP call to it from the test process, plain or as the sidecar's admin (the control that shows the server's own status and body, and the way a test makes and removes its own database) | `couchdbConnection`, `couchdbDirect`, `couchdbAdmin`, `CouchdbSidecarMissingError` | `src/datasource/couchdb.ts` |
| pages | `EditorPage`, `AppViewPage`, `PropertyPanel`, `QueryPanel`, `TableView`, `ExtensionsPanel`, `AppListPage`, `AuthPage`, `LoginPage`, `UserMenu`, `SettingPage`, `DatasourcePage` | `src/pages/` |

Accepted exception to the `test` import rule: stack-free unit specs that open no browser page (no `page`, no app) may
import `test` from `@playwright/test`, because the network guard only guards browser contexts. Existing:
`foundation/builders.spec.ts`, `recorded.spec.ts`, `node-plugins.spec.ts`, `run-selection.spec.ts`, `media.spec.ts`, and the security specs
`foundation/security-api-raw.spec.ts`, `security-echo.spec.ts` and `lifecycle-mail-sink.spec.ts` (start `scripts/echo-server.js` on loopback ports), `lifecycle-mail.spec.ts`, `security-quarantine.spec.ts`, `security-constants.spec.ts`, `security-tokens.spec.ts`, `security-assertions.spec.ts`, `security-super-admin.spec.ts`. Anything that opens
a page or talks to the stack imports from `src/fixtures`.

Two helpers share a name with different meanings; do not add a third: `testIdOf(name)` in `src/components/scenario.ts`
(`e2e-<name>`, S2 to S7) and `testIdOf(compType)` in `src/components/insert-all.ts` (`probe-<type>`, S1). Two
`SavedDslTimeoutError` classes exist, in `src/components/insert-all.ts` and `src/modules/moduleScenario.ts`, one per scenario family.

## 9. Evidence before declaring a test done

Put the output in your final report (command, directory, last lines). Scope by change type:

| Change | Required run |
|---|---|
| helper, builder, page object | its unit spec, plus every spec that uses a changed page object |
| scenario or spec file | `e2e/scripts/run-in-docker.sh --repeat-each=10 --workers=4 <file>` (repository root) |
| S1 (`insert-all`) | the S1 gate command in README, once |
| M3 (`module-editor-host`) | the M3 gate command in README |

MUST, in this order:
1. From `e2e/`: `./node_modules/.bin/tsc --noEmit` exits 0 with no TypeScript diagnostics (other shell output does not count).
2. Run the scope above and quote the pass line.
3. Invert the key assertion (expect the wrong value), run, quote the FAIL, restore, run green. For a guard or negative
   assertion, break its input the same way. The checkout is shared and dirty: run `git diff -- <file>` before and after,
   and restore only your own change (edit it back; never `git checkout` or `git stash` a file others edit).
4. After your LAST edit, re-run `--list --reporter=list` and update every count you wrote; drop any `file:line` you
   cannot re-verify.

MUST NOT:
- Report "should pass" or "same as before". Report what ran.
- Cite a number measured before a later edit.

## 10. Common mistakes found in this suite

Source: comments in the named files. The loss rates, timings and browser behaviours were measured in an earlier session
and are NOT VERIFIED in tracked evidence.

- **richTextEditor typed too early:** it remounts once about 500 ms after mounting; text typed before is lost. Wait
  `RTE_REMOUNT_SETTLE_MS` (no page signal exists). `tests/components/rich-inputs.spec.ts`.
- **Step control, Step 1:** the selected step is not clickable. Test `change` by selecting Step 2 by its button name.
  `tests/components/buttons.spec.ts`.
- **Strict-mode violation from a leaving dropdown:** a closing antd dropdown is not yet `-hidden`; take `.last()` of the
  visible ones. `src/pages/PropertyPanel.ts` (`visibleDropdown`).
- **`networkidle` after an iframe was added:** a component that adds a frame later (`iframe`, `custom`) keeps network
  idle from firing; await it first. `tests/components/insert-all.spec.ts`.
- **numberInput:** it writes `value` when editing finishes; press Enter or blur. `tests/components/inputs.spec.ts`.
- **Icon from a name to a `data:` URI keeps the old icon** (CD-9 candidate; `@quarantine`).
  `tests/components/displays.spec.ts`.
- **floatingButton group intercepts clicks:** give it its own column (`FLOATING_BUTTON_COLUMN`) and click its option by
  `FLOATING_OPTION_ONE_SELECTOR`. `tests/components/buttons.spec.ts`.
- **Handler retry (M3):** `setTempStateAction(state, value, { eventName, retryAllowed, onRetry })` retries once through the
  existing handler; pass `retryAllowed: false` when the caller's `HandlerRetryBudget` is spent.
  `TableView.headerCell(title)` matches the exact title; `ExtensionsPanel.tile(kind, pkg)` and `tileVersion(kind, pkg)` take the list kind first.
- **Drop right after the editor opens:** width 0 (D-5) or a lost save (D-3). Open with `EditorPage.open()`.
- **Parallel writes to `notes` without the `owner` scope:** tests see each other's rows (4 of 4 parallel copies
  failed when measured; NOT VERIFIED here).

## 11. Commands cheat-sheet

Repository root (paths after the script are relative to `e2e/`):

```bash
e2e/scripts/build-e2e-image.sh                                            # once
e2e/scripts/run-in-docker.sh                                              # default run
e2e/scripts/run-in-docker.sh tests/components/inputs.spec.ts              # one file
e2e/scripts/run-in-docker.sh -g "typed value reaches"                     # one test by title
e2e/scripts/run-in-docker.sh --grep @smoke                                # by tag
e2e/scripts/run-in-docker.sh --repeat-each=10 --workers=4 <file>          # general repeat gate
E2E_INCLUDE_QUARANTINE=1 e2e/scripts/run-in-docker.sh --grep @quarantine
E2E_INCLUDE_INSERT_ALL=1 e2e/scripts/run-in-docker.sh --grep @insert-all --workers=4          # S1 gate, once
E2E_INCLUDE_SUPERADMIN=1 e2e/scripts/run-in-docker.sh --grep @superadmin                      # SEC-R16a, R16b (R16c, R16d also need E2E_INCLUDE_QUARANTINE=1)
E2E_INCLUDE_NODE_SERVICE_SIDECARS=1 e2e/scripts/run-in-docker.sh --repeat-each=10 --workers=4 tests/datasource/plugin-firebird.spec.ts   # D12 gate: starts the Firebird sidecar (image pull, a few seconds)
E2E_INCLUDE_NODE_SERVICE_SIDECARS=1 e2e/scripts/run-in-docker.sh --repeat-each=10 --workers=4 tests/datasource/plugin-turso-libsql.spec.ts   # D13 gate: starts both sidecars (Firebird and libSQL)
E2E_INCLUDE_NODE_SERVICE_SIDECARS=1 e2e/scripts/run-in-docker.sh --repeat-each=10 --workers=4 tests/datasource/plugin-couchdb.spec.ts   # D14 gate: starts all three sidecars (Firebird, libSQL and CouchDB)
E2E_INCLUDE_NODE_SERVICE_SIDECARS=1 e2e/scripts/run-in-docker.sh --grep @node-service-sidecar   # only the tests that need a sidecar
e2e/scripts/run-in-docker.sh --repeat-each=10 --workers=4 tests/modules/module-editor-host.spec.ts   # M3 gate
E2E_STACK_PROFILE=enterprise e2e/scripts/run-in-docker.sh --repeat-each=10 --workers=4 tests/security/enterprise.spec.ts   # ENTERPRISE stack gate (its own stack; never at the same time as another run)
E2E_INCLUDE_QUARANTINE=1 E2E_INCLUDE_ENTERPRISE_TAKEOVER=1 E2E_STACK_PROFILE=enterprise e2e/scripts/run-in-docker.sh   # SEC-E05 ALONE, on its own stack
E2E_HOST_PORT=8080 e2e/scripts/run-in-docker.sh <file>                    # also reach the app on 127.0.0.1:8080
```

Directory `e2e/` (no stack; `--reporter=list` is required so no report files are written):

```bash
./node_modules/.bin/tsc --noEmit
LOWCODER_BASE_URL=http://localhost:1 ./node_modules/.bin/playwright test --list --reporter=list
E2E_INCLUDE_QUARANTINE=1 LOWCODER_BASE_URL=http://localhost:1 ./node_modules/.bin/playwright test --list --reporter=list
E2E_INCLUDE_SUPERADMIN=1 LOWCODER_BASE_URL=http://localhost:1 ./node_modules/.bin/playwright test --list --reporter=list
E2E_INCLUDE_NODE_SERVICE_SIDECARS=1 LOWCODER_BASE_URL=http://localhost:1 ./node_modules/.bin/playwright test --list --reporter=list   # adds the D12, D13 and D14 tests
E2E_INCLUDE_INSERT_ALL=1 E2E_INCLUDE_QUARANTINE=1 E2E_INCLUDE_SUPERADMIN=1 LOWCODER_BASE_URL=http://localhost:1 ./node_modules/.bin/playwright test --list --reporter=list
E2E_STACK_PROFILE=enterprise LOWCODER_BASE_URL=http://localhost:1 ./node_modules/.bin/playwright test --list --reporter=list   # the SEC-E tests only
```
