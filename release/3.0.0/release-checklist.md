# Lowcoder 3.0.0 release preparation

Prepared on 11 October 2026, Europe/Madrid. Status: **local preparation, before the dev-to-main merge**.

## Ready to use

- [Release announcement](release-notes.md): public copy for GitHub.
- [Merge message](merge-message.md): proposed dev-to-main PR title/body, following the repository template.
- [Illustrated preview](release-preview.html): the announcement with the five supplied screenshots and links to the original demo videos.
- [Media guide](media-guide.md): captions, placement, and original video paths.
- [Issue audit](issue-audit.md): all 46 issues matching Awaiting Release, including prior-release overlap and remaining verification gaps.

The HTML preview, media guide, media manifest, and screenshot copies are local review artifacts excluded from Git by this folder's .gitignore. The announcement, merge message, issue audit, and checklist can be included with the version changes.

Suggested release title: **Lowcoder v3.0.0 — Build faster. Run faster. Stay in control.**

Use Git tag **3.0.0**, matching the repository's existing unprefixed tags and Docker image convention. The public product name remains **Lowcoder v3.0.0**.

## Verified starting point

| Item | Observation |
| --- | --- |
| Repository | lowcoder-org/lowcoder |
| Local branch | dev; clean before preparation |
| Live dev SHA | 2d9317fc3afb1faedb1acc26112b113f63a2f9e7 |
| Live main SHA | db7aae37ded3c4bf64bfa21042aa8787b984fd9c |
| Latest published release | 2.7.6, Equilibrium, published 3 January 2026 |
| Comparison | main is an ancestor of dev; dev has 339 additional commits |
| Existing dev-to-main PR | None found at the initial check |
| Existing 3.0.0 or v3.0.0 tag | Neither found |
| Awaiting Release issues | 46 total; 21 already represented in main, 25 additional candidates |
| Source media | All five screenshots and all five videos exist |
| Public media uploads | Not performed |

