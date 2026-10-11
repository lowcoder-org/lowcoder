// services/appService.ts
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { trans } from "i18n";
import { getWorkspaceApps } from "./environments.service";
import { getManagedApps } from "./enterprise.service";
import { App, AppStats } from "../types/app.types";
import axios from "axios";
import { getManagedObjects, ManagedObject } from "./managed-objects.service";
import { ManagedObjectType, transferManagedObject } from "./managed-objects.service";


export interface MergedAppsResult {
  apps: App[];
  stats: AppStats;
}


export interface DeployAppParams {
  envId: string;
  targetEnvId: string;
  applicationId: string;
  applicationGid: string;
  updateDependenciesIfNeeded?: boolean;
  publishOnTarget?: boolean;
  publicToAll?: boolean;
  publicToMarketplace?: boolean;
  deployCredential: boolean;
}


// Use your existing merge function with slight modification
export const getMergedApps = (standardApps: App[], managedObjects: ManagedObject[]): App[] => {
  return standardApps.map((app) => ({
    ...app,
    managed: managedObjects.some((managedObj) => 
      managedObj.objGid === app.applicationGid && 
      managedObj.objType === "APP"
    ),
  }));
};

// Calculate app statistics
export const calculateAppStats = (apps: App[]): AppStats => {
  const publishedCount = apps.filter(app => app.published).length;
  const managedCount = apps.filter(app => app.managed).length;
  
  return {
    total: apps.length,
    published: publishedCount,
    managed: managedCount,
    unmanaged: apps.length - managedCount
  };
};

export async function getMergedWorkspaceApps(
  workspaceId: string,
  environmentId: string,
  apiKey: string,
  apiServiceUrl: string
): Promise<MergedAppsResult> {
  try {
    // First, get regular apps for the workspace
    const regularApps = await getWorkspaceApps(
      workspaceId,
      apiKey,
      apiServiceUrl
    );
    
    // If no apps, return early with empty result
    if (!regularApps.length) {
      return {
        apps: [],
        stats: {
          total: 0,
          published: 0,
          managed: 0,
          unmanaged: 0
        }
      };
    }
    
    // Fetch managed objects instead of managed apps
    let managedObjects: ManagedObject[] = [];
    try {
      managedObjects = await getManagedObjects(environmentId, ManagedObjectType.APP);
    } catch (error) {
      console.error("Failed to fetch managed objects:", error);
      // Continue with empty managed list
    }
    
    // Use the updated merge function
    const mergedApps = getMergedApps(regularApps, managedObjects);
    
    // Calculate stats
    const stats = calculateAppStats(mergedApps);
    
    return {
      apps: mergedApps,
      stats
    };
  } catch (error) {
    const errorMessage = 
      error instanceof Error ? error.message : trans("environments.services_apps_failedToFetchApps");
    messageInstance.error(errorMessage);
    throw error;
  }
}



export const deployApp = async (params: DeployAppParams): Promise<boolean> => {
  try {
    const response = await axios.post(
      `/api/plugins/enterprise/app/deploy`, 
      null, 
      { 
        params: {
          applicationId: params.applicationId,
          envId: params.envId,
          targetEnvId: params.targetEnvId,
          updateDependenciesIfNeeded: params.updateDependenciesIfNeeded ?? false,
          publishOnTarget: params.publishOnTarget ?? false,
          publicToAll: params.publicToAll ?? false,
          publicToMarketplace: params.publicToMarketplace ?? false,
          deployCredential: params.deployCredential
        }
      }
    );
    
    if (response.status === 200) {
      await transferManagedObject(
        params.applicationGid,
        params.envId,
        params.targetEnvId,
        ManagedObjectType.APP
      );
    }
    
    return response.status === 200;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : trans("environments.services_apps_failedToDeployApp");
    // Don't show message directly, let the calling component handle it
    throw new Error(errorMessage);
  }
};