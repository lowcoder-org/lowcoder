import type { Page } from "@playwright/test";
import { createApp, createN8nDatasource, executeAppQueryRaw, type RawAnswer, type RegisteredUser } from "../../src/api/client";
import { API_OK, SESSION_COOKIE_NAME } from "../../src/constants";
import { appDsl, button, n8nWorkflowsQuery } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { adminOfApiUser } from "../../src/security/actors";
import { recordsContain, type EchoTarget } from "../../src/security/echo";
import { securityTestDetails } from "../../src/security/quarantine";

/**
 * The n8n plugin's outbound request, proven at the HTTP echo sidecar (scripts/echo-server.js, `echo` fixture): SEC-X02a is the
 * positive control (a query parameter reaches the echo through the plugin), SEC-X02b asserts that the caller's session cookie
 * reaches no request of the plugin (defect D-27, fixed on this branch's server). A (the `apiUser`) owns the n8n data source and
 * runs the queries with its own session.
 *
 * SEC-X02b's echo records hold the session cookie when the defect is present, and the echo's answer to a read would carry it into a
 * trace: this file keeps the trace off (assertion messages never carry the cookie either; no test here opens a page, so a
 * screenshot or a video holds nothing).
 */
test.use({ trace: "off" });

/** The query ids of the n8n app: a control with a literal marker, and the one under test. */
const CONTROL_QUERY_ID = "q-control";
const PROBE_QUERY_ID = "q-probe";
/** Sends the benign cookie `BENIGN_COOKIE_NAME` as its `name` parameter: proves that cookie forwarding is on and works. */
const BENIGN_QUERY_ID = "q-benign";
/** A cookie of no importance that the test sets in A's own browser context next to the session cookie. */
const BENIGN_COOKIE_NAME = "E2E_BENIGN_COOKIE";
const N8N_WORKFLOWS_PATH = "/api/v1/workflows";
const N8N_KEY_HEADER = "x-n8n-api-key";
const BUTTON_ID = "b1";

/** What `n8nApp` hands a test. */
interface N8nApp {
  appId: string;
  marker: string;
  apiKey: string;
  benignValue: string;
}

/**
 * A (the `apiUser`) creates an n8n data source whose `serverURL` is the test's echo target and a saved app with two queries on it
 * (no publish: the editor's draft runs with `viewMode: false`): `q-control` sends the literal marker as the `name` parameter,
 * `q-probe` sends `probeNameParam`, `q-benign` sends the value of the benign cookie. `forwardAllCookies` sets the data source's
 * "Forward All Cookies" option (the branch that SEC-X02b is about). Needs no PostgreSQL.
 */
async function n8nApp(
  page: Page,
  apiUser: RegisteredUser,
  echo: EchoTarget,
  probeNameParam: string,
  options: { forwardAllCookies?: boolean } = {},
): Promise<N8nApp & { a: Awaited<ReturnType<typeof adminOfApiUser>> }> {
  const a = await adminOfApiUser(page.request, apiUser);
  const id = echo.path.split("/").pop();
  const marker = `e2e-marker-${id}`;
  const apiKey = `e2e-dummy-key-${id}`;
  const benignValue = `e2e-benign-${id}`;
  const datasourceId = await createN8nDatasource(a.request, {
    orgId: a.orgId,
    serverURL: echo.url,
    apiKey,
    forwardAllCookies: options.forwardAllCookies,
  });
  const queries = [
    n8nWorkflowsQuery({ id: CONTROL_QUERY_ID, name: "control", datasourceId, nameParam: marker }),
    n8nWorkflowsQuery({ id: PROBE_QUERY_ID, name: "probe", datasourceId, nameParam: probeNameParam }),
    n8nWorkflowsQuery({ id: BENIGN_QUERY_ID, name: "benign", datasourceId, nameParam: `{{${BENIGN_COOKIE_NAME}}}` }),
  ];
  const dsl = appDsl([button({ id: BUTTON_ID, name: "button1", text: "n8n", testId: "e2e-n8n" })], { queries });
  const { appId } = await createApp(a.request, { orgId: a.orgId, name: "e2e-n8n-app", dsl });
  return { a, appId, marker, apiKey, benignValue };
}

