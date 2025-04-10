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
  import { getEnvironmentById } from "../services/environments.service"; 
  import { Environment } from "../types/environment.types"; 
  
  interface EnvironmentContextType {
    environment: Environment | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
  }
  
  const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);
  
  export const useEnvironmentContext = () => {
    const context = useContext(EnvironmentContext);
    if (!context) {
      throw new Error("useEnvironmentContext must be used within an EnvironmentProvider");
    }
    return context;
  };
  
  interface ProviderProps {
    envId: string;
    children: ReactNode;
  }
  
  export const EnvironmentProvider: React.FC<ProviderProps> = ({ envId, children }) => {
    const [environment, setEnvironment] = useState<Environment | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const history = useHistory();
  
    const fetchEnvironment = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getEnvironmentById(envId);
        console.log("Environment data:", data);
        setEnvironment(data);
      } catch (err) {
        setError("Environment not found or failed to load");
        history.push("/404"); // or a centralized error route
      } finally {
        setLoading(false);
      }
    }, [envId, history]);
  
    useEffect(() => {
      fetchEnvironment();
    }, [fetchEnvironment]);
  
    const value: EnvironmentContextType = {
      environment,
      loading,
      error,
      refresh: fetchEnvironment,
    };
  
    return (
      <EnvironmentContext.Provider value={value}>
        {children}
      </EnvironmentContext.Provider>
    );
  };
  