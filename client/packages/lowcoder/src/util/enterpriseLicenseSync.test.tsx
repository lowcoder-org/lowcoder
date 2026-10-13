import { act, renderHook } from "@testing-library/react";
import Api from "api/api";
import { getLicenseRequestStatus } from "api/licenseRequestApi";
import { refreshEnterpriseLicenses, useEnterpriseLicenseStatus, useEnterpriseLicenseSync } from "./enterpriseLicenseSync";

jest.mock("api/api", () => ({ __esModule: true, default: { post: jest.fn() } }));
const post = Api.post as jest.Mock;
const location = window.location;
const empty = { orders: [], licenses: [] };
const pending = { orders: [{ requestId: "purchase", status: "awaiting_payment" }], licenses: [] };
const issued = { orders: [{ requestId: "purchase", status: "active" }], licenses: [{ id: "file", notAfter: "2027-01-01" }] };
const response = (data: object) => ({ status: 200, data: { data: { success: true, ...data } } });
const flush = async () => { await act(async () => {}); };
const advance = async (ms: number) => { await act(async () => { jest.advanceTimersByTime(ms); }); };
const syncCalls = () => post.mock.calls.filter(([url]) => url.endsWith("/sync"));
const start = () => renderHook(() => useEnterpriseLicenseSync("org", "admin", true));

beforeEach(() => {
  jest.useFakeTimers();
  Object.defineProperty(window, "location", { configurable: true, value: { hostname: "localhost", origin: "http://localhost:8000" } });
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  post.mockResolvedValue(response(empty));
});
afterEach(() => {
  Object.defineProperty(window, "location", { configurable: true, value: location });
  jest.useRealTimers();
});

