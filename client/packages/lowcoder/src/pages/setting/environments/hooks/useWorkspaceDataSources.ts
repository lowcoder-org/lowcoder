import { useState, useEffect, useCallback } from "react";
import { getWorkspaceDataSources } from "../services/environments.service";
import { Environment } from "../types/environment.types";
import { DataSourceWithMeta } from "../types/datasource.types";

interface DataSourceStats {
  total: number;
  types: number; // unique types
}

export const useWorkspaceDataSources = (
  environment: Environment | null,
  workspaceId: string
) => {
  const [dataSources, setDataSources] = useState<DataSourceWithMeta[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDataSources = useCallback(async () => {
    if (!environment || !workspaceId) return;

    setLoading(true);
    setError(null);

    try {
      const {  environmentApikey, environmentApiServiceUrl } = environment;

      if (!environmentApikey || !environmentApiServiceUrl) {
        setError("Missing API key or service URL. Data sources cannot be fetched.");
        setLoading(false);
        return;
      }

      const data = await getWorkspaceDataSources(
        workspaceId,
        environmentApikey,
        environmentApiServiceUrl
      );

      setDataSources(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch data sources"
      );
    } finally {
      setLoading(false);
    }
  }, [environment, workspaceId]);

  useEffect(() => {
    if (environment) {
      fetchDataSources();
    }
  }, [environment, fetchDataSources]);

  const uniqueTypes = new Set(dataSources.map(ds => ds.datasource.type));

  const dataSourceStats: DataSourceStats = {
    total: dataSources.length,
    types: uniqueTypes.size,
  };

  return {
    dataSources,
    loading,
    error,
    refresh: fetchDataSources,
    dataSourceStats,
  };
};
