// services/workspacesService.ts (or wherever makes sense in your structure)
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { trans } from "i18n";
import { getEnvironmentWorkspaces } from "./environments.service";
import { getManagedObjects, ManagedObject, ManagedObjectType, transferManagedObject } from "./managed-objects.service";
import { Workspace } from "../types/workspace.types";
import { ManagedOrg } from "../types/enterprise.types";
import axios from "axios";

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
    let managedObjects: ManagedObject[] = [];
    try {
      managedObjects = await getManagedObjects(environmentId, ManagedObjectType.ORG);
    } catch (error) {
      console.error("Failed to fetch managed workspaces:", error);
      // Continue with empty managed list
    }
    
    // Merge the workspaces
    const mergedWorkspaces = regularWorkspaces.map(ws => ({
      ...ws,
      managed: managedObjects.some(obj => obj.objGid === ws.gid && obj.objType === ManagedObjectType.ORG)
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
    const errorMessage = error instanceof Error ? error.message : trans("environments.services_workspace_failedToFetchWorkspaces");
    messageInstance.error(errorMessage);
    throw error;
  }
}

/**
 * Deploy a workspace to another environment
 * @param params Deployment parameters
 * @returns Promise with boolean indicating success
 */
export async function deployWorkspace(params: {
  envId: string;
  targetEnvId: string;
  workspaceId: string;
}): Promise<boolean> {
  try {
    // Use the new endpoint format with only essential parameters
    const response = await axios.post('/api/plugins/enterprise/org/deploy', null, {
      params: {
        orgGid: params.workspaceId, // Using workspaceId as orgGid
        envId: params.envId,
        targetEnvId: params.targetEnvId,
      }
    });

    // After successful deployment, set the managed object in target environment
    if (response.status === 200) {
      await transferManagedObject(
        params.workspaceId, // first param has to be GID
        params.envId,
        params.targetEnvId,
        ManagedObjectType.ORG
      );
    }

    return response.status === 200;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : trans("environments.services_workspace_failedToDeployWorkspace");
    // Don't show message directly, let the calling component handle it
    throw new Error(errorMessage);
  }
}