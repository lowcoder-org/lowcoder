// hooks/useWorkspaceApps.ts
import { useState, useEffect, useCallback } from "react";
import { getMergedWorkspaceApps, MergedAppsResult } from "../services/apps.service";
import { connectManagedApp, unconnectManagedApp } from "../services/enterprise.service";
import { Environment } from "../types/environment.types";
import { App } from "../types/app.types";

interface AppState extends MergedAppsResult {
  loading: boolean;
  error: string | null;
}

export const useWorkspaceApps = (environment: Environment | null, workspaceId: string) => {
  const [state, setState] = useState<AppState>({
    apps: [],
    stats: {
      total: 0,
      published: 0,
      managed: 0,
      unmanaged: 0
    },
    loading: false,
    error: null
  });

  const fetchApps = useCallback(async () => {
    if (!environment || !workspaceId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { environmentId, environmentApikey, environmentApiServiceUrl } = environment;

      // Validate required configuration
      if (!environmentApikey) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: "No API key configured for this environment. Apps cannot be fetched." 
        }));
        return;
      }

      if (!environmentApiServiceUrl) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: "No API service URL configured for this environment. Apps cannot be fetched." 
        }));
        return;
      }

      // Use the service function to get merged apps
      const result = await getMergedWorkspaceApps(
        workspaceId,
        environmentId,
        environmentApikey,
        environmentApiServiceUrl
      );
      
      // Update state with result
      setState({
        ...result,
        loading: false,
        error: null
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch apps"
      }));
    }
  }, [environment, workspaceId]);

  useEffect(() => {
    if (environment && workspaceId) {
      fetchApps();
    }
  }, [environment, workspaceId, fetchApps]);

  const toggleManagedStatus = async (app: App, checked: boolean) => {
    try {
      if (!environment) return false;
      
      if (checked) {
        await connectManagedApp(environment.environmentId, app.name, app.applicationGid!);
      } else {
        await unconnectManagedApp(app.applicationGid!);
      }

      // Optimistically update the state
      setState(prev => {
        // Update apps with the new managed status
        const updatedApps = prev.apps.map(a =>
          a.applicationId === app.applicationId ? { ...a, managed: checked } : a
        );
        
        // Recalculate stats
        const managedCount = updatedApps.filter(a => a.managed).length;
        
        return {
          ...prev,
          apps: updatedApps,
          stats: {
            ...prev.stats,
            managed: managedCount,
            unmanaged: updatedApps.length - managedCount
          }
        };
      });

      return true; // Success indicator
    } catch (err) {
      return false; // Failure indicator
    }
  };

  return {
    ...state,
    toggleManagedStatus,
  };
};