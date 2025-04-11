import { Workspace } from "../types/workspace.types";
import { ManagedOrg } from "../types/enterprise.types";


export interface MergedWorkspaceResult {
  merged: Workspace[];
  stats: {
    total: number;
    managed: number;
    unmanaged: number;
  };
}

export function getMergedWorkspaces(
  standard: Workspace[],
  managed: ManagedOrg[]
): MergedWorkspaceResult {
  const merged = standard.map((ws) => ({
    ...ws,
    managed: managed.some((m) => m.orgGid === ws.gid),
  }));

  const managedCount = merged.filter((ws) => ws.managed).length;

  return {
    merged,
    stats: {
      total: merged.length,
      managed: managedCount,
      unmanaged: merged.length - managedCount,
    },
  };
}
