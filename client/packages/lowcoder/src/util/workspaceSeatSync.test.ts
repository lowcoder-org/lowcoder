import { act, renderHook } from "@testing-library/react";
import Api from "api/api";
import { useSeatSyncFailure, useWorkspaceSeatSync } from "./workspaceSeatSync";
import { notifyWorkspaceSeatsChanged } from "./workspaceSeatSyncEvents";

jest.mock("api/api", () => ({ __esModule: true, default: { post: jest.fn() } }));
const post = Api.post as jest.Mock;
const advance = async (ms: number) => {
  await act(async () => { jest.advanceTimersByTime(ms); });
};

beforeEach(() => {
  jest.useFakeTimers();
  post.mockResolvedValue({ status: 200, data: { success: true } });
});
afterEach(() => jest.useRealTimers());

test("successful membership edits automatically reconcile through the local API without sending a seat count", async () => {
  const { unmount } = renderHook(() => useWorkspaceSeatSync("workspace-a", true));
  await advance(500);
  expect(post).toHaveBeenLastCalledWith("/flow", {
    path: "webhook/secure/sync-workspace-seats", method: "post",
    data: { orgId: "workspace-a" }, headers: {},
  }, undefined, { timeout: 90000 });
  act(() => {
    notifyWorkspaceSeatsChanged({ data: { success: true } });
    notifyWorkspaceSeatsChanged({ data: { success: true } });
  });
  await advance(500);
  expect(post).toHaveBeenCalledTimes(2);
  act(() => { notifyWorkspaceSeatsChanged({ data: { success: false } }); });
  await advance(500);
  expect(post).toHaveBeenCalledTimes(2);
  unmount();
});

test("focus and reconnect trigger reconciliation, but an old workspace or disabled subscription does not", async () => {
  const { rerender, unmount } = renderHook(({ orgId, enabled }) => useWorkspaceSeatSync(orgId, enabled), {
    initialProps: { orgId: "workspace-a", enabled: false },
  });
  await advance(60000);
  expect(post).not.toHaveBeenCalled();
  rerender({ orgId: "workspace-a", enabled: true });
  await advance(500);
  act(() => { window.dispatchEvent(new Event("focus")); });
  await advance(500);
  act(() => { window.dispatchEvent(new Event("online")); });
  await advance(500);
  expect(post).toHaveBeenCalledTimes(3);
  rerender({ orgId: "workspace-b", enabled: true });
  await advance(500);
  expect(post.mock.calls[3][1].data).toEqual({ orgId: "workspace-b" });
  unmount();
  act(() => { window.dispatchEvent(new Event("focus")); });
  await advance(120000);
  expect(post).toHaveBeenCalledTimes(4);
});

test("an unconfirmed relay response shows a pending warning and retries until confirmed", async () => {
  post.mockResolvedValueOnce({ status: 200, data: { success: false } });
  const { result, unmount } = renderHook(() => {
    useWorkspaceSeatSync("workspace-a", true);
    return useSeatSyncFailure();
  });
  await advance(500);
  expect(result.current).toBe("workspace-a");
  await advance(5000);
  expect(post).toHaveBeenCalledTimes(2);
  expect(result.current).toBeNull();
  unmount();
});
