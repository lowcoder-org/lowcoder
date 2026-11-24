import { apiRaw, createApp, createModule, publishApp, setNpmRegistry, setPublicToAll, type RawAnswer } from "../../src/api/client";
import { API_ERRORS, API_OK, API_PATHS, APP_ROLES, appViewPath, npmRegistryPath } from "../../src/constants";
import { appDsl, moduleApp, moduleInstance, type DslItem } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { AppViewPage } from "../../src/pages/AppViewPage";
import { expectAnswer } from "../../src/security/assertions";
import type { EchoRecord, EchoTarget } from "../../src/security/echo";
import { recordsContain } from "../../src/security/echo";
import { securityTestDetails } from "../../src/security/quarantine";
import { memberOf, sceneOf, type Scene } from "../../src/security/scene";
import { grantApp } from "../../src/security/actors";

/**
 * Requests the SERVER makes inside the app container, proven at the HTTP echo sidecar (scripts/echo-server.js, `echo` fixture):
 * the npm registry proxy that forwards a registry call with the workspace's registry credential (SEC-X01; the n8n plugin's
 * scenarios SEC-X02 are in outbound-n8n.spec.ts). The tests are
 * defensive: the only request they cause leaves for the internal echo, and every denial is shown against a positive control
 * (the echo did receive the signed-in admin's call), so an empty echo cannot be a vacuous pass.
 * A (the `apiUser`, admin of OA) owns the private app and sets the registry; N is a browser context that never signed in.
 */

const STATUS_OK = 200;
/** The package the signed-in admin asks for (the positive control) and the one an actor under test asks for, so their records tell apart. */
const CONTROL_PACKAGE = "e2e-pkg";
const PROBE_PACKAGE = "e2e-pkg-probe";
/** The echo answers every request with an empty JSON object; the proxy hands it on. */
const ECHO_ANSWER_BODY = "{}";

/** SEC-X01e+: the package name of the npm component embedded in the module, and a second, distinct package for the
 * direct-module-call contrast (neither is a substring of the other, so their echo records cannot mix). */
const MODULE_PROBE_PACKAGE = "e2e-pkg-module-probe";
const DIRECT_PROBE_PACKAGE = "e2e-pkg-direct";
const PROBE_VERSION = "1.0.0";
const PROBE_COMP_NAME = "probe";
const NPM_PROBE_ITEM_ID = "npm1";
const NPM_PROBE_NAME = "npmProbe1";
const NPM_PROBE_SIZE = { w: 12, h: 6 };

/** The format of `getRemoteCompType` (client/src/comps/utils/remote.ts:5-12): `remote#npm#<package>@<version>#<name>`. */
function npmProbeCompType(packageName: string): string {
  return `remote#npm#${packageName}@${PROBE_VERSION}#${PROBE_COMP_NAME}`;
}

/**
 * A DSL item for an npm-remote component (`gridItemComp.tsx` turns any `remote#...` compType into a `remoteComp`,
 * whose loader starts on mount regardless of `comp`'s contents). Not built with `component(...)`: that starts from a
 * recording (`fixtures/dsl/<type>.json`), and no recording exists for a `remote#npm#...` type.
 */
function npmProbeItem(packageName: string): DslItem {
  return {
    id: NPM_PROBE_ITEM_ID,
    layout: { x: 0, y: 0, ...NPM_PROBE_SIZE },
    item: { compType: npmProbeCompType(packageName), name: NPM_PROBE_NAME, comp: {} },
  };
}

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
    expect.soft(forwarded, "nothing of the anonymous call reached the echo").toEqual([]);
    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the anonymous call on the private app");
  });

  test("SEC-X01c a signed-in outsider's call on a private app is refused before anything is forwarded", securityTestDetails("SEC-X01c"), async ({ page, apiUser, actor, echo }) => {
    const scene = await registryScene(page, apiUser, echo);
    await expectControlReachesEcho(scene, echo);
    const outsider = await actor("outsider");
    const answer = await registryCall(outsider.request, scene, PROBE_PACKAGE);
    // read the echo BEFORE asserting, so a failure reports both properties: the answer class and what was forwarded
    const forwarded = recordOf(await echo.received(), echo, PROBE_PACKAGE);
    expect.soft(forwarded, "nothing of the outsider's call reached the echo").toEqual([]);
    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the outsider's call on the private app");
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

  test(
    "SEC-X01e+ a viewer of the host app loads a module's npm component through the host app id",
    securityTestDetails("SEC-X01e"),
    async ({ page, apiUser, actor, echo }) => {
      const scene = await registryScene(page, apiUser, echo);

      const module = await createModule(scene.a.request, {
        orgId: scene.a.orgId,
        name: "e2e-sec-x01e-module",
        dsl: moduleApp({ items: [npmProbeItem(MODULE_PROBE_PACKAGE)] }),
      });
      await publishApp(scene.a.request, module.appId);
      const host = await createApp(scene.a.request, {
        orgId: scene.a.orgId,
        name: "e2e-sec-x01e-host",
        dsl: appDsl([moduleInstance({ id: "m1", name: "module1", moduleId: module.appId })]),
      });
      await publishApp(scene.a.request, host.appId);

      const b = await memberOf(scene.a, actor, "host-viewer");
      await grantApp(scene.a, host.appId, b, APP_ROLES.VIEWER);
      expectAnswer(
        await apiRaw(b.request, "GET", appViewPath(host.appId)),
        { status: STATUS_OK, code: API_OK },
        "precondition: B reads the host",
      );
      const moduleAnswer = await apiRaw(b.request, "GET", appViewPath(module.appId));
      expect(moduleAnswer.status, "precondition: B cannot read the module itself").not.toBe(STATUS_OK);

      const requestWait = b.session.page.waitForRequest(
        (request) => request.url().includes(API_PATHS.NPM_PACKAGE) && request.url().includes(`/${MODULE_PROBE_PACKAGE}@`),
      );
      const responseWait = b.session.page.waitForResponse(
        (response) => response.url().includes(API_PATHS.NPM_PACKAGE) && response.url().includes(`/${MODULE_PROBE_PACKAGE}@`),
      );
      await new AppViewPage(b.session.page).open(host.appId);
      const [request, response] = await Promise.all([requestWait, responseWait]);

      expect(new URL(request.url()).pathname, "the request path's app id segment is the HOST app id, not the module's").toContain(
        `${API_PATHS.NPM_PACKAGE}/${host.appId}/`,
      );
      expect(response.status(), "the response is not a permission denial").not.toBe(API_ERRORS.NOT_AUTHORIZED.status);
      const afterLoad = await echo.received();
      expect(recordsContain(afterLoad, MODULE_PROBE_PACKAGE), "the proxy forwarded this load to the echo").toBe(true);

      // Contrast: B's DIRECT call on the module (not through the host) is still refused.
      await expectControlReachesEcho(scene, echo);
      const directAnswer = await registryCall(b.request, { ...scene, seeded: { ...scene.seeded, appId: module.appId } }, DIRECT_PROBE_PACKAGE);
      const forwarded = recordOf(await echo.received(), echo, DIRECT_PROBE_PACKAGE);
      expect.soft(forwarded, "nothing of B's direct module call reached the echo").toEqual([]);
      expectAnswer(directAnswer, API_ERRORS.NOT_AUTHORIZED, "B's direct call on the module");
    },
  );
});