/** Runs a saved query of the app as A (`POST /api/query/execute`, the draft). */
async function runQuery(scene: Awaited<ReturnType<typeof n8nApp>>, queryId: string): Promise<RawAnswer> {
  return executeAppQueryRaw(scene.a.request, { applicationId: scene.appId, queryId, viewMode: false });
}

/** Positive control: the query with the literal marker reaches the echo through the n8n plugin, key and marker included. */
async function expectMarkerReachesEcho(scene: Awaited<ReturnType<typeof n8nApp>>, echo: EchoTarget): Promise<void> {
  const answer = await runQuery(scene, CONTROL_QUERY_ID);
  expect({ status: answer.status, code: answer.code }, "control: the n8n query ran").toEqual({ status: 200, code: API_OK });
  const records = await echo.received();
  expect(records, "control: the echo received exactly the control query's request").toHaveLength(1);
  const [record] = records;
  expect(record?.method).toBe("GET");
  expect(record?.path.startsWith(`${echo.path}${N8N_WORKFLOWS_PATH}?`), "control: the request goes to the workflows route of the target").toBe(true);
  expect(recordsContain(records, `name=${scene.marker}`), "control: the marker parameter arrived").toBe(true);
  expect(record?.headers[N8N_KEY_HEADER], "control: the data source's key rides on the request").toBe(scene.apiKey);
}

test.describe("security: the n8n plugin and the echo sidecar", () => {
  test("SEC-X02a+ a query parameter reaches the echo through the n8n plugin", securityTestDetails("SEC-X02a"), async ({ page, apiUser, echo }) => {
    const scene = await n8nApp(page, apiUser, echo, "unused");
    expect(await echo.received(), "before the run the echo holds nothing of this test").toEqual([]);
    await expectMarkerReachesEcho(scene, echo);
  });

  test("SEC-X02b the session cookie of the caller reaches no request of the n8n plugin", securityTestDetails("SEC-X02b"), async ({ page, apiUser, echo, baseURL }) => {
    // `{{<cookie name>}}` as the whole value: at 3.0.0 node-service's evaluation context holds every request cookie by name, and a
    // whole-value segment becomes the cookie entry, which the plugin sends as JSON in the URL (measured). Inside a longer string
    // the entry prints as "[object Object]", so only the whole-value form carries a cookie.
    const scene = await n8nApp(page, apiUser, echo, `{{${SESSION_COOKIE_NAME}}}`, { forwardAllCookies: true });
    // the benign cookie lives in A's browser context, whose cookie jar `page.request` shares with the session cookie
    await page.context().addCookies([{ name: BENIGN_COOKIE_NAME, value: scene.benignValue, url: baseURL as string }]);
    await expectMarkerReachesEcho(scene, echo);
    // positive control of the cookie forwarding: with "Forward All Cookies" on, the benign cookie reaches the echo
    await runQuery(scene, BENIGN_QUERY_ID);
    expect(recordsContain(await echo.received(), scene.benignValue), "control: the benign cookie reaches the echo with Forward All Cookies on").toBe(true);
    const cookie = (await scene.a.request.storageState()).cookies.find((entry) => entry.name === SESSION_COOKIE_NAME)?.value ?? "";
    expect(cookie.length > 0, "setup: A's session cookie is in its request context").toBe(true);
    await runQuery(scene, PROBE_QUERY_ID);
    const records = await echo.received();
    // the answer of the run is not asserted: a fixed server may answer an error. The assertion is on the value only, as a boolean,
    // so a failure message never prints the session cookie.
    expect(recordsContain(records, cookie), "the session cookie value appears in a record of the echo").toBe(false);
  });
});
