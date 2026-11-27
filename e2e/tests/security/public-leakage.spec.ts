import { apiRaw, currentUser, getApp, setPublicToAll, updateApp } from "../../src/api/client";
import {
  API_ERRORS,
  API_OK,
  API_PATHS,
  PASSWORD_RESET_EMAIL_TEMPLATE_KEY,
  POSTGRES,
  PRODUCTS,
  appViewPath,
  orgCommonSettingsPath,
  orgUpdatePath,
  orgsByUserPath,
} from "../../src/constants";
import { SELECT_PRODUCTS_SQL, selectProductsQuery } from "../../src/datasource/notes-queries";
import { appDsl, button, postgresQuery } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { postgresConnection } from "../../src/postgres";
import {
  SEEDED_APP_NAME,
  SEEDED_BUTTON_ID,
  SEEDED_BUTTON_NAME,
  SEEDED_BUTTON_TEST_ID,
  SEEDED_BUTTON_TEXT,
} from "../../src/security/actors";
import { expectAnswer } from "../../src/security/assertions";
import { securityTestDetails } from "../../src/security/quarantine";
import { sceneOf } from "../../src/security/scene";
import { executeAppQueryRaw } from "../../src/api/client";

/**
 * What an anonymous visitor learns from a PUBLIC app and from the routes that need no session (A09 and A10). A (the
 * `apiUser`, admin of OA) owns the app; N is a browser context that never signed in.
 */

const ALLOWED = { status: 200, code: API_OK } as const;
const TEMPLATE_TEXT = "e2e-sec-reset-template";
const DRAFT_QUERY_ID = "q2";
const DRAFT_QUERY_NAME = "draftOnly";
const DRAFT_QUERY_SQL = "SELECT 'e2e-sec-draft-only' AS marker";
/** The top-level keys of a published view answer's `data` (measured on 3.0.0). */
/** The workspace name SEC-A10b sets, so the name does not hold the address of its creator (a default name does). */
const NEUTRAL_WORKSPACE_NAME = "e2e-neutral-workspace";
/** The shared paged envelope of the anonymous e-mail lookup, sorted: `total` counts the listed workspaces. */
const LOOKUP_ENVELOPE_KEYS = ["code", "data", "message", "pageNum", "pageSize", "success", "total"];
const VIEW_DATA_KEYS = ["applicationDSL", "applicationInfoView", "moduleDSL", "orgCommonSettings", "templateId"];
/** A key of the public view that would reveal a person or a connection. */
const SENSITIVE_KEY = /mail|datasource|password|secret|token/i;

interface PublishedView {
  data: {
    applicationInfoView: Record<string, unknown>;
    applicationDSL: { queries?: { id: string; comp: Record<string, unknown> }[] };
    orgCommonSettings: Record<string, unknown>;
  };
}

