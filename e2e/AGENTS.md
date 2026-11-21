# AGENTS.md: how to write and change tests in e2e/

Source of truth for AI coding agents. What the suite is, how to run it, the catalogue, the defect table and the
D-3 rules: [README.md](README.md). Plans (`../client/E2E-TESTING-components-p0-index-plan.md` to `...-p7-priorities-plan.md`,
`../client/E2E-TESTING-defects-report.md`, `../client/E2E-TESTING-components-defects-report.md`) are untracked local files of
the owner: do not commit or move them; this file and the README do not depend on them.
Mark anything you did not check as NOT VERIFIED. Never guess a locator, a timing or a product behaviour: measure it.
Rules say when they apply. "Existing exception" means reviewed code that deviates; do not copy it into new tests.

## 1. Adding a test: steps

1. Pick the scenario (README, "Scenarios") and the folder (section 2). Read one existing spec of that folder.
2. Read the helpers: `src/dsl/builders.ts`, `src/api/client.ts`, `src/constants.ts`, the `src/<area>/` helpers (table in section 8).
3. Read the client source of the component for its events, exposed values and timings. Cite the path in a comment; a line number is optional.
4. Seed the app through the API from builders (section 3).
5. Write the assertions (section 4). Import `test` and `expect` from `src/fixtures`, never from `@playwright/test`.
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
| PostgreSQL queries, tables | `tests/datasource/` |
| triggers, temporary state, local storage | `tests/logic/` |
| modules | `tests/modules/` |
| visual components, npm components, Extensions panel | `tests/components/` |
| unit tests of builders, fixtures, page objects, helpers | `tests/foundation/` or next to the area |

MUST:
- Put reusable or exported helpers in `src/<area>/` (`src/logic/`, `src/datasource/`, `src/components/`,
  `src/simple-components/`, `src/modules/`, `src/pages/`) and give each a unit test (pattern:
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
- Hard-code credentials, host names, ports or generated resource ids: use `uniqueEmail`, `TEST_PASSWORD`, `POSTGRES`,
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
- `@slow`: the test needs noticeably longer (PostgreSQL, npm, many editor steps).
- `@npm`: the test needs the app container to reach the npm registry.
- `@quarantine` and `@insert-all`: see sections 7 and README.
- Untagged is normal: component scenarios (S2 to S20), unit, helper and foundation tests carry no tag.
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
  CD-5 is an observation in the report, not a confirmed defect.
- Write a new finding into the matching report when you can; until it is there, name it "<id> candidate" in the annotation.
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
  the app container to reach the npm registry.
- Import `test` from `@playwright/test` in a spec: the network guard exists only in the `test` of `src/fixtures.ts`.
- Commit secrets. The PostgreSQL password in `src/constants.ts` is the throw-away one of the sidecar.
- Duplicate a helper that exists:

| Need | Helper | File |
|---|---|---|
| user, app, module, permissions, datasource | `registerUser`, `createApp`, `createModule`, `publishApp`, `updateApp`, `getAppDsl`, `setPublicToAll`, `grantAppPermission`, `createPostgresDatasource`, `createInvitation`, `acceptInvitation` | `src/api/client.ts` |
| component from its recording | `component`, `recordedItem`, `recordedHook`, `recordedHookOf`, `hook` | `src/dsl/builders.ts`, `src/dsl/recorded.ts` |
| layout and app | `stackItems`, `containerOf`, `appDsl`, `button`, `text`, `input`, `table`, `barChart` | `src/dsl/builders.ts` |
| events and actions | `eventHandler`, `executeQuery`, `setTempState`, `runScript`, `executeComp`, `triggerModuleEvent` | `src/dsl/builders.ts` |
| queries, state, logic | `postgresQuery`, `jsQuery`, `tempState`, `transformer`, `dataResponder` | `src/dsl/builders.ts` |
| modules | `moduleApp`, `moduleInstance`, `scenarioModuleDsl`, `waitForSavedInstance`, `HandlerRetryBudget` | `src/dsl/builders.ts`, `src/modules/moduleScenario.ts` |
| bound text, nested override, seeded view | `boundText`, `withValueAt`, `openSeededView` | `src/components/scenario.ts` |
| containers and slots | `containerWithChildren`, `slotChild`, `slotContainers`, `openSeededApp` | `src/simple-components/seed.ts` |
| catalogue, saved-DSL polling | `INSERT_TYPES`, `HOOK_TYPES`, `searchTextOf`, `waitForSavedType`, `prepareForPublish` | `src/components/insert-catalog.ts`, `src/components/insert-all.ts` |
| notes and products queries | `selectProductsQuery`, `selectNotesQuery`, `noteWriteQuery`, `insertUpdateDeleteQueries` | `src/datasource/notes-queries.ts` |
| negative and counter reads, local storage | `expectTextStays`, `countAfterEquals`, `parseCounter`, `rawLocalStorage` | `src/logic/helpers.ts` |
| media | `PNG_RED`, `PNG_BLUE`, `WAV`, `WEBM`, `MP4`, `PDF`, `PDF_RAW_B64` | `src/media.ts` |
| pages | `EditorPage`, `AppViewPage`, `PropertyPanel`, `QueryPanel`, `TableView`, `ExtensionsPanel`, `AppListPage`, `AuthPage`, `LoginPage`, `UserMenu` | `src/pages/` |

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
- **Parallel writes to `notes` without the `owner` scope:** tests see each other's rows (p4 plan: 4 of 4 parallel copies
  failed; NOT VERIFIED here).

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
e2e/scripts/run-in-docker.sh --repeat-each=10 --workers=4 tests/modules/module-editor-host.spec.ts   # M3 gate
E2E_HOST_PORT=8080 e2e/scripts/run-in-docker.sh <file>                    # also reach the app on 127.0.0.1:8080
```

Directory `e2e/` (no stack; `--reporter=list` is required so no report files are written):

```bash
./node_modules/.bin/tsc --noEmit
LOWCODER_BASE_URL=http://localhost:1 ./node_modules/.bin/playwright test --list --reporter=list
E2E_INCLUDE_QUARANTINE=1 LOWCODER_BASE_URL=http://localhost:1 ./node_modules/.bin/playwright test --list --reporter=list
E2E_INCLUDE_INSERT_ALL=1 E2E_INCLUDE_QUARANTINE=1 LOWCODER_BASE_URL=http://localhost:1 ./node_modules/.bin/playwright test --list --reporter=list
```
