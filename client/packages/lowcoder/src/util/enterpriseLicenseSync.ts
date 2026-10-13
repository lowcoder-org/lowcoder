import { useEffect, useSyncExternalStore } from "react";
import { EnterpriseLicenseRequestError, EnterpriseLicenseStatus, getLicenseRequestStatus, synchronizeEnterpriseLicenses } from "api/licenseRequestApi";
import { isPublicLowcoderCloud } from "./enterpriseHosting";

const empty: EnterpriseLicenseStatus = { orders: [], licenses: [] };
let snapshot = { scope: "", data: empty, loading: false, error: "" };
const listeners = new Set<() => void>();
const publish = (value: typeof snapshot) => { snapshot = value; listeners.forEach(listener => listener()); };
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
let refresh: { scope: string; run: () => void } | undefined;
const openLibraries = new Set<string>();
export const refreshEnterpriseLicenses = () => refresh?.run();
export const useEnterpriseLicenseStatus = (scope: string) => {
  const state = useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
  useEffect(() => {
    // A deliberate visit discovers purchases even after an interrupted checkout or upgrade.
    // Remember the open view because child effects can run before the app's sync effect.
    openLibraries.add(scope);
    if (refresh?.scope === scope) refresh.run();
    return () => { openLibraries.delete(scope); };
  }, [scope]);
  return state.scope === scope ? state : { scope, data: empty, loading: false, error: "" };
};

const intervalMs = 60000;
const maxBackoffMs = 15 * 60000;
const hasPurchase = (data: EnterpriseLicenseStatus) => data.orders.length > 0 || data.licenses.length > 0;

/** Renewal deliberately depends on an active admin UI session, not a background server cron. */
export function useEnterpriseLicenseSync(orgId: string, userId: string, enabled: boolean) {
  useEffect(() => {
    const scope = `${orgId}:${userId}`;
    publish({ scope, data: empty, loading: false, error: "" });
    if (isPublicLowcoderCloud() || !enabled || !orgId || !userId) return;
    let stopped = false, busy = false, initialized = false, purchased = false, terminal = false;
    let failures = 0, nextAttempt = 0, discover = openLibraries.has(scope);
    let timer: number | undefined;
    const schedule = () => {
      window.clearTimeout(timer);
      if (!stopped && !terminal && (!initialized || purchased || discover)) {
        timer = window.setTimeout(wake, Math.max(intervalMs, nextAttempt - Date.now()));
      }
    };
    const run = async (force = false) => {
      if (stopped || busy) return;
      if (document.visibilityState === "hidden" || !navigator.onLine) { schedule(); return; }
      if (!force && (Date.now() < nextAttempt || terminal || (initialized && !purchased && !discover))) return;
      busy = true;
      publish({ ...snapshot, scope, loading: true });
      const lookup = !initialized || discover;
      const explicitDiscovery = discover;
      discover = false;
      try {
        if (lookup) {
          const data = await getLicenseRequestStatus(orgId, explicitDiscovery);
          if (stopped) return;
          initialized = true;
          purchased = hasPurchase(data);
          publish({ scope, data, loading: purchased, error: "" });
        }
        if (purchased) {
          const data = await synchronizeEnterpriseLicenses(orgId);
          if (stopped) return;
          purchased = hasPurchase(data);
          publish({ scope, data, loading: false, error: "" });
        }
        failures = 0;
        terminal = false;
        nextAttempt = Date.now() + intervalMs;
      } catch (error) {
        if (stopped) return;
        const failure = error instanceof EnterpriseLicenseRequestError ? error
          : new EnterpriseLicenseRequestError("Licenses could not be refreshed. We will retry automatically.");
        // Retry failed discovery as discovery, not as an unconfirmed sync.
        if (lookup) { initialized = false; discover = discover || explicitDiscovery; }
        terminal = !failure.retryable;
        failures += 1;
        nextAttempt = Date.now() + Math.max(failure.retryAfterMs,
          Math.min(maxBackoffMs, intervalMs * 2 ** Math.min(failures - 1, 4)));
        publish({ ...snapshot, scope, loading: false, error: failure.message });
      } finally {
        busy = false;
        schedule();
      }
    };
    const wake = () => { void run(); };
    const manual = () => {
      discover = true;
      terminal = false;
      void run(true);
    };
    const registration = { scope, run: manual };
    refresh = registration;
    wake();
    window.addEventListener("focus", wake);
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);
    return () => {
      stopped = true;
      if (refresh === registration) refresh = undefined;
      window.clearTimeout(timer);
      window.removeEventListener("focus", wake);
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [orgId, userId, enabled]);
}
