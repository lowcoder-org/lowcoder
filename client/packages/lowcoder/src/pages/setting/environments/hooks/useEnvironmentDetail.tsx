import { useState, useEffect, useCallback } from 'react';
import { getEnvironmentById } from '../services/environments.service';
import { Environment } from '../types/environment.types';

/**
 * Custom hook to fetch and manage environment detail data
 * @param id - Environment ID to fetch
 * @returns Object containing environment data, loading state, error state, and refresh function
 */
export const useEnvironmentDetail = (id: string) => {
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch environment data
  const fetchEnvironmentData = useCallback(async () => {
    if (!id) {
      setError('No environment ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await getEnvironmentById(id);
      setEnvironment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch environment details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch environment data on mount and when ID changes
  useEffect(() => {
    fetchEnvironmentData();
  }, [fetchEnvironmentData]);

  // Return the state and a function to refresh data
  return {
    environment,
    loading,
    error,
    refresh: fetchEnvironmentData,
  };
};