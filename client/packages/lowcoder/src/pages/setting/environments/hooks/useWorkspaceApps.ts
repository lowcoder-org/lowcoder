import { useState, useEffect, useCallback } from "react";
import { getWorkspaceApps } from "../services/environments.service";
import { Environment } from "../types/environment.types";
import { App } from "../types/app.types";

interface AppStats {
  total: number;
  published: number;
}

export const useWorkspaceApps = (
  environment: Environment | null,
  workspaceId: string
) => {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    if (!environment || !workspaceId) return;

    setLoading(true);
    setError(null);

    try {
      const { environmentId, environmentApikey, environmentApiServiceUrl } = environment;

      if (!environmentApikey || !environmentApiServiceUrl) {
        setError("Missing API key or service URL for this environment. Apps cannot be fetched.");
        setLoading(false);
        return;
      }

      const data = await getWorkspaceApps(
        workspaceId,
        environmentApikey,
        environmentApiServiceUrl
      );

      setApps(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch apps"
      );
    } finally {
      setLoading(false);
    }
  }, [environment, workspaceId]);

  useEffect(() => {
    if (environment) {
      fetchApps();
    }
  }, [environment, fetchApps]);

  const appStats: AppStats = {
    total: apps.length,
    published: apps.filter(app => app.published).length,
  };

  return {
    apps,
    loading,
    error,
    refresh: fetchApps,
    appStats,
  };
};
