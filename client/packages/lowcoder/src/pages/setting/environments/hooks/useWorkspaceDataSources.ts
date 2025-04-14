// hooks/useWorkspaceDataSources.ts
// Create this new file

import { useState, useEffect, useCallback } from "react";
import { getMergedWorkspaceDataSources } from "../services/datasources.service";
import { connectManagedDataSource, unconnectManagedDataSource } from "../services/enterprise.service";
import { Environment } from "../types/environment.types";
import { DataSource } from "../types/datasource.types";

export const useWorkspaceDataSources = (environment: Environment | null, workspaceId: string) => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    types: 0,
    managed: 0,
    unmanaged: 0
  });

  const fetchDataSources = useCallback(async () => {
    if (!environment || !workspaceId) return;

    setLoading(true);
    setError(null);

    try {
      const { environmentId, environmentApikey, environmentApiServiceUrl } = environment;

      // Validate required configuration
      if (!environmentApikey) {
        setError("No API key configured for this environment. Data sources cannot be fetched.");
        setLoading(false);
        return;
      }

      if (!environmentApiServiceUrl) {
        setError("No API service URL configured for this environment. Data sources cannot be fetched.");
        setLoading(false);
        return;
      }

      // Get merged data sources
      const result = await getMergedWorkspaceDataSources(
        workspaceId,
        environmentId,
        environmentApikey,
        environmentApiServiceUrl
      );
      
      // Update state with results
      setDataSources(result.dataSources);
      setStats(result.stats);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data sources");
      setLoading(false);
    }
  }, [environment, workspaceId]);

  useEffect(() => {
    if (environment && workspaceId) {
      fetchDataSources();
    }
  }, [environment, workspaceId, fetchDataSources]);

  const toggleManagedStatus = async (dataSource: DataSource, checked: boolean) => {
    try {
      if (!environment) return false;
      
      if (checked) {
        await connectManagedDataSource(environment.environmentId, dataSource.name, dataSource.gid);
      } else {
        await unconnectManagedDataSource(dataSource.gid);
      }

      // Optimistically update the state
      setDataSources(prevDataSources => 
        prevDataSources.map(ds =>
          ds.id === dataSource.id ? { ...ds, managed: checked } : ds
        )
      );
      
      // Update stats
      const updatedDataSources = dataSources.map(ds =>
        ds.id === dataSource.id ? { ...ds, managed: checked } : ds
      );
      
      const managedCount = updatedDataSources.filter(ds => ds.managed).length;
      
      setStats(prevStats => ({
        ...prevStats,
        managed: managedCount,
        unmanaged: updatedDataSources.length - managedCount
      }));

      return true; // Success indicator
    } catch (err) {
      return false; // Failure indicator
    }
  };

  return {
    dataSources,
    loading,
    error,
    stats,
    toggleManagedStatus,
  };
};