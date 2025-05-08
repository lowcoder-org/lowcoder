// client/packages/lowcoder/src/pages/setting/environments/context/WorkspaceContext.tsx
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    ReactNode,
  } from "react";
  import { message } from "antd";
  import { useParams } from "react-router-dom";
  import { useSingleEnvironmentContext } from "./SingleEnvironmentContext";
  import { fetchWorkspaceById} from "../services/environments.service";
  import { Workspace } from "../types/workspace.types";
  
  interface WorkspaceContextState {
    // Workspace data
    workspace: Workspace | null;
    
    // Loading states
    isLoading: boolean;
    
    // Error state
    error: string | null;
    
    // Functions
    refreshWorkspace: () => Promise<void>;
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
        const data = await fetchWorkspaceById(environment.environmentId, workspaceId, environment.environmentApikey, environment.environmentApiServiceUrl!);
        setWorkspace(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Workspace not found or failed to load";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }, [workspaceId, environment]);
  
  
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
    };
  
    return (
      <WorkspaceContext.Provider value={value}>
        {children}
      </WorkspaceContext.Provider>
    );
  };