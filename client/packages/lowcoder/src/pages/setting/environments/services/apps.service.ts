// services/appService.ts
import { message } from "antd";
import { getWorkspaceApps } from "./environments.service";
import { getManagedApps } from "./enterprise.service";
import { App } from "../types/app.types";
import axios from "axios";

export interface AppStats {
  total: number;
  published: number;
  managed: number;
  unmanaged: number;
}

export interface MergedAppsResult {
  apps: App[];
  stats: AppStats;
}


export interface DeployAppParams {
  envId: string;
  targetEnvId: string;
  applicationId: string;
  updateDependenciesIfNeeded?: boolean;
  publishOnTarget?: boolean;
  publicToAll?: boolean;
  publicToMarketplace?: boolean;
}


// Use your existing merge function with slight modification
export const getMergedApps = (standardApps: App[], managedApps: any[]): App[] => {
  return standardApps.map((app) => ({
    ...app,
    managed: managedApps.some((managedApp) => managedApp.appGid === app.applicationGid),
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
    
    // Only fetch managed apps if we have regular apps
    let managedApps = [];
    try {
      managedApps = await getManagedApps(environmentId);
    } catch (error) {
      console.error("Failed to fetch managed apps:", error);
      // Continue with empty managed list
    }
    
    // Use your existing merge function
    const mergedApps = getMergedApps(regularApps, managedApps);
    
    // Calculate stats
    const stats = calculateAppStats(mergedApps);
    
    return {
      apps: mergedApps,
      stats
    };
  } catch (error) {
    const errorMessage = 
      error instanceof Error ? error.message : "Failed to fetch apps";
    message.error(errorMessage);
    throw error;
  }
}



export const deployApp = async (params: DeployAppParams): Promise<boolean> => {
  try {
    const response = await axios.post(
      `/api/plugins/enterprise/deploy`, 
      null, 
      { 
        params: {
          envId: params.envId,
          targetEnvId: params.targetEnvId,
          applicationId: params.applicationId,
          updateDependenciesIfNeeded: params.updateDependenciesIfNeeded ?? false,
          publishOnTarget: params.publishOnTarget ?? false,
          publicToAll: params.publicToAll ?? false,
          publicToMarketplace: params.publicToMarketplace ?? false
        }
      }
    );
    
    return response.status === 200;
  } catch (error) {
    console.error('Error deploying app:', error);
    throw error;
  }
};