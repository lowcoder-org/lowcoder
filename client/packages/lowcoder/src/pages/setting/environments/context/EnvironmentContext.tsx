// src/contexts/EnvironmentContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useHistory } from "react-router-dom";
import {
  getEnvironmentById,
  getEnvironments,
} from "../services/environments.service";
import { Environment } from "../types/environment.types";

interface EnvironmentContextState {
  // Environment data
  environment: Environment | null;
  environments: Environment[];
  
  // Loading states
  isLoadingEnvironment: boolean;
  isLoadingEnvironments: boolean;
  
  // Error state
  error: string | null;
  
  // Functions
  refreshEnvironment: (envId?: string) => Promise<void>;
  refreshEnvironments: () => Promise<void>;
}

const EnvironmentContext = createContext<EnvironmentContextState | undefined>(undefined);

export const useEnvironmentContext = () => {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error(
      "useEnvironmentContext must be used within an EnvironmentProvider"
    );
  }
  return context;
};

interface ProviderProps {
  children: ReactNode;
}

export const EnvironmentProvider: React.FC<ProviderProps> = ({
  children,
}) => {
  // State for environment data
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);

  // Loading states
  const [isLoadingEnvironment, setIsLoadingEnvironment] = useState<boolean>(false);
  const [isLoadingEnvironments, setIsLoadingEnvironments] = useState<boolean>(true);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Function to fetch a specific environment by ID
  const fetchEnvironment = useCallback(async (environmentId?: string) => {
    // Only fetch if we have an environment ID
    if (!environmentId) {
      setEnvironment(null);
      return;
    }
    
    setIsLoadingEnvironment(true);
    setError(null);
    
    try {
      const data = await getEnvironmentById(environmentId);
      console.log("Environment data:", data);
      setEnvironment(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Environment not found or failed to load";
      setError(errorMessage);
    } finally {
      setIsLoadingEnvironment(false);
    }
  }, []);

  // Function to fetch all environments
  const fetchEnvironments = useCallback(async () => {
    setIsLoadingEnvironments(true);
    setError(null);
    
    try {
      const data = await getEnvironments();
      console.log("Environments data:", data);
      setEnvironments(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load environments list";
      setError(errorMessage);
    } finally {
      setIsLoadingEnvironments(false);
    }
  }, []);

  // Initial data loading - just fetch environments list
  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  // Create the context value
  const value: EnvironmentContextState = {
    environment,
    environments,
    isLoadingEnvironment,
    isLoadingEnvironments,
    error,
    refreshEnvironment: fetchEnvironment,
    refreshEnvironments: fetchEnvironments,
  };

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
};