import { expect, it, jest } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAdminPagination } from "./useAdminPagination";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

it("resets paging for filters, clearing filters, workspaces and page sizes", async () => {
  const loadPage = jest.fn<() => Promise<{ success: boolean; data: string[]; total: number }>>().mockResolvedValue({ success: true, data: ["app"], total: 80 });
  const { result, rerender } = renderHook(({ scope, filterKey }) => useAdminPagination({ scope, filterKey, loadPage }), {
    initialProps: { scope: "workspace-a", filterKey: "" },
  });
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.setCurrentPage(4));
  await waitFor(() => expect(loadPage).toHaveBeenLastCalledWith(4, 10));
  rerender({ scope: "workspace-a", filterKey: "invoices" });
  await waitFor(() => expect(loadPage).toHaveBeenLastCalledWith(1, 10));
  rerender({ scope: "workspace-a", filterKey: "" });
  expect(result.current.currentPage).toBe(1);
  act(() => result.current.setCurrentPage(3));
  rerender({ scope: "workspace-b", filterKey: "" });
  expect(result.current.currentPage).toBe(1);
  expect(result.current.elements).toEqual([]);
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.setCurrentPage(3));
  act(() => result.current.setPageSize(20));
  await waitFor(() => expect(loadPage).toHaveBeenLastCalledWith(1, 20));
});

it("ignores a slow response from a previous search or workspace", async () => {
  const oldRequest = deferred<{ success: boolean; data: string[]; total: number }>();
  const latestRequest = deferred<{ success: boolean; data: string[]; total: number }>();
  const loadOld = jest.fn(() => oldRequest.promise);
  const loadLatest = jest.fn(() => latestRequest.promise);
  const { result, rerender } = renderHook(({ scope, filterKey, loadPage }) => useAdminPagination({ scope, filterKey, loadPage }), {
    initialProps: { scope: "old", filterKey: "", loadPage: loadOld },
  });
  await waitFor(() => expect(loadOld).toHaveBeenCalled());
  rerender({ scope: "new", filterKey: "new", loadPage: loadLatest });
  await act(async () => latestRequest.resolve({ success: true, data: ["latest"], total: 1 }));
  await act(async () => oldRequest.resolve({ success: true, data: ["stale"], total: 50 }));
  expect(result.current.elements).toEqual(["latest"]);
  expect(result.current.total).toBe(1);
});

it("returns to the last valid page after deletion, preserving a real zero total", async () => {
  let total = 21;
  const loadPage = jest.fn(async () => ({ success: true, data: ["app"], total }));
  const { result } = renderHook(() => useAdminPagination({ scope: "workspace", filterKey: "", loadPage }));
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.setCurrentPage(3));
  await waitFor(() => expect(loadPage).toHaveBeenLastCalledWith(3, 10));
  total = 20;
  act(() => result.current.retry());
  await waitFor(() => expect(loadPage).toHaveBeenLastCalledWith(2, 10));
  total = 0;
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.currentPage).toBe(1));
  await waitFor(() => expect(result.current.total).toBe(0));
});

it("shows request failures and supports retry without treating them as empty lists", async () => {
  const loadPage = jest.fn<() => Promise<{ success: boolean; data: string[]; total: number }>>().mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue({ success: true, data: [], total: 0 });
  const { result } = renderHook(() => useAdminPagination({ scope: "workspace", filterKey: "", loadPage }));
  await waitFor(() => expect(result.current.error).toBe(true));
  expect(result.current.loading).toBe(false);
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.error).toBe(false));
  expect(result.current.total).toBe(0);
});

it("does not issue requests without a workspace", () => {
  const loadPage = jest.fn(async () => ({ success: true, data: [], total: 0 }));
  const { result } = renderHook(() => useAdminPagination({ scope: "", filterKey: "", loadPage }));
  expect(loadPage).not.toHaveBeenCalled();
  expect(result.current.loading).toBe(false);
});
