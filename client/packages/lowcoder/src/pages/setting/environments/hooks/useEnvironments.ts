import { useState, useEffect, useCallback } from 'react';
import { Environment } from '../types/environment.types';
import { getEnvironments } from '../services/environments.service';

/**
 * Interface for the state managed by this hook
 */
interface EnvironmentsState {
  environments: Environment[];
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for fetching and managing environments data
 * @returns Object containing environments data, loading state, error state, and refresh function
 */
export const useEnvironments = () => {
  // Initialize state with loading true
  const [state, setState] = useState<EnvironmentsState>({
    environments: [],
    loading: true,
    error: null,
  });

  /**
   * Function to fetch environments from the API
   */
  const fetchEnvironments = useCallback(async () => {
    // Set loading state
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Call the API service
      const environments = await getEnvironments();
      
      // Update state with fetched data
      setState({
        environments,
        loading: false,
        error: null,
      });
    } catch (error) {
      // Handle error state
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }));
    }
  }, []);

  // Fetch environments on component mount
  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  // Return state values and refresh function
  return {
    environments: state.environments,
    loading: state.loading,
    error: state.error,
    refresh: fetchEnvironments
  };
};