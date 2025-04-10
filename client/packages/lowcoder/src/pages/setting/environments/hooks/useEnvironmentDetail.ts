import { useState, useEffect, useCallback } from "react";
import {
  getEnvironmentById,
  getEnvironmentWorkspaces,
} from "../services/environments.service";
import { Environment } from "../types/environment.types";
import { Workspace } from "../types/workspace.types";
/**
 * Custom hook to fetch and manage environment detail data
 * @param id - Environment ID to fetch
 * @returns Object containing environment data, loading state, error state, and refresh function
 */
export const useEnvironmentDetail = (id: string) => {
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Workspaces state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspacesLoading, setWorkspacesLoading] = useState<boolean>(false);
  const [workspacesError, setWorkspacesError] = useState<string | null>(null);

  // Function to fetch environment data
  const fetchEnvironmentData = useCallback(async () => {
    if (!id) {
      setError("No environment ID provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getEnvironmentById(id);
      setEnvironment(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch environment details"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Function to fetch workspaces for the environment
  const fetchWorkspaces = useCallback(async () => {
    // Don't fetch workspaces if environment is not loaded yet
    if (!environment) {
      return;
    }

    setWorkspacesLoading(true);
    setWorkspacesError(null);

    try {
      // Get the API key from the environment
      const apiKey = environment.environmentApikey;
      const apiServiceUrl = environment.environmentApiServiceUrl;

      if (!apiKey) {
        setWorkspacesError(
          "No API key configured for this environment. Workspaces cannot be fetched."
        );
        setWorkspacesLoading(false);
        return;
      }
      if (!apiServiceUrl) {
        setWorkspacesError('No API service URL configured for this environment. Workspaces cannot be fetched.');
        setWorkspacesLoading(false);
        return;
      }

      // Call the function with environment ID and API key
      const data = await getEnvironmentWorkspaces(id, apiKey, apiServiceUrl);
      console.log(data);
      setWorkspaces(data);
    } catch (err) {
      setWorkspacesError(
        err instanceof Error ? err.message : "Failed to fetch workspaces"
      );
    } finally {
      setWorkspacesLoading(false);
    }
  }, [environment, id]);

  // Fetch environment data on mount and when ID changes
  useEffect(() => {
    fetchEnvironmentData();
  }, [fetchEnvironmentData]);

  // Fetch workspaces when environment is loaded
  useEffect(() => {
    if (environment) {
      fetchWorkspaces();
    }
  }, [environment, fetchWorkspaces]);

  // Calculate workspace statistics
  const workspaceStats = {
    total: workspaces.length,
    managed: 0, // To be implemented later
    unmanaged: workspaces.length, // To be implemented later
    apiKeyConfigured: !!environment?.environmentApikey,
    apiServiceUrlConfigured: !!environment?.environmentApiServiceUrl
  };

  // Return the state and functions to refresh data
  return {
    // Environment data
    environment,
    loading,
    error,
    refresh: fetchEnvironmentData,

    // Workspaces data
    workspaces,
    workspacesLoading,
    workspacesError,
    refreshWorkspaces: fetchWorkspaces,
    workspaceStats,
  };
};