Sources: [main](https://github.com/lowcoder-org/lowcoder/tree/main), [dev](https://github.com/lowcoder-org/lowcoder/tree/dev), [2.7.6 release](https://github.com/lowcoder-org/lowcoder/releases/tag/2.7.6), [comparison](https://github.com/lowcoder-org/lowcoder/compare/main...dev).

## Local changes prepared

Application version metadata is aligned to 3.0.0 in:

- client/VERSION
- client/package.json
- client/packages/lowcoder/package.json
- client/packages/lowcoder-comps/package.json
- client/packages/lowcoder-sdk/package.json
- client/packages/lowcoder-sdk-webpack-bundle/package.json
- server/node-service/package.json
- server/api-service/pom.xml
- server/api-service/lowcoder-server/src/main/resources/application.yaml
- deploy/helm/Chart.yaml, appVersion

The Helm chart version was already 3.0.0 and stays there. Its README and frontend comment now describe the intended 3.0.0 images. Independently versioned packages and third-party dependency versions are unchanged.

These changes and the release materials are **uncommitted and unpushed**. No PR, tag, or GitHub release has been created. Nothing has been merged or deployed by this preparation.

## Before merging dev into main

- [ ] Review the announcement and include the local version/document changes in the release branch.
- [ ] Account for the existing npm publication behavior before pushing the version updates: SDK and Comps workflows trigger on pushes to dev and can publish changed versions immediately. They do not wait for a GitHub release.
- [ ] Open the dev-to-main PR using the merge message and preserve the repository's intended merge strategy.
- [ ] Confirm Client and Node Service builds on the final candidate. Their CI steps named “Run tests” currently execute build commands; they are not evidence of a full unit test suite.
- [ ] Run the application tests required for the final candidate and check representative existing apps.
- [ ] Resolve the two issue-audit gaps: #2101 ListView behavior and the external Gantt plugin/version for #2111.
- [ ] Recheck live branch SHAs after any intervening changes.

The inspected dev Docker run was [38092929519](https://github.com/lowcoder-org/lowcoder/actions/runs/38092929519). At the initial check, the all-in-one build had succeeded and later image steps were still running. That run predates the local version bump and is not validation of the prepared 3.0.0 commit.

## What the merge and publication trigger

| Action | Existing repository automation |
| --- | --- |
| Push changed versions to dev | Docker dev build for matching source paths; npm SDK/Comps publication may run |
| Merge to main | Hocuspocus, Agora token service, and proxy image builds for matching changed paths; SDK bundle build and production Netlify deployment; main code analysis workflows |
| Publish a stable GitHub release | Main Docker image workflow builds the release tag for amd64 and arm64 |
| Mark that release latest | Docker workflow also updates latest for the five main images |

The supporting service image workflows publish only dev/latest, not 3.0.0 tags. The main Docker workflow currently labels its frontend commit build argument as “dev #SHA” even for releases; use exact SHAs and image digests to establish provenance, not that text alone.

## After Falk merges

- [ ] Record the exact new main SHA and confirm it includes the selected dev commit and 3.0.0 metadata.
- [ ] Wait for successful main builds of lowcoder-hocuspocus, lowcoder-agora-token-service, and lowcoder-proxy-service; confirm amd64 and arm64 images and record their digests.
- [ ] Verify the SDK bundle deployment at sdk.lowcoder.cloud is from the merged source, including navigation and timer behavior in embedded apps.
- [ ] Create a draft GitHub release with tag 3.0.0 targeting that exact main SHA.
- [ ] Paste release-notes.md and upload the five screenshot/video pairs where indicated by media-guide.md. The public copy must use GitHub attachment URLs, never local filesystem paths.
- [ ] Confirm the release is stable and intended to be Latest.
- [ ] Publish the release when the release owner proceeds with the post-merge release step.
- [ ] Wait for all five main image builds: lowcoder-ce, lowcoder-ce-frontend, lowcoder-enterprise-frontend, lowcoder-ce-node-service, lowcoder-ce-api-service.
- [ ] Confirm 3.0.0 tags and both target architectures. Do not announce install availability while images are still building.
- [ ] Verify the deployed runtime and SDK version against the chosen main SHA.
- [ ] Reconcile Awaiting Release labels against what was actually delivered.

## Focused smoke checks

- Existing simple and complex apps open, edit, publish, and run with their queries and permissions intact.
- Long editor sessions, history, repeated ListView content, selection, and dragging behave correctly; compare performance with the same app/data when making speed claims.
- A compatible Template loads; components can be dropped into its zones, saved, reopened, and published.
- Automator access follows the AI Robot subscription; connection setup, generated edits, JSON recipe inspection, deterministic recipes, and partial/error outcomes behave correctly.
- AI Chat can create/switch threads and exchange messages through the configured query. Chat Box room data persists through application queries and presence/typing work between two users.
- A theme exports and imports into another workspace with the expected styling.
- Components and a modal with nested content copy between apps.
- Agora meetings join, leave, reconnect, and share screens with configured tokens.
- Enterprise licensing reaches its configured request/checkout flow; do not perform a paid checkout merely as a smoke test.
- Regression scenarios cover datasource access, prepared JS queries, form defaults, dates, table download overrides and filtering, and embedded navigation/timers.

## Validation limits

Passed locally: all 10 version sources agree on 3.0.0; package JSON and Maven XML parse; all 46 issue rows occur exactly once; all 21 prior-release commit references are ancestors of main; public issue/document references map to inspected sources; five screenshot hashes match the originals; five original video paths exist; HTML structure/media references and git diff formatting pass. Original YAML newline layout is preserved.

No full application build, benchmark, regression suite, paid license transaction, or production deployment is certified by this preparation. The previously inspected dev Docker run was still in progress at the final check.

The in-app browser blocks file URLs, so the HTML preview could not be visually inspected there. Its structure and local image/video references are checked as files; open it locally to review the rendered presentation.
