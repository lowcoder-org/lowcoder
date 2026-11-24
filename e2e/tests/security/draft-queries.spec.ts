import { apiRaw, createApp, createModule, executeAppQueryRaw, publishApp, updateApp } from "../../src/api/client";
import { API_ERRORS, API_OK, APP_ROLES, PRODUCTS, applicationPath } from "../../src/constants";
import { appDsl, button, moduleApp, moduleInstance, postgresQuery } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { expectAnswer } from "../../src/security/assertions";
import { securityTestDetails } from "../../src/security/quarantine";
import { grantApp } from "../../src/security/actors";
import { memberOf, sceneOf } from "../../src/security/scene";

/**
 * Draft and module queries by role (D-10): `POST /api/query/execute` in edit mode needs EDIT on the app; a module run
 * in another app's (the host's) editor needs EDIT on the host, membership, and READ on the module itself, and runs
 * the module's published queries, never its draft (a never-published module's draft IS its only version, accepted
 * behaviour). A = `apiUser` (admin of OA, owner of everything); E = a plain member with grants as stated; V = a plain
 * member with VIEWER only.
 */

const ALLOWED = { status: 200, code: API_OK } as const;

function moduleWithQueries(queries: object[]): object {
  return { ...moduleApp({}), queries };
}

function hostOf(moduleId: string): object {
  return appDsl([moduleInstance({ id: "m1", name: "module1", moduleId })]);
}

