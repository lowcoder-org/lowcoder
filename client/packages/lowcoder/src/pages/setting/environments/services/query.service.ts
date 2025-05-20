/**
 * Get merged queries (both regular and managed) for a workspace
 */
import axios from 'axios';
import { getManagedObjects, ManagedObjectType, transferManagedObject } from './managed-objects.service';
import { getWorkspaceQueries } from './environments.service';
import { Query, QueryStats } from '../types/query.types';
export interface MergedQueriesResult {
    queries: Query[];
    stats: QueryStats;
  }

  export interface DeployQueryParams {
    envId: string;
    targetEnvId: string;
    queryId: string;
    updateDependenciesIfNeeded?: boolean;
  }
  
  
  export async function getMergedWorkspaceQueries(
    workspaceId: string,
    environmentId: string,
    apiKey: string,
    apiServiceUrl: string
  ): Promise<MergedQueriesResult> {
    try {
      // Fetch regular queries
      
      const regularQueries = await getWorkspaceQueries(workspaceId, apiKey, apiServiceUrl);
      console.log("Regular queries response:", regularQueries);
      
      const managedObjects = await getManagedObjects(environmentId, ManagedObjectType.QUERY);
      console.log("Managed queries response:", managedObjects);
      
      // Create a set of managed query GIDs for quick lookup
      const managedQueryGids = new Set(managedObjects.map(obj => obj.objGid));
      console.log("Managed query GIDs:", Array.from(managedQueryGids));
      
      // Mark regular queries as managed if they exist in managed queries
      const mergedQueries = regularQueries.queries.map((query: Query) => {
        const isManaged = managedQueryGids.has(query.gid);
        console.log(`Query ${query.name} (gid: ${query.gid}) is ${isManaged ? "managed" : "not managed"}`);
        
        return {
          ...query,
          managed: isManaged
        };
      });
      
      // Calculate stats
      const total = mergedQueries.length;
      const managed = mergedQueries.filter(query => query.managed).length;
      console.log("Generated stats:", {
        total,
        managed,
        unmanaged: total - managed
      });
      
      return {
        queries: mergedQueries,
        stats: {
          total,
          managed,
          unmanaged: total - managed
        }
      };
      
    } catch (error) {
      console.error("Error in getMergedWorkspaceQueries:", error);
      throw error;
    }
  }

  export async function deployQuery(params: DeployQueryParams): Promise<boolean> {
    try {
      const response = await axios.post('/api/plugins/enterprise/qlQuery/deploy', null, {
        params: {
          envId: params.envId,
          targetEnvId: params.targetEnvId,
          queryId: params.queryId,
          updateDependenciesIfNeeded: params.updateDependenciesIfNeeded ?? false
        }
      });
      if (response.status === 200) {
        await transferManagedObject(
          params.queryId,
          params.envId,
          params.targetEnvId,
          ManagedObjectType.QUERY
        );
      }
      return response.status === 200;
    } catch (error) {
      console.error('Error deploying query:', error);
      throw error;
    }
  }