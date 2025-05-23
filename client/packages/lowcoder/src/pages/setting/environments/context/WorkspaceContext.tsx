// client/packages/lowcoder/src/pages/setting/environments/context/WorkspaceContext.tsx
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    ReactNode,
  } from "react";
  import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
  import { useParams } from "react-router-dom";
  import { useSingleEnvironmentContext } from "./SingleEnvironmentContext";
  import { fetchWorkspaceById } from "../services/environments.service";
  import { Workspace } from "../types/workspace.types";
  import { getManagedObjects, ManagedObjectType, setManagedObject, unsetManagedObject } from "../services/managed-objects.service";
  
  interface WorkspaceContextState {
    // Workspace data
    workspace: Workspace | null;
    
    // Loading states
    isLoading: boolean;
    
    // Error state
    error: string | null;
    
    // Functions
    refreshWorkspace: () => Promise<void>;
    toggleManagedStatus: (checked: boolean) => Promise<boolean>;
  }
  
  const WorkspaceContext = createContext<WorkspaceContextState | undefined>(undefined);
  
  export const useWorkspaceContext = () => {
    const context = useContext(WorkspaceContext);
    if (!context) {
      throw new Error("useWorkspaceContext must be used within a WorkspaceProvider");
    }
    return context;
  };
  
  interface ProviderProps {
    children: ReactNode;
    workspaceId?: string;
  }
  
  export const WorkspaceProvider: React.FC<ProviderProps> = ({
    children,
    workspaceId: propWorkspaceId,
  }) => {
    // Get workspaceId from URL params if not provided as prop
    const { workspaceId: urlWorkspaceId } = useParams<{ workspaceId: string }>();
    const workspaceId = propWorkspaceId || urlWorkspaceId;
    
    // Get the environment context to access environment data
    const { environment } = useSingleEnvironmentContext();
    
    // State for workspace data
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
  
    // Function to fetch workspace by ID
    const fetchWorkspace = useCallback(async () => {
      // Only fetch if we have a workspace ID and environment
      if (!workspaceId || !environment) {
        setWorkspace(null);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch the workspace data
        const workspaceData = await fetchWorkspaceById(
          environment.environmentId, 
          workspaceId, 
          environment.environmentApikey, 
          environment.environmentApiServiceUrl!
        );
        
        if (!workspaceData) {
          throw new Error("Workspace not found");
        }
        
        // Fetch managed workspaces to check if this one is managed
        const managedWorkspaces = await getManagedObjects(environment.environmentId, ManagedObjectType.ORG);
        
        // Set the managed status
        const isManaged = managedWorkspaces.some(org => org.objGid === workspaceData.gid);
        
        // Update the workspace with managed status
        setWorkspace({
          ...workspaceData,
          managed: isManaged
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch workspace';
        messageInstance.error(errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }, [workspaceId, environment]);
  
    // Function to toggle managed status
    const toggleManagedStatus = useCallback(async (checked: boolean): Promise<boolean> => {
      if (!workspace || !environment) {
        return false;
      }
      
      try {
        if (checked) {
          // Connect the workspace as managed
          await setManagedObject(
            workspace.gid!,
            environment.environmentId,
            ManagedObjectType.ORG,
            
          
          );
        } else {
          // Disconnect the managed workspace
          await unsetManagedObject(
            workspace.gid!,
            environment.environmentId, 
            ManagedObjectType.ORG 
          );
        }
        
        // Update local state
        setWorkspace(prev => prev ? { ...prev, managed: checked } : null);
        
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update managed status";
        messageInstance.error(errorMessage);
        return false;
      }
    }, [workspace, environment]);
  
    // Load workspace data when the component mounts or dependencies change
    useEffect(() => {
      fetchWorkspace();
    }, [fetchWorkspace]);
  
    // Create the context value
    const value: WorkspaceContextState = {
      workspace,
      isLoading,
      error,
      refreshWorkspace: fetchWorkspace,
      toggleManagedStatus
    };
  
    return (
      <WorkspaceContext.Provider value={value}>
        {children}
      </WorkspaceContext.Provider>
    );
  };