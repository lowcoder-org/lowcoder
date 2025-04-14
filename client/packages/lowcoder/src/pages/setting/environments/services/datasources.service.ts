// services/dataSources.service.ts
import axios from 'axios';
import { message } from "antd";
import { DataSource, DataSourceWithMeta } from "../types/datasource.types";
import { getManagedDataSources } from "./enterprise.service";

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

// Get data sources for a workspace - using your correct implementation
export async function getWorkspaceDataSources(
  workspaceId: string, 
  apiKey: string,
  apiServiceUrl: string
): Promise<DataSourceWithMeta[]> {
  try {
    // Check if required parameters are provided
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }
    
    if (!apiKey) {
      throw new Error('API key is required to fetch data sources');
    }
    
    if (!apiServiceUrl) {
      throw new Error('API service URL is required to fetch data sources');
    }
    
    // Set up headers with the Bearer token format
    const headers = {
      Authorization: `Bearer ${apiKey}`
    };
    
    // Make the API request to get data sources
    const response = await axios.get<{data:DataSourceWithMeta[]}>(`${apiServiceUrl}/api/datasources/listByOrg`, { 
      headers,
      params: {
        orgId: workspaceId
      }
    });
    console.log("data source response",response);
  
    // Check if response is valid
    if (!response.data) {
      return [];
    }
    
    return response.data.data;
  } catch (error) {
    // Handle and transform error
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data sources';
    message.error(errorMessage);
    throw error;
  }
}

// Function to merge regular and managed data sources
export const getMergedDataSources = (standardDataSources: DataSourceWithMeta[], managedDataSources: any[]): DataSource[] => {
  return standardDataSources.map((dataSourceWithMeta) => {
    const dataSource = dataSourceWithMeta.datasource;
    return {
      ...dataSource,
      managed: managedDataSources.some((managedDs) => managedDs.datasourceGid === dataSource.gid),
    };
  });
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
    const regularDataSourcesWithMeta = await getWorkspaceDataSources(
      workspaceId,
      apiKey,
      apiServiceUrl
    );
    
    // If no data sources, return early with empty result
    if (!regularDataSourcesWithMeta.length) {
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
    const mergedDataSources = getMergedDataSources(regularDataSourcesWithMeta, managedDataSources);
    
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