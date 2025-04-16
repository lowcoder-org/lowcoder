// types/deployable-item.types.ts
import { ReactNode } from 'react';
import { Environment } from './environment.types';
import { ColumnType } from 'antd/lib/table';


// Base interface for all deployable items
export interface AuditConfig {
  enabled: boolean;
  icon?: React.ReactNode;
  label?: string;
  tooltip?: string;
  getAuditUrl: (item: any, environment: Environment, additionalParams?: Record<string, any>) => string;
}
export interface DeployableItem {
  id: string;
  name: string;
  managed?: boolean;
  [key: string]: any; // Allow for item-specific properties
}

// Workspace specific implementation
export interface Workspace extends DeployableItem {
  id: string;
  name: string;
  role?: string;
  creationDate?: number;
  status?: string;
  managed?: boolean;
  gid?: string;
}

// Stats interface that can be extended for specific item types
// Base interface for stats
export interface BaseStats {
  total: number;
  managed: number;
  unmanaged: number;
  [key: string]: any;
}
export interface WorkspaceStats extends BaseStats {}


export interface DeployField {
  name: string;
  label: string;
  type: 'checkbox' | 'select' | 'input';
  defaultValue?: any;
  required?: boolean;
  options?: Array<{label: string, value: any}>; // For select fields
}
// Configuration for each deployable item type
export interface DeployableItemConfig<T extends DeployableItem, S extends BaseStats> {
  // Identifying info
  type: string; // e.g., 'workspaces'
  singularLabel: string; // e.g., 'Workspace'
  pluralLabel: string; // e.g., 'Workspaces'
  
  // UI elements
  icon: ReactNode; // Icon to use in stats
  
  // Navigation
  buildDetailRoute: (params: Record<string, string>) => string;
  
  // Configuration
  requiredEnvProps: string[]; // Required environment properties
  
  // Customization
  idField: string; // Field to use as the ID (e.g., 'id')
  
  // Stats
  renderStats: (stats: S) => ReactNode;
  calculateStats: (items: T[]) => S;

  // Original columns (will be deprecated)
  columns: ColumnType<T>[];
  
  // New method to generate columns
  getColumns: (params: {
    environment: Environment;
    refreshing: boolean;
    onToggleManaged?: (item: T, checked: boolean) => Promise<boolean>;
    openDeployModal?: (item: T, config: DeployableItemConfig<T, S>, environment: Environment) => void;
    additionalParams?: Record<string, any>;
  }) => ColumnType<T>[];

  // Add audit configuration
  audit?: AuditConfig;
  
  
  
  // Deployable configuration
  enableManaged: boolean;
  
  // Service functions
  fetchItems: (params: { environment: Environment, [key: string]: any }) => Promise<T[]>;
  toggleManaged: (params: { item: T; checked: boolean; environment: Environment }) => Promise<boolean>;

  deploy?: {
    enabled: boolean;
    fields: DeployField[];
    prepareParams: (item: T, values: any, sourceEnv: Environment, targetEnv: Environment) => any;
    execute: (params: any) => Promise<any>;
  };
}