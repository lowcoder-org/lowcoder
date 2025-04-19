// services/workspacesService.ts (or wherever makes sense in your structure)
import { message } from "antd";
import { getEnvironmentWorkspaces } from "./environments.service";
import { getManagedWorkspaces } from "./enterprise.service";
import { Workspace } from "../types/workspace.types";
import { ManagedOrg } from "../types/enterprise.types";

export interface WorkspaceStats {
  total: number;
  managed: number;
  unmanaged: number;
}

export interface MergedWorkspacesResult {
  workspaces: Workspace[];
  stats: WorkspaceStats;
}

export async function getMergedEnvironmentWorkspaces(
  environmentId: string,
  apiKey: string, 
  apiServiceUrl: string
): Promise<MergedWorkspacesResult> {
  try {
    // First, get regular workspaces
    const regularWorkspaces = await getEnvironmentWorkspaces(
      environmentId,
      apiKey,
      apiServiceUrl
    );
    
    // If no workspaces, return early with empty result
    if (!regularWorkspaces.length) {
      return {
        workspaces: [],
        stats: {
          total: 0,
          managed: 0,
          unmanaged: 0
        }
      };
    }
    
    // Only fetch managed workspaces if we have regular workspaces
    let managedOrgs: ManagedOrg[] = [];
    try {
      managedOrgs = await getManagedWorkspaces(environmentId);
    } catch (error) {
      console.error("Failed to fetch managed workspaces:", error);
      // Continue with empty managed list
    }
    
    // Merge the workspaces
    const mergedWorkspaces = regularWorkspaces.map(ws => ({
      ...ws,
      managed: managedOrgs.some(org => org.orgGid === ws.gid)
    }));
    
    // Calculate stats
    const managedCount = mergedWorkspaces.filter(ws => ws.managed).length;
    
    return {
      workspaces: mergedWorkspaces,
      stats: {
        total: mergedWorkspaces.length,
        managed: managedCount,
        unmanaged: mergedWorkspaces.length - managedCount
      }
    };
  } catch (error) {
    const errorMessage = 
      error instanceof Error ? error.message : "Failed to fetch workspaces";
    message.error(errorMessage);
    throw error;
  }
}