import { useState, useEffect, useCallback } from "react";
import { getEnvironmentById, fetchWorkspaceById, getWorkspaceApps} from "../services/environments.service";
import { Environment } from "../types/environment.types";
import { Workspace } from "../types/workspace.types";
import { App } from "../types/app.types";
export const useWorkspaceDetail = (
  environmentId: string,
  workspaceId: string
) => {
  // Environment state
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [environmentLoading, setEnvironmentLoading] = useState<boolean>(true);
  const [environmentError, setEnvironmentError] = useState<string | null>(null);

  // Workspace state
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState<boolean>(true);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  // Apps state
  const [apps, setApps] = useState<App[]>([]);
  const [appsLoading, setAppsLoading] = useState<boolean>(false);
  const [appsError, setAppsError] = useState<string | null>(null);

  // Function to fetch environment data
  const fetchEnvironmentData = useCallback(async () => {
    // Similar to your existing function
    setEnvironmentLoading(true);
    try {
      const data = await getEnvironmentById(environmentId);
      setEnvironment(data);
    } catch (err) {
      setEnvironmentError(
        err instanceof Error ? err.message : "Failed to fetch environment"
      );
    } finally {
      setEnvironmentLoading(false);
    }
  }, [environmentId]);

  // Function to fetch workspace data using your fetchWorkspaceById
  const fetchWorkspaceData = useCallback(async () => {
    if (!environment) return;

    setWorkspaceLoading(true);
    try {
      const apiKey = environment.environmentApikey;
      const apiServiceUrl = environment.environmentApiServiceUrl;

      if (!apiKey || !apiServiceUrl) {
        setWorkspaceError("Missing API key or service URL");
        return;
      }

      const data = await fetchWorkspaceById(
        environmentId,
        workspaceId,
        apiKey,
        apiServiceUrl
      );
      if (data) {
        setWorkspace(data);
      } else {
        setWorkspaceError("Workspace not found");
      }
    } catch (err) {
      setWorkspaceError(
        err instanceof Error ? err.message : "Failed to fetch workspace"
      );
    } finally {
      setWorkspaceLoading(false);
    }
  }, [environment, environmentId, workspaceId]);

  // Function to fetch apps
  const fetchAppsData = useCallback(async () => {
    if (!environment || !workspace) return;

    setAppsLoading(true);
    try {
      const apiKey = environment.environmentApikey;
      const apiServiceUrl = environment.environmentApiServiceUrl;

      if (!apiKey || !apiServiceUrl) {
        setAppsError("Missing API key or service URL");
        return;
      }

      const data = await getWorkspaceApps(workspace.id, apiKey, apiServiceUrl);
      setApps(data);
    } catch (err) {
      setAppsError(err instanceof Error ? err.message : "Failed to fetch apps");
    } finally {
      setAppsLoading(false);
    }
  }, [environment, workspace]);

  // Chain the useEffects to sequence the data fetching
  useEffect(() => {
    fetchEnvironmentData();
  }, [fetchEnvironmentData]);

  useEffect(() => {
    if (environment) {
      fetchWorkspaceData();
    }
  }, [environment, fetchWorkspaceData]);

  useEffect(() => {
    if (environment && workspace) {
      fetchAppsData();
    }
  }, [environment, workspace, fetchAppsData]);

  // App statistics
  const appStats = {
    total: apps.length,
    published: apps.filter((app) => app.published).length,
  };

  return {
    // Environment data
    environment,
    environmentLoading,
    environmentError,
    refreshEnvironment: fetchEnvironmentData,

    // Workspace data
    workspace,
    workspaceLoading,
    workspaceError,
    refreshWorkspace: fetchWorkspaceData,

    // Apps data
    apps,
    appsLoading,
    appsError,
    refreshApps: fetchAppsData,
    appStats,

    // Overall loading state
    isLoading: environmentLoading || workspaceLoading,
    hasError: !!(environmentError || workspaceError),
  };
};
