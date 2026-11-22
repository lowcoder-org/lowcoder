import nock from "nock";
import slackPlugin from "./index";
import run from "./run";

/**
 * slack plugin. The webhook is posted through common/fetch (node-fetch), which nock intercepts, so the
 * real request building is checked: method, form encoding and the payload.
 */
const ORIGIN = "https://hooks.slack.test";
const PATH = "/services/T000/B000/XXXX";
const WEBHOOK_URL = `${ORIGIN}${PATH}`;
const STATUS_OK = 200;
const STATUS_SERVER_ERROR = 500;
const CHANNEL = "#general";
const MESSAGE = "hello & <world>";
const PROXY_ENV_KEYS = ["HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy", "NO_PROXY", "no_proxy"];
const CTX = { languages: ["en"] } as any;

const savedEnv: Record<string, string | undefined> = {};
beforeEach(() => {
  for (const k of PROXY_ENV_KEYS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
  nock.disableNetConnect();
});
afterEach(() => {
  for (const k of PROXY_ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  nock.cleanAll();
  nock.enableNetConnect();
});

const action = { actionName: "Query", channel: CHANNEL, message: MESSAGE } as any;
const dataSource = { webhookURL: WEBHOOK_URL } as any;

describe("run", () => {
  test("posts form-encoded payload={channel,text} to webhookURL and returns the response text", async () => {
    let contentType: string | undefined;
    let rawBody = "";
    const scope = nock(ORIGIN)
      .post(PATH, (body) => {
        rawBody = typeof body === "string" ? body : new URLSearchParams(body as Record<string, string>).toString();
        return true;
      })
      .reply(function () {
        contentType = this.req.headers["content-type"] as string;
        return [STATUS_OK, "ok"];
      });
    await expect(run(action, dataSource)).resolves.toBe("ok");
    expect(scope.isDone()).toBe(true);
    expect(String(contentType)).toMatch(/^application\/x-www-form-urlencoded/);
    const form = new URLSearchParams(rawBody);
    expect(JSON.parse(form.get("payload")!)).toEqual({ channel: CHANNEL, text: MESSAGE });
    expect([...form.keys()]).toEqual(["payload"]);
  });

  test("a non-2xx answer is returned as its body text, not thrown", async () => {
    nock(ORIGIN).post(PATH).reply(STATUS_SERVER_ERROR, "invalid_payload");
    await expect(run(action, dataSource)).resolves.toBe("invalid_payload");
  });

  test("a network failure is rejected", async () => {
    nock(ORIGIN).post(PATH).replyWithError("socket hang up");
    await expect(run(action, dataSource)).rejects.toThrow(/socket hang up/);
  });
});

describe("plugin object (index.ts)", () => {
  test("exposes its identity", () => {
    expect(slackPlugin.id).toBe("slack");
    expect(slackPlugin.category).toBe("Project Management");
  });

  test("run delegates to run.ts", async () => {
    nock(ORIGIN).post(PATH).reply(STATUS_OK, "ok");
    await expect(slackPlugin.run(action, dataSource, CTX)).resolves.toBe("ok");
  });

  test("run re-throws errors unchanged", async () => {
    nock(ORIGIN).post(PATH).replyWithError("boom");
    await expect(slackPlugin.run(action, dataSource, CTX)).rejects.toThrow(/boom/);
  });
});
