// hooks/useDeployableItems.ts
import { useState, useEffect, useCallback } from "react";
import { DeployableItem, BaseStats, DeployableItemConfig } from "../types/deployable-item.types";
import { Environment } from "../types/environment.types";

interface UseDeployableItemsState<T extends DeployableItem, S extends BaseStats> {
  items: T[];
  stats: S;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

export interface UseDeployableItemsResult<T extends DeployableItem, S extends BaseStats> {
  items: T[];
  stats: S;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  toggleManagedStatus: (item: T, checked: boolean) => Promise<boolean>;
  refreshItems: () => Promise<void>;
}

export const useDeployableItems = <T extends DeployableItem, S extends BaseStats>(
  config: DeployableItemConfig<T, S>,
  environment: Environment | null,
  additionalParams: Record<string, any> = {}
): UseDeployableItemsResult<T, S> => {
  // Create a default empty stats object based on the config's calculateStats method
  const createEmptyStats = (): S => {
    return config.calculateStats([]) as S;
  };
  
  const [state, setState] = useState<UseDeployableItemsState<T, S>>({
    items: [],
    stats: createEmptyStats(),
    loading: false,
    error: null,
    refreshing: false
  });

  const fetchItems = useCallback(async () => {
    if (!environment) return;

    // Check for required environment properties
    const missingProps = config.requiredEnvProps.filter(prop => !environment[prop as keyof Environment]);
    
    if (missingProps.length > 0) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: `Missing required configuration: ${missingProps.join(', ')}` 
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Call the fetchItems function from the config
      const items = await config.fetchItems({
        environment,
        ...additionalParams
      });
      
      // Calculate stats using the config's function
      const stats = config.calculateStats(items);
      
      // Update state with items and stats
      setState({
        items,
        stats,
        loading: false,
        error: null,
        refreshing: false
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: err instanceof Error ? err.message : "Failed to fetch items"
      }));
    }
  }, [environment, config]);

  useEffect(() => {
    if (environment) {
      fetchItems();
    }
  }, [environment, fetchItems]);

  const toggleManagedStatus = async (item: T, checked: boolean): Promise<boolean> => {
    if (!config.enableManaged) return false;
    if (!environment) return false;
    
    setState(prev => ({ ...prev, refreshing: true }));
    
    try {
      // Call the toggleManaged function from the config
      const success = await config.toggleManaged({
        item, 
        checked, 
        environment
      });
      
      if (success) {
        // Optimistically update the state
        setState(prev => {
          // Update items with the new managed status
          const updatedItems = prev.items.map(i =>
            i[config.idField] === item[config.idField] ? { ...i, managed: checked } : i
          );
          
          // Recalculate stats
          const stats = config.calculateStats(updatedItems);
          
          return {
            ...prev,
            items: updatedItems,
            stats,
            refreshing: false
          };
        });
      } else {
        setState(prev => ({ ...prev, refreshing: false }));
      }
      
      return success;
    } catch (err) {
      setState(prev => ({ ...prev, refreshing: false }));
      return false;
    }
  };

  const refreshItems = async (): Promise<void> => {
    setState(prev => ({ ...prev, refreshing: true }));
    await fetchItems();
  };

  return {
    ...state,
    toggleManagedStatus,
    refreshItems
  };
};