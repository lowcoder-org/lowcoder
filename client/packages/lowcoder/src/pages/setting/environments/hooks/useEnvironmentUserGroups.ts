import { useState, useEffect, useCallback } from "react";
import { getEnvironmentUserGroups } from "../services/environments.service";
import { Environment } from "../types/environment.types";
import { UserGroup } from "../types/userGroup.types";

interface UserGroupStats {
  total: number;
  totalUsers: number;
  adminUsers: number;
  apiKeyConfigured: boolean;
  apiServiceUrlConfigured: boolean;
}

export const useEnvironmentUserGroups = (
  environment: Environment | null
) => {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserGroups = useCallback(async () => {
    if (!environment) return;

    setLoading(true);
    setError(null);

    try {
      const { environmentId, environmentApikey, environmentApiServiceUrl } = environment;

      if (!environmentApikey) {
        setError("No API key configured for this environment. User groups cannot be fetched.");
        setLoading(false);
        return;
      }

      if (!environmentApiServiceUrl) {
        setError("No API service URL configured for this environment. User groups cannot be fetched.");
        setLoading(false);
        return;
      }

      const data = await getEnvironmentUserGroups(
        environmentId,
        environmentApikey,
        environmentApiServiceUrl
      );

      setUserGroups(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch user groups"
      );
    } finally {
      setLoading(false);
    }
  }, [environment]);

  useEffect(() => {
    if (environment) {
      fetchUserGroups();
    }
  }, [environment, fetchUserGroups]);

  const userGroupStats: UserGroupStats = {
    total: userGroups.length,
    totalUsers: userGroups.reduce((sum, group) => sum + (group.stats?.userCount ?? 0), 0),
    adminUsers: userGroups.reduce((sum, group) => sum + (group.stats?.adminUserCount ?? 0), 0),
    apiKeyConfigured: !!environment?.environmentApikey,
    apiServiceUrlConfigured: !!environment?.environmentApiServiceUrl,
  };

  return {
    userGroups,
    loading,
    error,
    refresh: fetchUserGroups,
    userGroupStats,
  };
};