test.describe("security: what a public app shows an anonymous visitor", () => {
  test("SEC-A09a the public view carries no password-reset e-mail template", securityTestDetails("SEC-A09a"), async ({ page, apiUser, newUserSession }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const anonymous = (await newUserSession()).page.request;
    await setPublicToAll(a.request, seeded.appId, true);
    expectAnswer(
      await apiRaw(a.request, "PUT", orgCommonSettingsPath(a.orgId), { data: { key: PASSWORD_RESET_EMAIL_TEMPLATE_KEY, value: TEMPLATE_TEXT } }),
      ALLOWED,
      "setup: A stores a template",
    );
    expect((await apiRaw(a.request, "GET", orgCommonSettingsPath(a.orgId))).body, "before: A's common settings hold it").toContain(TEMPLATE_TEXT);

    const answer = await apiRaw(anonymous, "GET", appViewPath(seeded.appId));

    expectAnswer(answer, ALLOWED, "the anonymous published view (the app is public)");
    expect(answer.body, "the view is the app's").toContain(SEEDED_BUTTON_TEST_ID);
    const settings = (answer.json as PublishedView).data.orgCommonSettings;
    expect(Object.keys(settings), "the workspace settings of the view have no reset template key").not.toContain(PASSWORD_RESET_EMAIL_TEMPLATE_KEY);
    expect(answer.body, "and the stored text is nowhere in it").not.toContain(TEMPLATE_TEXT);
  });

  test("SEC-A09b the public view carries a query's fields, never its SQL (pin)", securityTestDetails("SEC-A09b"), async ({ page, apiUser, newUserSession }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const anonymous = (await newUserSession()).page.request;
    await setPublicToAll(a.request, seeded.appId, true);
    expect(JSON.stringify((await getApp(a.request, seeded.appId)).dsl), "before: the owner's editing DSL holds the SQL").toContain(SELECT_PRODUCTS_SQL);

    const answer = await apiRaw(anonymous, "GET", appViewPath(seeded.appId));

    expectAnswer(answer, ALLOWED, "the anonymous published view");
    const query = (answer.json as PublishedView).data.applicationDSL.queries?.find((item) => item.id === seeded.queryId);
    expect(query, "the view lists the query").toBeDefined();
    expect(Object.keys(query?.comp ?? {}), "its comp carries `fields` only").toEqual(["fields"]);
    expect(answer.body, "no SQL text in the view").not.toContain(SELECT_PRODUCTS_SQL);
  });

  test("SEC-A09c a draft-only query of a public app cannot be run anonymously", securityTestDetails("SEC-A09c"), async ({ page, apiUser, newUserSession }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const anonymous = (await newUserSession()).page.request;
    await setPublicToAll(a.request, seeded.appId, true);
    const draftQuery = postgresQuery({ id: DRAFT_QUERY_ID, name: DRAFT_QUERY_NAME, datasourceId: seeded.datasourceId, sql: DRAFT_QUERY_SQL });
    const dsl = appDsl(
      [button({ id: SEEDED_BUTTON_ID, name: SEEDED_BUTTON_NAME, text: SEEDED_BUTTON_TEXT, testId: SEEDED_BUTTON_TEST_ID })],
      { queries: [selectProductsQuery(seeded.datasourceId, seeded.queryId), draftQuery] },
    );
    await updateApp(a.request, seeded.appId, { dsl });
    expect(JSON.stringify((await getApp(a.request, seeded.appId)).dsl), "setup: the draft holds the new query").toContain(DRAFT_QUERY_ID);
    const ownerDraftRun = await executeAppQueryRaw(a.request, { applicationId: seeded.appId, queryId: DRAFT_QUERY_ID, viewMode: false });
    expectAnswer(ownerDraftRun, ALLOWED, "before: the owner runs the draft-only query in edit mode");
    expect(ownerDraftRun.body, "with its marker").toContain("e2e-sec-draft-only");
    const published = await apiRaw(anonymous, "GET", appViewPath(seeded.appId));
    expect(published.body, "before: the published version does not have it").not.toContain(DRAFT_QUERY_NAME);
    const run = await executeAppQueryRaw(anonymous, { applicationId: seeded.appId, queryId: seeded.queryId, viewMode: true });
    expectAnswer(run, ALLOWED, "before: the published query runs anonymously (the app is public)");
    expect(run.body, "with its rows").toContain(PRODUCTS.FIRST_NAME);

    const answer = await executeAppQueryRaw(anonymous, { applicationId: seeded.appId, queryId: DRAFT_QUERY_ID, viewMode: false });

    // A draft query needs EDIT on the app, like the editing view (401 / 5001) (D-10).
    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the anonymous run of the draft-only query");
    expect(answer.body, "no draft result in the answer").not.toContain("e2e-sec-draft-only");
  });

  test("SEC-A09d the public view names no person and no connection (pin)", securityTestDetails("SEC-A09d"), async ({ page, apiUser, newUserSession }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const anonymous = (await newUserSession()).page.request;
    await setPublicToAll(a.request, seeded.appId, true);

    const answer = await apiRaw(anonymous, "GET", appViewPath(seeded.appId));

    expectAnswer(answer, ALLOWED, "the anonymous published view");
    const view = answer.json as PublishedView;
    expect(Object.keys(view.data).sort(), "the answer has exactly these parts").toEqual(VIEW_DATA_KEYS);
    expect(Object.keys(view.data.applicationInfoView).filter((key) => SENSITIVE_KEY.test(key)), "no key that names an e-mail, data source or secret").toEqual([]);
    expect(view.data.applicationInfoView.createBy, "the creator is an id").toBe(a.userId);
    expect(answer.body, "A's e-mail address is nowhere").not.toContain(a.email);
    expect(answer.body, "no data source connection").not.toContain("datasourceConfig");
    expect(answer.body, "no data source password").not.toContain(POSTGRES.PASSWORD);
    expect(answer.body, "no data source host").not.toContain(postgresConnection().host);
    expect(answer.body, "the app is the seeded one").toContain(SEEDED_APP_NAME);
  });
});

