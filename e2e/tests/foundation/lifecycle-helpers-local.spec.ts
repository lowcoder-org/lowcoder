import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test } from "@playwright/test";
import { removeAuthConfigRaw } from "../../src/api/client";

/**
 * Stack-free test of `removeAuthConfigRaw` against a local server that records what it receives. It cannot be tested against
 * the stack with the e-mail configuration: `DELETE /api/auth/config/EMAIL` that succeeds ends the sessions of the workspace's
 * members, the instance super admin's included (README O-17), and every worker shares that one session.
 */

const SERVER_HOST = "127.0.0.1";
const CONFIG_PATH = "/api/auth/config";
const ANSWER_CODE = 5617;

let server: Server;
let baseURL: string;
const received: { method: string; url: string }[] = [];

test.beforeAll(async () => {
  server = createServer((request, response) => {
    received.push({ method: request.method ?? "", url: request.url ?? "" });
    response.writeHead(403, { "content-type": "application/json" }).end(JSON.stringify({ code: ANSWER_CODE, message: "no" }));
  });
  await new Promise<void>((resolve) => server.listen(0, SERVER_HOST, resolve));
  baseURL = `http://${SERVER_HOST}:${(server.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test.describe("removeAuthConfigRaw", () => {
  test("sends a DELETE to the configuration with delete=false or delete=true and returns the raw answer without a throw", async ({ playwright }) => {
    const request = await playwright.request.newContext({ baseURL });
    try {
      const disable = await removeAuthConfigRaw(request, "SOME-ID", { remove: false });
      const remove = await removeAuthConfigRaw(request, "SOME-ID", { remove: true });

      expect(received, "the two requests the helper sent").toEqual([
        { method: "DELETE", url: `${CONFIG_PATH}/SOME-ID?delete=false` },
        { method: "DELETE", url: `${CONFIG_PATH}/SOME-ID?delete=true` },
      ]);
      expect({ status: disable.status, code: disable.code }, "a refusal is an answer, not an error").toEqual({ status: 403, code: ANSWER_CODE });
      expect(remove.status).toBe(403);
    } finally {
      await request.dispose();
    }
  });
});
