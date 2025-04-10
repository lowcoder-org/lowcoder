import { useState, useEffect, useCallback } from "react";
import {
  getEnvironmentById,
  getEnvironmentWorkspaces,
  getEnvironmentUserGroups,
} from "../services/environments.service";
import { Environment } from "../types/environment.types";
import { Workspace } from "../types/workspace.types";
import { UserGroup } from "../types/userGroup.types";

/**
 * Custom hook to fetch and manage environment detail data
 * @param id - Environment ID to fetch
 * @returns Object containing environment data, workspaces, user groups, loading states, error states, and refresh functions
 */
export const useEnvironmentDetail = (id: string) => {
  // Environment state
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Workspaces state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspacesLoading, setWorkspacesLoading] = useState<boolean>(false);
  const [workspacesError, setWorkspacesError] = useState<string | null>(null);

  // User Groups state
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [userGroupsLoading, setUserGroupsLoading] = useState<boolean>(false);
  const [userGroupsError, setUserGroupsError] = useState<string | null>(null);

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

  // Function to fetch workspaces
  const fetchWorkspaces = useCallback(async () => {
    // Don't fetch workspaces if environment is not loaded yet
    if (!environment) {
      return;
    }

    setWorkspacesLoading(true);
    setWorkspacesError(null);

    try {
      // Get the API key and API service URL from the environment
      const apiKey = environment.environmentApikey;
      const apiServiceUrl = environment.environmentApiServiceUrl;

      // Check if both API key and API service URL are configured
      if (!apiKey) {
        setWorkspacesError(
          "No API key configured for this environment. Workspaces cannot be fetched."
        );
        setWorkspacesLoading(false);
        return;
      }

      if (!apiServiceUrl) {
        setWorkspacesError(
          "No API service URL configured for this environment. Workspaces cannot be fetched."
        );
        setWorkspacesLoading(false);
        return;
      }

      // Call the function with environment ID, API key, and API service URL
      const data = await getEnvironmentWorkspaces(id, apiKey, apiServiceUrl);
      setWorkspaces(data);
    } catch (err) {
      setWorkspacesError(
        err instanceof Error ? err.message : "Failed to fetch workspaces"
      );
    } finally {
      setWorkspacesLoading(false);
    }
  }, [environment, id]);

  // Function to fetch user groups
  const fetchUserGroups = useCallback(async () => {
    // Don't fetch user groups if environment is not loaded yet
    if (!environment) {
      return;
    }

    setUserGroupsLoading(true);
    setUserGroupsError(null);

    try {
      // Get the API key and API service URL from the environment
      const apiKey = environment.environmentApikey;
      const apiServiceUrl = environment.environmentApiServiceUrl;

      // Check if both API key and API service URL are configured
      if (!apiKey) {
        setUserGroupsError(
          "No API key configured for this environment. User groups cannot be fetched."
        );
        setUserGroupsLoading(false);
        return;
      }

      if (!apiServiceUrl) {
        setUserGroupsError(
          "No API service URL configured for this environment. User groups cannot be fetched."
        );
        setUserGroupsLoading(false);
        return;
      }

      // Call the function with environment ID, API key, and API service URL
      const data = await getEnvironmentUserGroups(id, apiKey, apiServiceUrl);
      setUserGroups(data);
    } catch (err) {
      setUserGroupsError(
        err instanceof Error ? err.message : "Failed to fetch user groups"
      );
    } finally {
      setUserGroupsLoading(false);
    }
  }, [environment, id]);

  // Fetch environment data on mount and when ID changes
  useEffect(() => {
    fetchEnvironmentData();
  }, [fetchEnvironmentData]);

  // Fetch workspaces and user groups after environment is loaded
  useEffect(() => {
    if (environment) {
      fetchWorkspaces();
      fetchUserGroups();
    }
  }, [environment, fetchWorkspaces, fetchUserGroups]);

  // Calculate workspace statistics
  const workspaceStats = {
    total: workspaces.length,
    managed: 0, // To be implemented later
    unmanaged: workspaces.length, // To be implemented later
    apiKeyConfigured: !!environment?.environmentApikey,
    apiServiceUrlConfigured: !!environment?.environmentApiServiceUrl,
  };

  // Calculate user group statistics
  const userGroupStats = {
    total: userGroups.length,
    totalUsers: userGroups.reduce(
      (acc, group) => acc + group.stats.userCount,
      0
    ),
    adminUsers: userGroups.reduce(
      (acc, group) => acc + group.stats.adminUserCount,
      0
    ),
    apiKeyConfigured: !!environment?.environmentApikey,
    apiServiceUrlConfigured: !!environment?.environmentApiServiceUrl,
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

    // User Groups data
    userGroups,
    userGroupsLoading,
    userGroupsError,
    refreshUserGroups: fetchUserGroups,
    userGroupStats,
  };
};
