// client/packages/lowcoder/src/pages/setting/environments/context/SingleEnvironmentContext.tsx
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
  import { useDispatch } from "react-redux";
  import { fetchEnvironments } from "redux/reduxActions/enterpriseActions";
  import { getEnvironmentById, updateEnvironment } from "../services/environments.service";
  import { Environment } from "../types/environment.types";

  interface SingleEnvironmentContextState {
    // Environment data
    environment: Environment | null;
    
    // Loading states
    isLoading: boolean;
    
    // Error state
    error: string | null;
    
    // Functions
    refreshEnvironment: () => Promise<void>;
    updateEnvironmentData: (data: Partial<Environment>) => Promise<Environment>;
  }
  
  const SingleEnvironmentContext = createContext<SingleEnvironmentContextState | undefined>(undefined);
  
  export const useSingleEnvironmentContext = () => {
    const context = useContext(SingleEnvironmentContext);
    if (!context) {
      throw new Error(
        "useSingleEnvironmentContext must be used within a SingleEnvironmentProvider"
      );
    }
    return context;
  };
  
  interface ProviderProps {
    children: ReactNode;
    environmentId?: string; // Optional prop-based ID
  }
  
  export const SingleEnvironmentProvider: React.FC<ProviderProps> = ({
    children,
    environmentId: propEnvironmentId,
  }) => {
    // Get environmentId from URL params if not provided as prop
    const { envId } = useParams<{ envId: string }>();
    const environmentId = propEnvironmentId || envId;
    
    // Use Redux dispatch to refresh environments instead of context
    const dispatch = useDispatch();
    
    // State for environment data
    const [environment, setEnvironment] = useState<Environment | null>(null);
  
    // Loading states
    const [isLoading, setIsLoading] = useState<boolean>(true);
  
    // Error state
    const [error, setError] = useState<string | null>(null);
  
    // Function to fetch environment by ID
    const fetchEnvironment = useCallback(async () => {
      // Only fetch if we have an environment ID
      if (!environmentId) {
        setEnvironment(null);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getEnvironmentById(environmentId);
        setEnvironment(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Environment not found or failed to load";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }, [environmentId]);
  
    // Function to update the environment
    const updateEnvironmentData = useCallback(async (
      data: Partial<Environment>
    ): Promise<Environment> => {
      if (!environmentId || !environment) {
        throw new Error("No environment selected");
      }
      
      try {
        const updatedEnv = await updateEnvironment(environmentId, data);
        
        // Show success message
        messageInstance.success("Environment updated successfully");
        
        // Refresh both the single environment and environments list
        await fetchEnvironment(); // Refresh the current environment
        dispatch(fetchEnvironments()); // Refresh the environments list using Redux
        
        return updatedEnv;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update environment";
        messageInstance.error(errorMessage);
        throw err;
      }
    }, [environment, environmentId, fetchEnvironment, dispatch]);
  
    // Load environment data when the component mounts or environmentId changes
    useEffect(() => {
      fetchEnvironment();
    }, [fetchEnvironment]);
  
    // Create the context value
    const value: SingleEnvironmentContextState = {
      environment,
      isLoading,
      error,
      refreshEnvironment: fetchEnvironment,
      updateEnvironmentData,
    };
  
    return (
      <SingleEnvironmentContext.Provider value={value}>
        {children}
      </SingleEnvironmentContext.Provider>
    );
  };