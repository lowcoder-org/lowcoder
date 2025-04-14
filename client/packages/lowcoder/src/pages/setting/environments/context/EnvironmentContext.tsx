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
  environment: Environment | null;
  environments: Environment[];
  isLoadingEnvironment: boolean;
  isLoadingEnvironments: boolean;
  error: string | null;
}

const EnvironmentContext = createContext<EnvironmentContextState | undefined>(
  undefined
);

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
  envId: string;
  children: ReactNode;
}

export const EnvironmentProvider: React.FC<ProviderProps> = ({
  envId,
  children,
}) => {
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);

  // Separate loading states
  const [isLoadingEnvironment, setIsLoadingEnvironment] =
    useState<boolean>(true);
  const [isLoadingEnvironments, setIsLoadingEnvironments] =
    useState<boolean>(true);

  const [error, setError] = useState<string | null>(null);
  const history = useHistory();

  const fetchEnvironment = useCallback(async () => {
    setIsLoadingEnvironment(true);
    try {
      const data = await getEnvironmentById(envId);
      console.log("Environment data:", data);
      setEnvironment(data);
    } catch (err) {
      setError("Environment not found or failed to load");
      history.push("/404"); // or a centralized error route
    } finally {
      setIsLoadingEnvironment(false);
    }
  }, [envId, history]);

  const fetchEnvironments = useCallback(async () => {
    setIsLoadingEnvironments(true);
    try {
      const data = await getEnvironments();
      console.log("Environments data:", data);
      setEnvironments(data);
    } catch (err) {
      setError("Failed to load environments list");
    } finally {
      setIsLoadingEnvironments(false);
    }
  }, []);

  useEffect(() => {
    fetchEnvironment();
    fetchEnvironments();
  }, [fetchEnvironment, fetchEnvironments]);


  const value: EnvironmentContextState = {
    environment,
    environments,
    isLoadingEnvironment,
    isLoadingEnvironments,
    error,
  };

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
};
