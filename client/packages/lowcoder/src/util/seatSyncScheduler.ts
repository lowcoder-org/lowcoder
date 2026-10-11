// One in-flight request per client. Changes arriving during a request get a fresh follow-up.
export function createSeatSyncScheduler(sync: () => Promise<void>, onError: (failed: boolean) => void) {
  let stopped = false;
  let running = false;
  let dirty = false;
  let failures = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = (delay: number) => {
    clearTimeout(timer);
    if (!stopped) timer = setTimeout(run, delay);
  };
  const run = async () => {
    if (stopped || running) return;
    running = true;
    dirty = false;
    try {
      await sync();
      failures = 0;
      if (!stopped) onError(false);
    } catch {
      failures++;
      if (!stopped) onError(true);
    } finally {
      running = false;
      if (!stopped) schedule(failures ? Math.min(5000 * 2 ** Math.min(failures - 1, 4), 60000) : dirty ? 500 : 60000);
    }
  };
  return {
    request() {
      dirty = true;
      if (!running) schedule(500);
    },
    stop() {
      stopped = true;
      clearTimeout(timer);
    },
  };
}
