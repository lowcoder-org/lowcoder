import http from "http";
import { AddressInfo } from "net";
import nock from "nock";
import { fetch } from "./fetch";

const HOST = "http://upstream.test";
const PATH = "/items";
const STATUS_OK = 200;
const STATUS_CREATED = 201;
const STATUS_NOT_FOUND = 404;
const UNREACHABLE_ORIGIN = "http://upstream.invalid:81";
const PROXY_ENV_KEYS = ["HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy", "NO_PROXY", "no_proxy", "npm_config_http_proxy", "npm_config_proxy"];

const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of PROXY_ENV_KEYS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of PROXY_ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  nock.cleanAll();
});

describe("fetch through nock", () => {
  test("forwards method, headers and body and returns the response", async () => {
    const scope = nock(HOST, { reqheaders: { "x-trace": "abc", "content-type": "application/json" } })
      .post(PATH, { name: "n" })
      .reply(STATUS_CREATED, { id: 7 }, { "x-reply": "yes" });

    const res = await fetch(`${HOST}${PATH}`, {
      method: "POST",
      headers: { "x-trace": "abc", "content-type": "application/json" },
      body: JSON.stringify({ name: "n" }),
    });

    expect(res.status).toBe(STATUS_CREATED);
    expect(res.headers.get("x-reply")).toBe("yes");
    expect(await res.json()).toEqual({ id: 7 });
    expect(scope.isDone()).toBe(true);
  });

  test("defaults to GET with no init", async () => {
    const scope = nock(HOST).get(PATH).reply(STATUS_OK, "plain body");
    const res = await fetch(`${HOST}${PATH}`);
    expect(res.status).toBe(STATUS_OK);
    expect(await res.text()).toBe("plain body");
    expect(scope.isDone()).toBe(true);
  });

  test("a non-2xx response is returned, not thrown", async () => {
    nock(HOST).get(PATH).reply(STATUS_NOT_FOUND, "nope");
    const res = await fetch(`${HOST}${PATH}`);
    expect(res.ok).toBe(false);
    expect(res.status).toBe(STATUS_NOT_FOUND);
  });

  test("a connection error rejects", async () => {
    nock(HOST).get(PATH).replyWithError({ code: "ECONNRESET", message: "socket hang up" });
    await expect(fetch(`${HOST}${PATH}`)).rejects.toThrow("socket hang up");
  });
});

describe("agent wiring (no nock: a local forward proxy)", () => {
  let proxy: http.Server;
  let seen: { method?: string; url?: string; host?: string }[];

  beforeEach(async () => {
    seen = [];
    proxy = http.createServer((req, res) => {
      seen.push({ method: req.method, url: req.url, host: req.headers.host });
      res.writeHead(STATUS_OK, { "content-type": "text/plain" });
      res.end("via-proxy");
    });
    await new Promise<void>((resolve) => proxy.listen(0, "127.0.0.1", resolve));
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => proxy.close(() => resolve()));
  });

  test("HTTP_PROXY routes the request through the proxy, which sees the absolute-URI request line", async () => {
    const { port } = proxy.address() as AddressInfo;
    process.env.HTTP_PROXY = `http://127.0.0.1:${port}`;

    const res = await fetch(`${UNREACHABLE_ORIGIN}/proxied?x=1`);

    expect(res.status).toBe(STATUS_OK);
    expect(await res.text()).toBe("via-proxy");
    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe("GET");
    expect(seen[0].url).toBe(`${UNREACHABLE_ORIGIN}/proxied?x=1`);
  });
});
