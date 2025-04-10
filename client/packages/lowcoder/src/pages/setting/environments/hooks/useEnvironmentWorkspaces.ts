import { useState, useEffect, useCallback } from "react";
import { getEnvironmentWorkspaces } from "../services/environments.service";
import { Environment } from "../types/environment.types";
import { Workspace } from "../types/workspace.types";

interface WorkspaceStats {
  total: number;
  managed: number;
  unmanaged: number;
  apiKeyConfigured: boolean;
  apiServiceUrlConfigured: boolean;
}

export const useEnvironmentWorkspaces = (
  environment: Environment | null
) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    if (!environment) return;

    setLoading(true);
    setError(null);

    try {
      const { environmentId, environmentApikey, environmentApiServiceUrl } = environment;

      if (!environmentApikey) {
        setError("No API key configured for this environment. Workspaces cannot be fetched.");
        setLoading(false);
        return;
      }

      if (!environmentApiServiceUrl) {
        setError("No API service URL configured for this environment. Workspaces cannot be fetched.");
        setLoading(false);
        return;
      }

      const data = await getEnvironmentWorkspaces(
        environmentId,
        environmentApikey,
        environmentApiServiceUrl
      );

      setWorkspaces(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch workspaces"
      );
    } finally {
      setLoading(false);
    }
  }, [environment]);

  useEffect(() => {
    if (environment) {
      fetchWorkspaces();
    }
  }, [environment, fetchWorkspaces]);

  const workspaceStats: WorkspaceStats = {
    total: workspaces.length,
    managed: 0, // logic to be added later
    unmanaged: workspaces.length, // logic to be added later
    apiKeyConfigured: !!environment?.environmentApikey,
    apiServiceUrlConfigured: !!environment?.environmentApiServiceUrl,
  };

  return {
    workspaces,
    loading,
    error,
    refresh: fetchWorkspaces,
    workspaceStats,
  };
};
