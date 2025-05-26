// client/packages/lowcoder/src/pages/setting/environments/context/EnvironmentContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { getEnvironmentsWithLicenseStatus } from "../services/environments.service";
import { Environment } from "../types/environment.types";

interface EnvironmentContextState {
  // Environments list data
  environments: Environment[];
  
  // Loading state
  isLoading: boolean;
  
  // Error state
  error: string | null;
  
  // Functions
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
  // State for environments list
  const [environments, setEnvironments] = useState<Environment[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Function to fetch all environments
  const fetchEnvironments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getEnvironmentsWithLicenseStatus();
      setEnvironments(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch environments';
      messageInstance.error(errorMessage);
      console.error('Error fetching environments:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  // Create the context value
  const value: EnvironmentContextState = {
    environments,
    isLoading,
    error,
    refreshEnvironments: fetchEnvironments,
  };

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
};