// services/dataSources.service.ts
import axios from 'axios';
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { trans } from "i18n";
import { DataSource, DataSourceWithMeta } from "../types/datasource.types";
import { getManagedObjects, ManagedObject, ManagedObjectType  , transferManagedObject } from "./managed-objects.service";

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

export interface DeployDataSourceParams {
  envId: string;
  targetEnvId: string;
  datasourceId: string;
  datasourceGid: string;
  deployCredential: boolean;
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
      throw new Error(trans("environments.services_datasources_workspaceIdRequired"));
    }
    
    if (!apiKey) {
      throw new Error(trans("environments.services_datasources_apiKeyRequiredToFetchDataSources"));
    }
    
    if (!apiServiceUrl) {
      throw new Error(trans("environments.services_datasources_apiServiceUrlRequiredToFetchDataSources"));
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
  
    // Check if response is valid
    if (!response.data) {
      return [];
    }
    
    return response.data.data;
  } catch (error) {
    // Handle and transform error
    const errorMessage = error instanceof Error ? error.message : trans("environments.services_datasources_failedToFetchDataSources");
    messageInstance.error(errorMessage);
    throw error;
  }
}

// Function to merge regular and managed data sources
export const getMergedDataSources = (standardDataSources: DataSourceWithMeta[], managedObjects: ManagedObject[]): DataSource[] => {
  return standardDataSources.map((dataSourceWithMeta) => {
    const dataSource = dataSourceWithMeta.datasource;
    return {
      ...dataSource,
      managed: managedObjects.some((obj) => obj.objGid === dataSource.gid && obj.objType === ManagedObjectType.DATASOURCE),
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
    let managedObjects: ManagedObject[] = [];
    try {
      managedObjects = await getManagedObjects(environmentId, ManagedObjectType.DATASOURCE);
    } catch (error) {
      console.error("Failed to fetch managed data sources:", error);
      // Continue with empty managed list
    }
    
    // Use the merge function
    const mergedDataSources = getMergedDataSources(regularDataSourcesWithMeta, managedObjects);
    
    // Calculate stats
    const stats = calculateDataSourceStats(mergedDataSources);
    
    return {
      dataSources: mergedDataSources,
      stats
    };
  } catch (error) {
    const errorMessage = 
      error instanceof Error ? error.message : trans("environments.services_datasources_failedToFetchDataSources");
    messageInstance.error(errorMessage);
    throw error;
  }
}

// Function to deploy a data source to another environment
export async function deployDataSource(params: DeployDataSourceParams): Promise<boolean> {
  try {
    const response = await axios.post('/api/plugins/enterprise/datasource/deploy', null, {
      params: {
        envId: params.envId,
        targetEnvId: params.targetEnvId,
        datasourceId: params.datasourceId,
        deployCredential: params.deployCredential
      }
    });
    if (response.status === 200) {
      await transferManagedObject(
        params.datasourceGid,
        params.envId,
        params.targetEnvId,
        ManagedObjectType.DATASOURCE
      );
    }
    return response.status === 200;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : trans("environments.services_datasources_failedToDeployDataSource");
    messageInstance.error(errorMessage);
    throw error;
  }
}