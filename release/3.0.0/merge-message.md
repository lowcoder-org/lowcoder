# Lowcoder v3.0.0

## Proposed changes

Merge `dev` into `main` for Lowcoder 3.0.0: faster apps and a more responsive builder, AI-assisted app construction that stays editable, and reusable Templates with Lowcoder drop-zones.

Months of work come together in this release:

- Address memory leaks and unnecessary re-renders, including editor history, editor state, component selection, and ListView rendering.
- Introduce AI Automator and inspectable JSON recipes for creating and updating apps. AI Robot subscription required; model-provider usage is separate.
- Introduce Templates: developer-maintained layouts with editable Lowcoder drop-zones.
- Add AI Chat plus Chat Box and Chat Controller for assistant and room-based chat experiences.
- Add theme import/export, laying the groundwork for future marketplace theme exchange.
- Add copying components between apps, including modals.
- Renew the Agora meeting integration and improve screen sharing and track lifecycle stability.
- Enable Enterprise license requests and checkout directly in Lowcoder.
- Deliver community fixes covering datasource access, prepared queries, forms, dates, tables, layouts, file uploads, navigation, and embedded apps.

Use [the release announcement](https://github.com/lowcoder-org/lowcoder/blob/dev/release/3.0.0/release-notes.md) as the GitHub release body after this merge. The [issue audit](https://github.com/lowcoder-org/lowcoder/blob/dev/release/3.0.0/issue-audit.md) covers all 46 Awaiting Release issues and separates 21 existing main changes from 25 additional release candidates. The new-issue list includes two entries requiring a final implementation/plugin check (#2101 and #2111).

## Types of changes

- [x] Bugfix
- [x] New feature
- [ ] Breaking change
- [x] Documentation Update

The unchecked breaking-change box is not a compatibility certification. Check representative existing apps and the updated deployment configuration before publication.

## Checklist

- [x] Prepare release notes, issue inventory, media placement, and publication checklist.
- [x] Align local application, SDK, component, backend, and Helm app version metadata to 3.0.0.
- [ ] Commit and include these local preparation changes in the merge.
- [ ] Verify the client and Node Service builds on the final merge candidate.
- [ ] Complete application tests and the smoke scenarios in the release checklist.
- [ ] Confirm the external Gantt plugin fix and ListView issue scope.
- [ ] Verify dependent service images and the embedded SDK bundle after merge.
- [ ] Confirm the final main SHA before creating the release tag.

## Further comments

[Release checklist](https://github.com/lowcoder-org/lowcoder/blob/dev/release/3.0.0/release-checklist.md) records the exact refs and automation triggers. Pushing the SDK/Comps version changes to dev can publish npm packages under the existing workflows. Merging main publishes the supporting services and SDK bundle; publishing the stable GitHub release starts the main Docker image build.

Preparation validates metadata and documents the release path. It does not certify a complete application test run or production deployment.