test("Community account makes one status request and never syncs on timers or wake events", async () => {
  start();
  await flush();
  await advance(3600000);
  await act(async () => {
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("online"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(post).toHaveBeenCalledTimes(1);
  expect(post.mock.calls[0][0]).toBe("/enterprise-licenses/status");
  expect(post.mock.calls[0][1].refresh).toBeUndefined();
  expect(syncCalls()).toHaveLength(0);
});

test("first checkout can activate before any installed license and continue renewing", async () => {
  post.mockResolvedValueOnce(response(pending)).mockResolvedValue(response(issued));
  start();
  await flush();
  expect(post.mock.calls.map(([url]) => url)).toEqual(["/enterprise-licenses/status", "/enterprise-licenses/sync"]);
  await advance(60000);
  expect(syncCalls()).toHaveLength(2);
});

test("returning purchasing admin discovers purchases without browser storage", async () => {
  post.mockResolvedValue(response(issued));
  const first = start();
  await flush();
  first.unmount();
  post.mockClear();
  start();
  await flush();
  expect(post.mock.calls.map(([url]) => url)).toEqual(["/enterprise-licenses/status", "/enterprise-licenses/sync"]);
});

test("opening the license library discovers purchases after an initially empty status", async () => {
  start();
  await flush();
  post.mockResolvedValueOnce(response(pending)).mockResolvedValue(response(issued));
  const library = renderHook(() => useEnterpriseLicenseStatus("org:admin"));
  await flush();
  expect(post.mock.calls[1][1]).toMatchObject({ orgId: "org", refresh: true });
  expect(syncCalls()).toHaveLength(1);
  expect(library.result.current.data).toMatchObject(issued);
});

test("library mounted before the app sync effect still requests discovery", async () => {
  renderHook(() => useEnterpriseLicenseStatus("org:admin"));
  start();
  await flush();
  expect(post.mock.calls[0][1]).toMatchObject({ refresh: true });
  expect(syncCalls()).toHaveLength(0);
});

test("failed status discovery retries with backoff and never issues an unconfirmed sync", async () => {
  post.mockRejectedValue(new Error("offline relay"));
  start();
  await flush();
  expect(post).toHaveBeenCalledTimes(1);
  for (const delay of [60000, 120000, 240000, 480000, 900000, 900000]) {
    const previous = post.mock.calls.length;
    await advance(delay - 1);
    await act(async () => { window.dispatchEvent(new Event("focus")); });
    expect(post).toHaveBeenCalledTimes(previous);
    await advance(1);
    expect(post).toHaveBeenCalledTimes(previous + 1);
  }
  expect(syncCalls()).toHaveLength(0);
});

test("failed renewal preserves downloads and success resets backoff", async () => {
  post.mockResolvedValue(response(issued));
  // Read-only observation here also exercises the initial explicit library lookup.
  const library = renderHook(() => useEnterpriseLicenseStatus("org:admin"));
  start();
  await flush();
  post.mockRejectedValue(new Error("offline relay"));
  await advance(60000);
  expect(library.result.current.data).toMatchObject(issued);
  expect(library.result.current.error).toMatch(/temporarily unavailable/);
  await advance(60000);
  const attempts = post.mock.calls.length;
  post.mockResolvedValue(response(issued));
  await advance(119999);
  expect(post).toHaveBeenCalledTimes(attempts);
  await advance(1);
  expect(library.result.current.error).toBe("");
  await advance(60000);
  expect(post).toHaveBeenCalledTimes(attempts + 2);
});

test("resolved HTTP errors respect Retry-After without turning an outage into empty status", async () => {
  post.mockResolvedValue({ status: 503, headers: { "retry-after": "300" }, data: { code: 503 } });
  start();
  await flush();
  await advance(299999);
  expect(post).toHaveBeenCalledTimes(1);
  await advance(1);
  expect(post).toHaveBeenCalledTimes(2);
  expect(syncCalls()).toHaveLength(0);
});

test("manual refresh can recover during backoff and discovers before syncing", async () => {
  post.mockRejectedValue(new Error("relay unavailable"));
  start();
  await flush();
  post.mockResolvedValueOnce(response(pending)).mockResolvedValue(response(issued));
  await act(async () => { refreshEnterpriseLicenses(); });
  expect(post.mock.calls[1][1]).toMatchObject({ refresh: true });
  expect(syncCalls()).toHaveLength(1);
});

test.each([400, 401, 403, 404])("HTTP %s stops automatic retries until a manual refresh or new session", async status => {
  post.mockResolvedValue({ status, data: { code: status } });
  start();
  await flush();
  await advance(3600000);
  await act(async () => { window.dispatchEvent(new Event("focus")); });
  expect(post).toHaveBeenCalledTimes(1);
  post.mockResolvedValue(response(empty));
  await act(async () => { refreshEnterpriseLicenses(); });
  expect(post).toHaveBeenCalledTimes(2);
});

test("malformed successful response is retryable and cannot silently stop renewal", async () => {
  post.mockResolvedValue(response({ orders: null, licenses: [] }));
  await expect(getLicenseRequestStatus("org")).rejects.toMatchObject({ retryable: true });
});

test("hidden and offline sessions wait until visible and online", async () => {
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
  start();
  await advance(60000);
  expect(post).not.toHaveBeenCalled();
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
  await act(async () => { document.dispatchEvent(new Event("visibilitychange")); });
  expect(post).not.toHaveBeenCalled();
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  await act(async () => { window.dispatchEvent(new Event("online")); });
  expect(post).toHaveBeenCalledTimes(1);
});

test("switching workspace ignores an old response and never syncs for the old scope", async () => {
  let resolve!: (value: unknown) => void;
  post.mockReturnValueOnce(new Promise(value => { resolve = value; })).mockResolvedValue(response(empty));
  const hook = renderHook(({ org }) => useEnterpriseLicenseSync(org, "admin", true), { initialProps: { org: "old" } });
  hook.rerender({ org: "new" });
  await flush();
  await act(async () => { resolve(response(pending)); });
  expect(syncCalls()).toHaveLength(0);
  expect(post.mock.calls.map(([, body]) => body.orgId)).toEqual(["old", "new"]);
});

test("disabled session never contacts the licensing API", async () => {
  renderHook(() => useEnterpriseLicenseSync("org", "admin", false));
  await flush();
  await advance(3600000);
  expect(post).not.toHaveBeenCalled();
});
