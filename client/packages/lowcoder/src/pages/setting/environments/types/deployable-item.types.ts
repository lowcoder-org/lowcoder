// types/deployable-item.types.ts
import { Environment } from './environment.types';



export interface DeployField {
  name: string;
  label: string;
  type: 'checkbox' | 'select' | 'input';
  defaultValue?: any;
  required?: boolean;
  options?: Array<{label: string, value: any}>; // For select fields
}
// Configuration for each deployable item type
export interface DeployableItemConfig {
  deploy: {
    singularLabel: string;
    fields: DeployField[];
    prepareParams: (item: any, values: any, sourceEnv: Environment, targetEnv: Environment) => any;
    execute: (params: any) => Promise<any>;
  };
}