test.describe("security: draft and module queries by role (D-10)", () => {
  test("SEC-R19a+ an app editor runs the app's draft-only query", securityTestDetails("SEC-R19a"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const draftOnly = postgresQuery({ id: "q2", name: "draftOnly", datasourceId: seeded.datasourceId, sql: "SELECT 'e2e-sec-r19-draft' AS marker" });
    const dsl = appDsl([button({ id: "b1", name: "button1", text: "x", testId: "e2e-sec-r19a" })], {
      queries: [postgresQuery({ id: seeded.queryId, name: seeded.queryName, datasourceId: seeded.datasourceId, sql: "SELECT * FROM products ORDER BY id" }), draftOnly],
    });
    await updateApp(a.request, seeded.appId, { dsl });
    const e = await memberOf(a, actor, "editor");
    await grantApp(a, seeded.appId, e, APP_ROLES.EDITOR);

    const viewModeRun = await executeAppQueryRaw(e.request, { applicationId: seeded.appId, queryId: "q2", viewMode: true });
    expectAnswer(viewModeRun, API_ERRORS.QUERY_NOT_FOUND, "before: view mode cannot find the draft-only query");

    const draftRun = await executeAppQueryRaw(e.request, { applicationId: seeded.appId, queryId: "q2", viewMode: false });
    expectAnswer(draftRun, ALLOWED, "E's edit-mode run of the draft-only query");
    expect(draftRun.body, "with its marker").toContain("e2e-sec-r19-draft");

    const q1Run = await executeAppQueryRaw(e.request, { applicationId: seeded.appId, queryId: seeded.queryId, viewMode: false });
    expectAnswer(q1Run, ALLOWED, "E's edit-mode run of q1");
    expect(q1Run.body, "with product rows").toContain(PRODUCTS.FIRST_NAME);
  });

  test("SEC-R19b an app viewer cannot run the app's draft queries", securityTestDetails("SEC-R19b"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const draftOnly = postgresQuery({ id: "q2", name: "draftOnly", datasourceId: seeded.datasourceId, sql: "SELECT 'e2e-sec-r19-draft' AS marker" });
    const q1Draft = postgresQuery({ id: seeded.queryId, name: seeded.queryName, datasourceId: seeded.datasourceId, sql: "SELECT 'e2e-sec-r19-q1-draft' AS marker" });
    const dsl = appDsl([button({ id: "b1", name: "button1", text: "x", testId: "e2e-sec-r19b" })], { queries: [q1Draft, draftOnly] });
    await updateApp(a.request, seeded.appId, { dsl });
    const v = await memberOf(a, actor, "viewer");
    await grantApp(a, seeded.appId, v, APP_ROLES.VIEWER);

    const vViewRun = await executeAppQueryRaw(v.request, { applicationId: seeded.appId, queryId: seeded.queryId, viewMode: true });
    expectAnswer(vViewRun, ALLOWED, "before: V's view-mode run of q1 (the grant works)");
    expect(vViewRun.body, "the live (published) version, with product rows").toContain(PRODUCTS.FIRST_NAME);
    const aDraftRun = await executeAppQueryRaw(a.request, { applicationId: seeded.appId, queryId: "q2", viewMode: false });
    expectAnswer(aDraftRun, ALLOWED, "before: A's edit-mode run of q2");
    expect(aDraftRun.body, "with its marker (the grant and the query both work)").toContain("e2e-sec-r19-draft");

    const vDraftOnlyRun = await executeAppQueryRaw(v.request, { applicationId: seeded.appId, queryId: "q2", viewMode: false });
    expectAnswer(vDraftOnlyRun, API_ERRORS.NOT_AUTHORIZED, "V's edit-mode run of the draft-only query");
    expect(vDraftOnlyRun.body, "no draft marker").not.toContain("e2e-sec-r19-draft");

    const vQ1DraftRun = await executeAppQueryRaw(v.request, { applicationId: seeded.appId, queryId: seeded.queryId, viewMode: false });
    expectAnswer(vQ1DraftRun, API_ERRORS.NOT_AUTHORIZED, "V's edit-mode run of q1's draft");
    expect(vQ1DraftRun.body, "no draft marker, no rows").not.toContain("e2e-sec-r19-q1-draft");
    expect(vQ1DraftRun.body, "and no published product rows either (the request was denied outright)").not.toContain(PRODUCTS.FIRST_NAME);
  });

  test("SEC-R19c a host editor runs a module's published query, never its draft", securityTestDetails("SEC-R19c"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const mq1Live = postgresQuery({ id: "mq1", name: "mq1", datasourceId: seeded.datasourceId, sql: "SELECT 'e2e-sec-r19-live' AS marker" });
    const module = await createModule(a.request, { orgId: a.orgId, name: "e2e-sec-r19c-module", dsl: moduleWithQueries([mq1Live]) });
    await publishApp(a.request, module.appId);
    const mq1Draft = postgresQuery({ id: "mq1", name: "mq1", datasourceId: seeded.datasourceId, sql: "SELECT 'e2e-sec-r19-draft-mq1' AS marker" });
    const mq2DraftOnly = postgresQuery({ id: "mq2", name: "mq2", datasourceId: seeded.datasourceId, sql: "SELECT 'e2e-sec-r19-draft-only-mq2' AS marker" });
    await updateApp(a.request, module.appId, { dsl: moduleWithQueries([mq1Draft, mq2DraftOnly]) });

    const host = await createApp(a.request, { orgId: a.orgId, name: "e2e-sec-r19c-host", dsl: appDsl([moduleInstance({ id: "m1", name: "module1", moduleId: module.appId })]) });
    const e = await memberOf(a, actor, "editor");
    await grantApp(a, host.appId, e, APP_ROLES.EDITOR);
    await grantApp(a, module.appId, e, APP_ROLES.VIEWER);

    const aViewMq1 = await executeAppQueryRaw(a.request, { applicationId: module.appId, queryId: "mq1", viewMode: true });
    expectAnswer(aViewMq1, ALLOWED, "before: A's view-mode run of mq1 on M (live)");
    expect(aViewMq1.body, "the live marker").toContain("e2e-sec-r19-live");
    const aEditMq2 = await executeAppQueryRaw(a.request, { applicationId: module.appId, queryId: "mq2", viewMode: false });
    expectAnswer(aEditMq2, ALLOWED, "before: A's edit-mode run of mq2 on M (draft-only)");
    expect(aEditMq2.body, "the draft-only marker").toContain("e2e-sec-r19-draft-only-mq2");

    const eMq1ThroughHost = await executeAppQueryRaw(e.request, { applicationId: module.appId, queryId: "mq1", viewMode: false, path: [host.appId] });
    expectAnswer(eMq1ThroughHost, ALLOWED, "E's edit-mode run of mq1 through the host");
    expect(eMq1ThroughHost.body, "the live marker, never the draft").toContain("e2e-sec-r19-live");
    expect(eMq1ThroughHost.body, "never the draft marker").not.toContain("e2e-sec-r19-draft-mq1");

    const eMq2ThroughHost = await executeAppQueryRaw(e.request, { applicationId: module.appId, queryId: "mq2", viewMode: false, path: [host.appId] });
    expectAnswer(eMq2ThroughHost, API_ERRORS.QUERY_NOT_FOUND, "E's edit-mode run of mq2 (draft-only) through the host");
    expect(eMq2ThroughHost.body, "no draft-only marker").not.toContain("e2e-sec-r19-draft-only-mq2");

    const eMq1OwnEditor = await executeAppQueryRaw(e.request, { applicationId: module.appId, queryId: "mq1", viewMode: false });
    expectAnswer(eMq1OwnEditor, API_ERRORS.NOT_AUTHORIZED, "E's edit-mode run of mq1 in M's own editor (E does not edit M)");
    expect(eMq1OwnEditor.body, "no marker at all").not.toContain("e2e-sec-r19");
  });

  test(
    "SEC-R19d a host editor cannot run, through its host, a module it may not read",
    securityTestDetails("SEC-R19d"),
    async ({ page, apiUser, actor }) => {
      const { a, seeded } = await sceneOf(page, apiUser);
      const mq1Live = postgresQuery({ id: "mq1", name: "mq1", datasourceId: seeded.datasourceId, sql: "SELECT 'e2e-sec-r19d-live' AS marker" });
      const module = await createModule(a.request, { orgId: a.orgId, name: "e2e-sec-r19d-module", dsl: moduleWithQueries([mq1Live]) });
      await publishApp(a.request, module.appId);
      const host = await createApp(a.request, { orgId: a.orgId, name: "e2e-sec-r19d-host", dsl: appDsl([]) });
      const e = await memberOf(a, actor, "editor");
      await grantApp(a, host.appId, e, APP_ROLES.EDITOR);

      const save = await apiRaw(e.request, "PUT", applicationPath(host.appId), { data: { editingApplicationDSL: hostOf(module.appId) } });
      expectAnswer(save, ALLOWED, "before: E's save injecting the module into the host (the save checks no module right)");
      const aRun = await executeAppQueryRaw(a.request, { applicationId: module.appId, queryId: "mq1", viewMode: false, path: [host.appId] });
      expectAnswer(aRun, ALLOWED, "before: A's edit-mode run of mq1 with a valid path and membership");
      expect(aRun.body, "the live marker").toContain("e2e-sec-r19d-live");

      const eRun = await executeAppQueryRaw(e.request, { applicationId: module.appId, queryId: "mq1", viewMode: false, path: [host.appId] });
      expectAnswer(eRun, API_ERRORS.NOT_AUTHORIZED, "E's edit-mode run of mq1 through the host E injected but may not read");
      expect(eRun.body, "no marker").not.toContain("e2e-sec-r19d-live");
    },
  );

  test(
    "SEC-R19e a never-published module runs its draft for a host editor who may read it, but not in its own editor",
    securityTestDetails("SEC-R19e"),
    async ({ page, apiUser, actor }) => {
      const { a, seeded } = await sceneOf(page, apiUser);
      const nq1 = postgresQuery({ id: "nq1", name: "nq1", datasourceId: seeded.datasourceId, sql: "SELECT 'e2e-sec-r19-unpublished' AS marker" });
      const module2 = await createModule(a.request, { orgId: a.orgId, name: "e2e-sec-r19e-module", dsl: moduleWithQueries([nq1]) });
      const host = await createApp(a.request, { orgId: a.orgId, name: "e2e-sec-r19e-host", dsl: appDsl([moduleInstance({ id: "m1", name: "module1", moduleId: module2.appId })]) });
      const e = await memberOf(a, actor, "editor");
      await grantApp(a, host.appId, e, APP_ROLES.EDITOR);
      await grantApp(a, module2.appId, e, APP_ROLES.VIEWER);

      const eViewRun = await executeAppQueryRaw(e.request, { applicationId: module2.appId, queryId: "nq1", viewMode: true });
      expectAnswer(eViewRun, ALLOWED, "before: E's view-mode run of nq1 on M2 (READ already runs the only version)");
      expect(eViewRun.body, "with the marker").toContain("e2e-sec-r19-unpublished");

      const eThroughHost = await executeAppQueryRaw(e.request, { applicationId: module2.appId, queryId: "nq1", viewMode: false, path: [host.appId] });
      expectAnswer(eThroughHost, ALLOWED, "E's edit-mode run of nq1 through the host (accepted, 3.3 b)");
      expect(eThroughHost.body, "with the marker").toContain("e2e-sec-r19-unpublished");

      const eOwnEditor = await executeAppQueryRaw(e.request, { applicationId: module2.appId, queryId: "nq1", viewMode: false });
      expectAnswer(eOwnEditor, API_ERRORS.NOT_AUTHORIZED, "E's edit-mode run of nq1 in M2's own editor (E does not edit M2)");
      expect(eOwnEditor.body, "no marker").not.toContain("e2e-sec-r19-unpublished");
    },
  );
});