test.describe("security: routes that need no session", () => {
  test("SEC-A10a an anonymous caller cannot look up names by id", securityTestDetails("SEC-A10a"), async ({ page, apiUser, newUserSession }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const anonymous = (await newUserSession()).page.request;
    // All eight lists: the server reads each of them and answers 500 / 5000 for a missing one (measured).
    const request = {
      appIds: [seeded.appId],
      orgIds: [],
      userIds: [a.userId],
      groupIds: [],
      bundleIds: [],
      datasourceIds: [],
      folderIds: [],
      libraryQueryIds: [],
    };
    const own = await apiRaw(a.request, "POST", API_PATHS.META, { data: request });
    expectAnswer(own, ALLOWED, "before: A looks the ids up (the request shape is valid)");
    expect(own.body, "and gets the app's name").toContain(SEEDED_APP_NAME);

    const answer = await apiRaw(anonymous, "POST", API_PATHS.META, { data: request });

    // Desired: the answer of every authenticated route to a caller without a session, 401 and no body (desired: 401).
    // Open on 3.0.0 and HEAD (SF-7), which answer the names.
    expectAnswer(answer, API_ERRORS.UNAUTHENTICATED, "the anonymous lookup");
    expect(answer.body, "with no body").toBe("");
    expect(answer.body, "no app name in the answer").not.toContain(SEEDED_APP_NAME);
    expect(answer.body, "no user name in the answer").not.toContain(a.email);
  });

  test("SEC-A10b the anonymous e-mail lookup answers per workspace its id and name only, in the shared paged envelope (pin)", securityTestDetails("SEC-A10b"), async ({ page, apiUser, newUserSession }) => {
    const { a } = await sceneOf(page, apiUser);
    const anonymous = (await newUserSession()).page.request;
    expectAnswer(await apiRaw(a.request, "PUT", orgUpdatePath(a.orgId), { data: { orgName: NEUTRAL_WORKSPACE_NAME } }), ALLOWED, "setup: A renames its workspace, so the name does not hold A's address");
    expect((await currentUser(a.request)).orgAndRoles.find((entry) => entry.org.id === a.orgId)?.org.name, "setup: the new name is stored").toBe(NEUTRAL_WORKSPACE_NAME);
    expect((await apiRaw(a.request, "GET", orgsByUserPath(a.email))).body, "before: the lookup works and names A's workspace for a signed-in caller").toContain(a.orgId);

    const answer = await apiRaw(anonymous, "GET", orgsByUserPath(a.email));

    // The lookup stays open by the owner's decision (2026-11-26): the sign-in and sign-up pages need it to offer the login
    // variants of a workspace. What is pinned is that each entry holds the id and the name the pages read, and nothing else.
    expectAnswer(answer, ALLOWED, "the anonymous lookup");
    const body = answer.json as Record<string, unknown>;
    expect(Object.keys(body).sort(), "the shared paged envelope, nothing more").toEqual(LOOKUP_ENVELOPE_KEYS);
    expect(body.data, "per workspace its id and name, exactly (no creation or update time)").toEqual([{ orgId: a.orgId, orgName: NEUTRAL_WORKSPACE_NAME }]);
    expect(body.total, "the count of the listed workspaces").toBe(1);
    expect(answer.body, "no address of A in the answer").not.toContain(a.email);
    expect(answer.body, "no user id of A in the answer").not.toContain(a.userId);

    const unknown = await apiRaw(anonymous, "GET", orgsByUserPath(`e2e-nobody-${Date.now()}@example.test`));
    expectAnswer(unknown, ALLOWED, "the lookup of an address nobody signed up with");
    expect({ data: (unknown.json as { data: unknown }).data, total: (unknown.json as { total: unknown }).total }, "answers no workspace").toEqual({ data: [], total: 0 });
  });

  test("SEC-A10c the metrics endpoint is not open to an anonymous caller", securityTestDetails("SEC-A10c"), async ({ page, apiUser, newUserSession }) => {
    const { a } = await sceneOf(page, apiUser);
    const signedIn = await apiRaw(a.request, "GET", API_PATHS.STATUS_PROMETHEUS);
    // Prometheus text format, not JSON: apiRaw's `code` is only ever set from a JSON body's `code` field, so a
    // plain-text 200 answer has code: undefined; assert the HTTP status directly instead of expectAnswer/ALLOWED.
    expect(signedIn.status, "before: a signed-in caller reads the Prometheus metrics").toBe(200);
    expect(signedIn.body, "Prometheus text format").toContain("# HELP");

    const anonymous = (await newUserSession()).page.request;

    const answer = await apiRaw(anonymous, "GET", API_PATHS.STATUS_PROMETHEUS);
    expectAnswer(answer, API_ERRORS.UNAUTHENTICATED, "the anonymous metrics request");
    expect(answer.body, "with no body (no metrics text)").toBe("");

    const byName = await apiRaw(anonymous, "GET", `${API_PATHS.STATUS_METRICS}/jvm.memory.used`);
    expectAnswer(byName, API_ERRORS.UNAUTHENTICATED, "the anonymous named-metric request");
    expect(byName.body, "with no body (no metric value)").toBe("");
  });
});
