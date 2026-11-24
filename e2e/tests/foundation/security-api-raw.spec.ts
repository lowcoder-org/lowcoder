import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test as base, type APIRequestContext } from "@playwright/test";
import { apiRaw, executeAppQueryRaw } from "../../src/api/client";
import { API_PATHS } from "../../src/constants";

/** Paths of the local server that stands in for the app: no stack is needed to test how `apiRaw` reads an answer. */
const PATHS = {
  DENIAL: "/denial",
  EMPTY_401: "/empty-401",
  HTML: "/html",
  NO_CODE: "/no-code",
  STRING_CODE: "/string-code",
  ECHO: "/echo",
  HEADERS: "/headers",
} as const;
const DENIAL_STATUS = 403;
const DENIAL_CODE = 5308;
const SERVER_HOST = "127.0.0.1";

/** What the echo route reports about the request it received. */
interface Echo {
  method: string;
  url: string;
  contentType: string | undefined;
  probeHeader: string | undefined;
  body: string;
}
const PROBE_HEADER = "x-e2e-probe";

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function startServer(): Promise<{ server: Server; baseURL: string }> {
  const server = createServer(async (request, response) => {
    switch (request.url?.split("?")[0]) {
      case PATHS.DENIAL:
        response.writeHead(DENIAL_STATUS, { "content-type": "application/json" }).end(JSON.stringify({ code: DENIAL_CODE, message: "no" }));
        return;
      case PATHS.EMPTY_401:
        response.writeHead(401).end();
        return;
      case PATHS.HTML:
        response.writeHead(200, { "content-type": "text/html" }).end("<p>not json</p>");
        return;
      case PATHS.NO_CODE:
        response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ data: 1 }));
        return;
      case PATHS.STRING_CODE:
        response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ code: "1" }));
        return;
      case PATHS.HEADERS:
        response.writeHead(200, { "x-e2e-single": "one", "set-cookie": ["a=1; HttpOnly", "b=2"] }).end();
        return;
      case API_PATHS.QUERY_EXECUTE: {
        const echo: Echo = {
          method: request.method ?? "",
          url: request.url ?? "",
          contentType: request.headers["content-type"],
          probeHeader: request.headers[PROBE_HEADER] as string | undefined,
          body: await readBody(request),
        };
        response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ code: 1, data: echo }));
        return;
      }
      case PATHS.ECHO: {
        const echo: Echo = {
          method: request.method ?? "",
          url: request.url ?? "",
          contentType: request.headers["content-type"],
          probeHeader: request.headers[PROBE_HEADER] as string | undefined,
          body: await readBody(request),
        };
        response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ code: 1, data: echo }));
        return;
      }
      default:
        response.writeHead(404).end();
    }
  });
  return new Promise((resolve) => {
    server.listen(0, SERVER_HOST, () => {
      resolve({ server, baseURL: `http://${SERVER_HOST}:${(server.address() as AddressInfo).port}` });
    });
  });
}

/**
 * Worker-scoped fixture that owns the local server and the request context aimed at it (a helper
 * creates no context; a fixture owns it and disposes it whether the tests pass or fail). Stack-free on purpose, so
 * this spec imports `test` from `@playwright/test`: it opens no browser page, like `builders.spec.ts` and
 * `run-selection.spec.ts`.
 */
const test = base.extend<object, { localApi: APIRequestContext }>({
  localApi: [
    async ({ playwright }, use) => {
      const started = await startServer();
      const context = await playwright.request.newContext({ baseURL: started.baseURL });
      try {
        await use(context);
      } finally {
        await context.dispose();
        await new Promise<void>((resolve) => started.server.close(() => resolve()));
      }
    },
    { scope: "worker" },
  ],
});

test.describe("apiRaw", () => {
  test("a JSON denial answers its status, its code and the parsed body", async ({ localApi: context }) => {
    const answer = await apiRaw(context, "GET", PATHS.DENIAL);

    expect(answer.status).toBe(DENIAL_STATUS);
    expect(answer.code).toBe(DENIAL_CODE);
    expect(answer.json).toEqual({ code: DENIAL_CODE, message: "no" });
    expect(answer.body).toBe(JSON.stringify({ code: DENIAL_CODE, message: "no" }));
  });

  test("an answer without a body has an empty body and no code, and does not throw on 401", async ({ localApi: context }) => {
    const answer = await apiRaw(context, "GET", PATHS.EMPTY_401);

    expect(answer).toMatchObject({ status: 401, code: undefined, body: "", json: undefined });
  });

  test("a body that is not JSON has no code and no parsed body", async ({ localApi: context }) => {
    const answer = await apiRaw(context, "GET", PATHS.HTML);

    expect(answer.status).toBe(200);
    expect(answer.code).toBeUndefined();
    expect(answer.json).toBeUndefined();
    expect(answer.body).toBe("<p>not json</p>");
  });

  test("JSON without a numeric code has no code: a string code is not taken for one", async ({ localApi: context }) => {
    expect((await apiRaw(context, "GET", PATHS.NO_CODE)).code, "no code key").toBeUndefined();
    expect((await apiRaw(context, "GET", PATHS.STRING_CODE)).code, "a string code").toBeUndefined();
  });

  test("method, params, headers and a JSON body reach the server as given", async ({ localApi: context }) => {
    const answer = await apiRaw(context, "PUT", PATHS.ECHO, {
      data: { a: 1 },
      params: { userId: "u 1", flag: true },
      headers: { [PROBE_HEADER]: "probe-value" },
    });

    const echo = (answer.json as { data: Echo }).data;
    expect(answer.code).toBe(1);
    expect(echo.method).toBe("PUT");
    expect(new URL(echo.url, "http://x").searchParams.get("userId"), "the query parameter").toBe("u 1");
    expect(new URL(echo.url, "http://x").searchParams.get("flag")).toBe("true");
    expect(echo.probeHeader).toBe("probe-value");
    expect(echo.contentType).toMatch(/application\/json/);
    expect(JSON.parse(echo.body)).toEqual({ a: 1 });
  });

  test("the response headers are returned in lower case, a repeated header joined with a newline", async ({ localApi: context }) => {
    const answer = await apiRaw(context, "GET", PATHS.HEADERS);

    expect(answer.headers["x-e2e-single"], "a single header").toBe("one");
    expect(answer.headers["set-cookie"]?.split("\n"), "a repeated header").toEqual(["a=1; HttpOnly", "b=2"]);
  });

  test("a string body is sent as it is", async ({ localApi: context }) => {
    const answer = await apiRaw(context, "PUT", PATHS.ECHO, { data: "new-slug" });

    expect((answer.json as { data: Echo }).data.body).toBe("new-slug");
  });

  test("executeAppQueryRaw sends the path when given and no path otherwise", async ({ localApi: context }) => {
    const withPath = await executeAppQueryRaw(context, { applicationId: "app-1", queryId: "q1", viewMode: false, path: ["h1"] });
    const withPathBody = JSON.parse((withPath.json as { data: Echo }).data.body);
    expect(withPathBody.path).toEqual(["h1"]);

    const withoutPath = await executeAppQueryRaw(context, { applicationId: "app-1", queryId: "q1", viewMode: false });
    const withoutPathBody = JSON.parse((withoutPath.json as { data: Echo }).data.body);
    expect(withoutPathBody).not.toHaveProperty("path");
  });
});
