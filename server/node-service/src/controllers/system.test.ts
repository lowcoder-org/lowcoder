import { collectDefaultMetrics, register } from "prom-client";
import { prometheus, status } from "./system";

const KNOWN_DEFAULT_METRIC = "process_cpu_user_seconds_total";

function makeRes() {
  const res: { sent?: any; body?: any; send: jest.Mock; json: jest.Mock } = {
    send: jest.fn((b: any) => {
      res.sent = b;
      return res;
    }),
    json: jest.fn((b: any) => {
      res.body = b;
      return res;
    }),
  };
  return res;
}

afterAll(() => {
  // default metrics are registered globally; leave no registration behind for other suites
  register.clear();
});

describe("prometheus", () => {
  test("sends the text exposition containing a default metric once collectDefaultMetrics has run", async () => {
    collectDefaultMetrics();
    const res = makeRes();

    await prometheus({} as any, res as any);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(typeof res.sent).toBe("string");
    expect(res.sent).toContain(`# TYPE ${KNOWN_DEFAULT_METRIC} counter`);
    expect(res.sent).toMatch(new RegExp(`^${KNOWN_DEFAULT_METRIC} \\d`, "m"));
  });

  test("sends an empty exposition when no metric is registered", async () => {
    register.clear();
    const res = makeRes();

    await prometheus({} as any, res as any);

    expect(res.sent).not.toContain(KNOWN_DEFAULT_METRIC);
  });
});

describe("status", () => {
  test("returns {ok: true}", async () => {
    const res = makeRes();

    await status({} as any, res as any);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.body).toEqual({ ok: true });
  });
});
