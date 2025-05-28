// config/workspace.config.tsx

import { DeployableItemConfig } from '../types/deployable-item.types';
import { Environment } from '../types/environment.types';
import { deployWorkspace } from '../services/workspace.service';
import { Workspace } from '../types/workspace.types';



export const workspaceConfig: DeployableItemConfig = {
  
  // Deploy configuration
  deploy: {
    singularLabel: 'Workspace',
    fields: [
      {
        name: 'deployCredential',
        label: 'Overwrite Credentials',
        type: 'checkbox',
        defaultValue: false
      }
    ],
    prepareParams: (item: Workspace, values: any, sourceEnv: Environment, targetEnv: Environment) => {
      if (!item.gid) {
        console.error('Missing workspace.gid when deploying workspace:', item);
      }
      console.log('item.gid', item.gid);
      
      return {
        envId: sourceEnv.environmentId,
        targetEnvId: targetEnv.environmentId,
        workspaceId: item.gid,
        deployCredential: values.deployCredential ?? false
      };
    },
    execute: (params: any) => deployWorkspace(params)
  }
};