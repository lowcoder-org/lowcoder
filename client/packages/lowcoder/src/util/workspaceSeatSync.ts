import { useEffect, useSyncExternalStore } from "react";
import Api from "api/api";
import { createSeatSyncScheduler } from "./seatSyncScheduler";
import { WORKSPACE_SEATS_CHANGED } from "./workspaceSeatSyncEvents";

let failedOrgId: string | null = null;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const snapshot = () => failedOrgId;

export const useSeatSyncFailure = () => useSyncExternalStore(subscribe, snapshot, snapshot);

export function useWorkspaceSeatSync(orgId: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !orgId) return;
    const scheduler = createSeatSyncScheduler(async () => {
      // Use this installation's API/session. The API calculates the count and authenticates to n8n.
      const result = await Api.post("/flow", {
        path: "webhook/secure/sync-workspace-seats", method: "post", data: { orgId }, headers: {},
      }, undefined, { timeout: 90000 });
      if (result?.status !== 200 || result?.data?.success !== true) throw new Error("Seat sync was not confirmed");
    }, failed => {
      failedOrgId = failed ? orgId : null;
      listeners.forEach(listener => listener());
    });
    window.addEventListener(WORKSPACE_SEATS_CHANGED, scheduler.request);
    window.addEventListener("focus", scheduler.request);
    window.addEventListener("online", scheduler.request);
    scheduler.request();
    return () => {
      scheduler.stop();
      window.removeEventListener(WORKSPACE_SEATS_CHANGED, scheduler.request);
      window.removeEventListener("focus", scheduler.request);
      window.removeEventListener("online", scheduler.request);
    };
  }, [orgId, enabled]);
}
