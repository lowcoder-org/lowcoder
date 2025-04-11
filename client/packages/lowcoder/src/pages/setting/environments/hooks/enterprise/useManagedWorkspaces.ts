import { useEffect, useState, useCallback } from "react";
import { ManagedOrg } from "../../types/enterprise.types";
import {
  getManagedWorkspaces,
} from "../../services/enterprise.service";
import { Environment } from "../../types/environment.types";

export function useManagedWorkspaces(
  environment: Environment | null
) {
  const [managed, setManaged] = useState<ManagedOrg[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchManaged = useCallback(async () => {
    if (!environment) return;
    setLoading(true);
    setError(null);


    try {
      const { environmentId, environmentApikey, environmentApiServiceUrl } = environment;

      if (!environmentApikey) {
        setError("Missing API key or service URL for this environment.");
        setLoading(false);
        return;
      }

      const result = await getManagedWorkspaces(environmentId);
      console.log("Managed workspaces:", result);
      setManaged(result);
    } catch (err: any) {
      setError(err.message ?? "Failed to load managed workspaces");
    } finally {
      setLoading(false);
    }
  } , [environment]);

  useEffect(() => {
    if(environment) {
      fetchManaged();
    }
  }, [environment, fetchManaged]);

  return {
    managedWorkspaces: managed,
    managedLoading: loading,
    managedError: error,
    refreshManagedWorkspaces: fetchManaged,
  };
}
