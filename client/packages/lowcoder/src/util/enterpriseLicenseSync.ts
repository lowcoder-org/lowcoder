import { useEffect, useSyncExternalStore } from "react";
import { EnterpriseLicenseStatus, synchronizeEnterpriseLicenses } from "api/licenseRequestApi";

const empty: EnterpriseLicenseStatus = { orders: [], licenses: [] };
let snapshot = { scope: "", data: empty, loading: false, error: false };
const listeners = new Set<() => void>();
const publish = (value: typeof snapshot) => { snapshot = value; listeners.forEach(listener => listener()); };
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
let refresh: (() => void) | undefined;
export const refreshEnterpriseLicenses = () => refresh?.();
export const useEnterpriseLicenseStatus = (scope: string) => {
  const state = useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
  return state.scope === scope ? state : { scope, data: empty, loading: false, error: false };
};

/** Renewal deliberately depends on an active admin UI session, not a background server cron. */
export function useEnterpriseLicenseSync(orgId: string, userId: string, enabled: boolean) {
  useEffect(() => {
    const scope = `${orgId}:${userId}`;
    publish({ scope, data: empty, loading: false, error: false });
    if (!enabled || !orgId || !userId) return;
    let stopped = false, busy = false, lastAttempt = 0;
    const run = async (force = false) => {
      if (stopped || busy || document.visibilityState === "hidden" || (!force && Date.now() - lastAttempt < 60000)) return;
      busy = true;
      lastAttempt = Date.now();
      publish({ ...snapshot, scope, loading: true });
      try {
        const data = await synchronizeEnterpriseLicenses(orgId);
        if (!stopped) publish({ scope, data, loading: false, error: false });
      } catch {
        if (!stopped) publish({ ...snapshot, scope, loading: false, error: true });
      } finally { busy = false; }
    };
    const wake = () => { void run(); };
    const manual = () => { void run(true); };
    refresh = manual;
    wake();
    const timer = window.setInterval(wake, 60000);
    window.addEventListener("focus", wake);
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);
    return () => {
      stopped = true;
      if (refresh === manual) refresh = undefined;
      window.clearInterval(timer);
      window.removeEventListener("focus", wake);
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [orgId, userId, enabled]);
}
