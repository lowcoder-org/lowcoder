// hooks/useWorkspaces.ts
import { useState, useEffect, useCallback } from "react";
import { getMergedEnvironmentWorkspaces, MergedWorkspacesResult } from "../services/workspace.service";
import { connectManagedWorkspace, unconnectManagedWorkspace } from "../services/enterprise.service";
import { Environment } from "../types/environment.types";
import { Workspace } from "../types/workspace.types";

interface WorkspacesState extends MergedWorkspacesResult {
  loading: boolean;
  error: string | null;
}

export const useWorkspaces = (environment: Environment | null) => {
  const [state, setState] = useState<WorkspacesState>({
    workspaces: [],
    stats: {
      total: 0,
      managed: 0,
      unmanaged: 0,
    },
    loading: false,
    error: null
  });

  const fetchWorkspaces = useCallback(async () => {
    if (!environment) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { environmentId, environmentApikey, environmentApiServiceUrl } = environment;

      // Validate required configuration
      if (!environmentApikey) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: "No API key configured for this environment. Workspaces cannot be fetched." 
        }));
        return;
      }

      if (!environmentApiServiceUrl) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: "No API service URL configured for this environment. Workspaces cannot be fetched." 
        }));
        return;
      }

      // Use the merged utility function
      const result = await getMergedEnvironmentWorkspaces(
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
        error: err instanceof Error ? err.message : "Failed to fetch workspaces"
      }));
    }
  }, [environment]);

  useEffect(() => {
    if (environment) {
      fetchWorkspaces();
    }
  }, [environment, fetchWorkspaces]);

  const toggleManagedStatus = async (workspace: Workspace, checked: boolean) => {
    try {
      if (!environment) return false;
      
      if (checked) {
        await connectManagedWorkspace(environment.environmentId, workspace.name, workspace.gid!);
      } else {
        await unconnectManagedWorkspace(workspace.gid!);
      }

      // Optimistically update the state
      setState(prev => {
        // Update workspaces with the new managed status
        const updatedWorkspaces = prev.workspaces.map(w =>
          w.id === workspace.id ? { ...w, managed: checked } : w
        );
        
        // Recalculate stats
        const managedCount = updatedWorkspaces.filter(w => w.managed).length;
        
        return {
          ...prev,
          workspaces: updatedWorkspaces,
          stats: {
            total: updatedWorkspaces.length,
            managed: managedCount,
            unmanaged: updatedWorkspaces.length - managedCount
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