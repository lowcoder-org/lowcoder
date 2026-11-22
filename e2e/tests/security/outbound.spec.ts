import { apiRaw, setNpmRegistry, setPublicToAll, type RawAnswer } from "../../src/api/client";
import { npmRegistryPath } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import type { EchoRecord, EchoTarget } from "../../src/security/echo";
import { securityTestDetails } from "../../src/security/quarantine";
import { sceneOf, type Scene } from "../../src/security/scene";

/**
 * Requests the SERVER makes inside the app container, proven at the HTTP echo sidecar (scripts/echo-server.js, `echo` fixture):
 * the npm registry proxy that forwards a registry call with the workspace's registry credential (SEC-X01; the n8n plugin's
 * scenarios SEC-X02 are in outbound-n8n.spec.ts). The tests are
 * defensive: the only request they cause leaves for the internal echo, and every denial is shown against a positive control
 * (the echo did receive the signed-in admin's call), so an empty echo cannot be a vacuous pass.
 * A (the `apiUser`, admin of OA) owns the private app and sets the registry; N is a browser context that never signed in.
 */

const STATUS_OK = 200;
const CLIENT_ERROR_MIN = 400;
const CLIENT_ERROR_MAX_EXCLUSIVE = 500;
/** The package the signed-in admin asks for (the positive control) and the one an actor under test asks for, so their records tell apart. */
const CONTROL_PACKAGE = "e2e-pkg";
const PROBE_PACKAGE = "e2e-pkg-probe";
/** The echo answers every request with an empty JSON object; the proxy hands it on. */
const ECHO_ANSWER_BODY = "{}";

interface RegistryScene extends Scene {
  /** The dummy registry credential of this test; not a secret, a marker that shows which request carried it. */
  token: string;
}

/** The pieces of a record a test asserts on. */
function recordOf(records: readonly EchoRecord[], echo: EchoTarget, packageName: string): EchoRecord[] {
  return records.filter((record) => record.path === `${echo.path}/${packageName}`);
}

/** A has a private app and points the workspace's npm registry at the test's echo target with a dummy bearer token. */
async function registryScene(
  page: Parameters<typeof sceneOf>[0],
  apiUser: Parameters<typeof sceneOf>[1],
  echo: EchoTarget,
): Promise<RegistryScene> {
  const scene = await sceneOf(page, apiUser);
  const token = `e2e-dummy-${echo.path.split("/").pop()}`;
  await setNpmRegistry(scene.a.request, scene.a.orgId, { url: echo.url, token });
  return { ...scene, token };
}

/** The call under test: `GET /api/npm/registry/{app}/{package}` as the given visitor. */
async function registryCall(request: Parameters<typeof apiRaw>[0], scene: Scene, packageName: string): Promise<RawAnswer> {
  return apiRaw(request, "GET", npmRegistryPath(scene.seeded.appId, packageName));
}

/** Positive control: the signed-in admin's call reaches the echo, so the echo can receive from this path. */
async function expectControlReachesEcho(scene: RegistryScene, echo: EchoTarget): Promise<void> {
  const answer = await registryCall(scene.a.request, scene, CONTROL_PACKAGE);
  expect({ status: answer.status, body: answer.body }, "control: the admin's registry call").toEqual({ status: STATUS_OK, body: ECHO_ANSWER_BODY });
  const controlRecords = recordOf(await echo.received(), echo, CONTROL_PACKAGE);
  expect(controlRecords, "control: the echo received the admin's call").toHaveLength(1);
  expect(controlRecords[0]?.headers.authorization, "control: the registry credential rides on the call").toBe(`Bearer ${scene.token}`);
}

test.describe("security: the npm registry proxy and the echo sidecar", () => {
  test("SEC-X01a+ the admin's registry call reaches the echo with the registry credential", securityTestDetails("SEC-X01a"), async ({ page, apiUser, echo }) => {
    const scene = await registryScene(page, apiUser, echo);
    expect(await echo.received(), "before the call the echo holds nothing of this test").toEqual([]);
    await expectControlReachesEcho(scene, echo);
    const [record] = recordOf(await echo.received(), echo, CONTROL_PACKAGE);
    expect(record?.method, "the proxy forwards a GET").toBe("GET");
  });

  test("SEC-X01b an anonymous call on a private app is refused before anything is forwarded", securityTestDetails("SEC-X01b"), async ({ page, apiUser, newUserSession, echo }) => {
    const scene = await registryScene(page, apiUser, echo);
    await expectControlReachesEcho(scene, echo);
    const anonymous = (await newUserSession()).page.request;
    const answer = await registryCall(anonymous, scene, PROBE_PACKAGE);
    // read the echo BEFORE asserting, so a failure reports both properties: the answer class and what was forwarded
    const forwarded = recordOf(await echo.received(), echo, PROBE_PACKAGE);
    expect.soft(
      answer.status >= CLIENT_ERROR_MIN && answer.status < CLIENT_ERROR_MAX_EXCLUSIVE,
      `the anonymous call on the private app is answered 4xx (got ${answer.status})`,
    ).toBe(true);
    expect.soft(forwarded, "nothing of the anonymous call reached the echo").toEqual([]);
  });

  test("SEC-X01c a signed-in outsider's call on a private app is refused before anything is forwarded", securityTestDetails("SEC-X01c"), async ({ page, apiUser, actor, echo }) => {
    const scene = await registryScene(page, apiUser, echo);
    await expectControlReachesEcho(scene, echo);
    const outsider = await actor("outsider");
    const answer = await registryCall(outsider.request, scene, PROBE_PACKAGE);
    // read the echo BEFORE asserting, so a failure reports both properties: the answer class and what was forwarded
    const forwarded = recordOf(await echo.received(), echo, PROBE_PACKAGE);
    expect.soft(
      answer.status >= CLIENT_ERROR_MIN && answer.status < CLIENT_ERROR_MAX_EXCLUSIVE,
      `the outsider's call on the private app is answered 4xx (got ${answer.status})`,
    ).toBe(true);
    expect.soft(forwarded, "nothing of the outsider's call reached the echo").toEqual([]);
  });

  test("SEC-X01d+ an anonymous call on a public app still reaches the echo (intended use)", securityTestDetails("SEC-X01d"), async ({ page, apiUser, newUserSession, echo }) => {
    const scene = await registryScene(page, apiUser, echo);
    await setPublicToAll(scene.a.request, scene.seeded.appId, true);
    const anonymous = (await newUserSession()).page.request;
    expect(recordOf(await echo.received(), echo, PROBE_PACKAGE), "before the call").toEqual([]);
    const answer = await registryCall(anonymous, scene, PROBE_PACKAGE);
    expect({ status: answer.status, body: answer.body }, "the anonymous call on the public app").toEqual({ status: STATUS_OK, body: ECHO_ANSWER_BODY });
    const records = recordOf(await echo.received(), echo, PROBE_PACKAGE);
    expect(records, "the echo received the anonymous call").toHaveLength(1);
    expect(records[0]?.headers.authorization, "the registry credential rides on it").toBe(`Bearer ${scene.token}`);
  });
});
