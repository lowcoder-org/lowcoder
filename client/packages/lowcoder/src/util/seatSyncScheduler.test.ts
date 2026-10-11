import { createSeatSyncScheduler } from "./seatSyncScheduler";

const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test("coalesces membership edits and sends a fresh request for edits during a running sync", async () => {
  let resolve!: () => void;
  const sync = jest.fn().mockImplementationOnce(() => new Promise<void>(r => { resolve = r; })).mockResolvedValue(undefined);
  const scheduler = createSeatSyncScheduler(sync, jest.fn());
  scheduler.request(); scheduler.request(); scheduler.request();
  jest.advanceTimersByTime(500);
  expect(sync).toHaveBeenCalledTimes(1);
  scheduler.request(); scheduler.request();
  jest.advanceTimersByTime(5000);
  expect(sync).toHaveBeenCalledTimes(1);
  resolve(); await flush();
  jest.advanceTimersByTime(500); await flush();
  expect(sync).toHaveBeenCalledTimes(2);
  scheduler.stop();
});

test("retries failures and periodically reconciles without another membership edit", async () => {
  const sync = jest.fn().mockRejectedValueOnce(new Error("relay unavailable")).mockResolvedValue(undefined);
  const error = jest.fn();
  const scheduler = createSeatSyncScheduler(sync, error);
  scheduler.request(); jest.advanceTimersByTime(500); await flush();
  expect(error).toHaveBeenLastCalledWith(true);
  jest.advanceTimersByTime(5000); await flush();
  expect(error).toHaveBeenLastCalledWith(false);
  jest.advanceTimersByTime(60000); await flush();
  expect(sync).toHaveBeenCalledTimes(3);
  scheduler.stop();
});

test("workspace switch or logout stops retries and ignores late results", async () => {
  let resolve!: () => void;
  const error = jest.fn();
  const sync = jest.fn(() => new Promise<void>(r => { resolve = r; }));
  const scheduler = createSeatSyncScheduler(sync, error);
  scheduler.request(); jest.advanceTimersByTime(500);
  scheduler.stop(); resolve(); await flush();
  jest.advanceTimersByTime(180000);
  expect(sync).toHaveBeenCalledTimes(1);
  expect(error).not.toHaveBeenCalled();
});
