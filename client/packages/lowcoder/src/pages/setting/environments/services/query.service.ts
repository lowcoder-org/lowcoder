/**
 * Get merged queries (both regular and managed) for a workspace
 */
import { getManagedQueries } from './enterprise.service';
import { getWorkspaceQueries } from './environments.service';
import { Query } from '../types/query.types';
export interface MergedQueriesResult {
    queries: Query[];
    stats: {
      total: number;
      managed: number;
      unmanaged: number;
    };
  }
  
  export async function getMergedWorkspaceQueries(
    workspaceId: string,
    environmentId: string,
    apiKey: string,
    apiServiceUrl: string
  ): Promise<MergedQueriesResult> {
    try {
      // Fetch both regular and managed queries
      const [regularQueries, managedQueries] = await Promise.all([
        getWorkspaceQueries(workspaceId, apiKey, apiServiceUrl),
        getManagedQueries(environmentId)
      ]);
      
      // Create a map of managed queries by GID for quick lookup
      const managedQueryGids = new Set(managedQueries.map(query => query.gid));
      
      // Mark regular queries as managed if they exist in managed queries
      const mergedQueries = regularQueries.queries.map((query: Query ) => ({
        ...query,
        managed: managedQueryGids.has(query.gid)
      }));
      
      // Calculate stats
      const total = mergedQueries.length;
      const managed = mergedQueries.filter(query => query.managed).length;
      
      return {
        queries: mergedQueries,
        stats: {
          total,
          managed,
          unmanaged: total - managed
        }
      };
      
    } catch (error) {
      throw error;
    }
  }