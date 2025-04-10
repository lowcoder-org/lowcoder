import { useState, useEffect, useCallback } from "react";
import { useHistory } from "react-router-dom";
import { fetchWorkspaceById } from "../services/environments.service";
import { Environment } from "../types/environment.types";
import { Workspace } from "../types/workspace.types";

export const useWorkspace = (
  environment: Environment | null,
  workspaceId: string
) => {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const history = useHistory();

  const fetchWorkspace = useCallback(async () => {
    if (!environment) return;

    setLoading(true);
    setError(null);

    try {
      const { environmentId, environmentApikey, environmentApiServiceUrl } = environment;

      if (!environmentApikey || !environmentApiServiceUrl) {
        setError("Missing API key or service URL for this environment.");
        setLoading(false);
        return;
      }

      const data = await fetchWorkspaceById(
        environmentId,
        workspaceId,
        environmentApikey,
        environmentApiServiceUrl
      );

      setWorkspace(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch workspace details"
      );

      // Optional: redirect to environment detail if workspace fetch fails
      // history.push(`/home/settings/environments/${environment.environmentId}`);
    } finally {
      setLoading(false);
    }
  }, [environment, workspaceId, history]);

  useEffect(() => {
    if (environment) {
      fetchWorkspace();
    }
  }, [environment, fetchWorkspace]);

  return {
    workspace,
    loading,
    error,
    refresh: fetchWorkspace,
  };
};
