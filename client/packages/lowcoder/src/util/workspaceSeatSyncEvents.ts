export const WORKSPACE_SEATS_CHANGED = "lowcoder-workspace-seats-changed";

export function notifyWorkspaceSeatsChanged<T extends { data: { success: boolean } }>(response: T): T {
  if (response.data?.success) window.dispatchEvent(new Event(WORKSPACE_SEATS_CHANGED));
  return response;
}
