// services/dataSources.service.ts
// Create this new file

import axios from 'axios';
import { message } from "antd";
import { DataSource } from "../types/datasource.types";
import { getManagedDataSources } from './enterprise.service';

export interface DataSourceStats {
  total: number;
  types: number;
  managed: number;
  unmanaged: number;
}

export interface MergedDataSourcesResult {
  dataSources: DataSource[];
  stats: DataSourceStats;
}

// Get data sources for a workspace
export const getWorkspaceDataSources = async (
  workspaceId: string,
  apiKey: string,
  apiServiceUrl: string
): Promise<DataSource[]> => {
  try {
    const response = await axios.get(
      `${apiServiceUrl}/api/workspace/${workspaceId}/datasources`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    return response.data || [];
  } catch (error) {
    console.error("Error fetching workspace data sources:", error);
    throw error;
  }
};

// Function to merge regular and managed data sources
export const getMergedDataSources = (standardDataSources: DataSource[], managedDataSources: any[]): DataSource[] => {
  return standardDataSources.map((dataSource) => ({
    ...dataSource,
    managed: managedDataSources.some((managedDs) => managedDs.datasourceGid === dataSource.gid),
  }));
};

// Calculate data source statistics
export const calculateDataSourceStats = (dataSources: DataSource[]): DataSourceStats => {
  const uniqueTypes = new Set(dataSources.map(ds => ds.type)).size;
  const managedCount = dataSources.filter(ds => ds.managed).length;
  
  return {
    total: dataSources.length,
    types: uniqueTypes,
    managed: managedCount,
    unmanaged: dataSources.length - managedCount
  };
};

// Get and merge data sources from a workspace
export async function getMergedWorkspaceDataSources(
  workspaceId: string,
  environmentId: string,
  apiKey: string,
  apiServiceUrl: string
): Promise<MergedDataSourcesResult> {
  try {
    // First, get regular data sources for the workspace
    const regularDataSources = await getWorkspaceDataSources(
      workspaceId,
      apiKey,
      apiServiceUrl
    );
    
    // If no data sources, return early with empty result
    if (!regularDataSources.length) {
      return {
        dataSources: [],
        stats: {
          total: 0,
          types: 0,
          managed: 0,
          unmanaged: 0
        }
      };
    }
    
    // Only fetch managed data sources if we have regular data sources
    let managedDataSources = [];
    try {
      managedDataSources = await getManagedDataSources(environmentId);
    } catch (error) {
      console.error("Failed to fetch managed data sources:", error);
      // Continue with empty managed list
    }
    
    // Use the merge function
    const mergedDataSources = getMergedDataSources(regularDataSources, managedDataSources);
    
    // Calculate stats
    const stats = calculateDataSourceStats(mergedDataSources);
    
    return {
      dataSources: mergedDataSources,
      stats
    };
  } catch (error) {
    const errorMessage = 
      error instanceof Error ? error.message : "Failed to fetch data sources";
    message.error(errorMessage);
    throw error;
  }
}

// Function to deploy a data source to another environment
export interface DeployDataSourceParams {
  envId: string;
  targetEnvId: string;
  datasourceId: string;
  updateDependenciesIfNeeded?: boolean;
}

export const deployDataSource = async (
  params: DeployDataSourceParams, 
  apiServiceUrl: string
): Promise<boolean> => {
  try {
    const response = await axios.post(
      `${apiServiceUrl}/api/plugins/enterprise/deploy-datasource`, 
      null, 
      { 
        params: {
          envId: params.envId,
          targetEnvId: params.targetEnvId,
          datasourceId: params.datasourceId,
          updateDependenciesIfNeeded: params.updateDependenciesIfNeeded ?? false
        }
      }
    );
    
    return response.status === 200;
  } catch (error) {
    console.error('Error deploying data source:', error);
    throw error;
  }
};