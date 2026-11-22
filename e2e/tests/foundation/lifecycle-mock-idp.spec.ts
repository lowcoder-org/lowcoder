import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test } from "@playwright/test";
import {
  MOCK_ACCESS_TOKEN,
  MOCK_CLIENT_ID,
  MOCK_CODE,
  MOCK_IDP_PATHS,
  answerToken,
  answerTokenError,
  answerUser,
  genericProviderConfig,
  providerLogin,
} from "../../src/lifecycle/mock-idp";

/** Stack-free tests of the mock provider helpers: the configuration body, the canned answers they set and the sign-in call they send. */

const SERVER_HOST = "127.0.0.1";
const ECHO_URL = "http://e2e-echo:8080/t/0-0-0-abc";

let server: Server;
let baseURL: string;
const received: { method: string; url: string }[] = [];

test.beforeAll(async () => {
  server = createServer((request, response) => {
    received.push({ method: request.method ?? "", url: request.url ?? "" });
    response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ code: 1, data: true }));
  });
  await new Promise<void>((resolve) => server.listen(0, SERVER_HOST, resolve));
  baseURL = `http://${SERVER_HOST}:${(server.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test.describe("mock provider helpers", () => {
  test("genericProviderConfig puts the three endpoints on the echo target, maps the claims and carries an id only for an update", () => {
    const created = genericProviderConfig({ url: ECHO_URL }, { enableRegister: true });
    const updated = genericProviderConfig({ url: ECHO_URL }, { enableRegister: false, id: "cfg-1" });

    expect(created).toMatchObject({
      authType: "GENERIC",
      clientId: MOCK_CLIENT_ID,
      enable: true,
      enableRegister: true,
      issuerUri: ECHO_URL,
      authorizationEndpoint: `${ECHO_URL}${MOCK_IDP_PATHS.AUTHORIZE}`,
      tokenEndpoint: `${ECHO_URL}${MOCK_IDP_PATHS.TOKEN}`,
      userInfoEndpoint: `${ECHO_URL}${MOCK_IDP_PATHS.USER_INFO}`,
      userInfoIntrospection: true,
      sourceMappings: { uid: "sub", email: "email", username: "name" },
    });
    expect(created, "a new configuration has no id").not.toHaveProperty("id");
    expect({ id: updated.id, enableRegister: updated.enableRegister }, "an update names the configuration").toEqual({ id: "cfg-1", enableRegister: false });
  });

  test("the answer helpers set the token, the token error and the user on the right sub-path", async () => {
    const set: { subPath: string; status: number; body: unknown }[] = [];
    const echo = { answer: async (subPath: string, canned: { status: number; body: string }) => void set.push({ subPath, status: canned.status, body: JSON.parse(canned.body) }) };

    await answerToken(echo);
    await answerTokenError(echo);
    await answerUser(echo, { sub: "s", email: "a@b.test", name: "N" });

    expect(set).toEqual([
      { subPath: MOCK_IDP_PATHS.TOKEN, status: 200, body: { access_token: MOCK_ACCESS_TOKEN, token_type: "Bearer" } },
      { subPath: MOCK_IDP_PATHS.TOKEN, status: 200, body: { error: "invalid_grant" } },
      { subPath: MOCK_IDP_PATHS.USER_INFO, status: 200, body: { sub: "s", email: "a@b.test", name: "N" } },
    ]);
  });

  test("providerLogin posts the client's call with the five parameters and the made-up code, and returns the raw answer", async ({ playwright }) => {
    const request = await playwright.request.newContext({ baseURL });
    try {
      const answer = await providerLogin(request, { provider: { authId: "cfg-1", source: "GENERIC" }, orgId: "org-1", baseURL: "http://app.test:3000" });

      const url = new URL(received.at(-1)!.url, "http://local.invalid");
      expect(received.at(-1)!.method).toBe("POST");
      expect(url.pathname).toBe("/api/auth/tp/login");
      expect(Object.fromEntries(url.searchParams)).toEqual({
        authId: "cfg-1",
        source: "GENERIC",
        code: MOCK_CODE,
        redirectUrl: "http://app.test:3000/user/auth/oauth/redirect",
        orgId: "org-1",
      });
      expect({ status: answer.status, code: answer.code }).toEqual({ status: 200, code: 1 });
    } finally {
      await request.dispose();
    }
  });
});
