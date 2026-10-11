// config/workspace.config.tsx

import { DeployableItemConfig } from '../types/deployable-item.types';
import { Environment } from '../types/environment.types';
import { deployWorkspace } from '../services/workspace.service';
import { Workspace } from '../types/workspace.types';
import { trans } from "i18n";

export const workspaceConfig: DeployableItemConfig = {
  
  // Deploy configuration
  deploy: {
    singularLabel: trans("environments.config_singularLabels_workspace"),
    fields: [
      // Removed deployCredential field as workspaces don't need credential overwrite
    ],
    prepareParams: (item: Workspace, values: any, sourceEnv: Environment, targetEnv: Environment) => {
      if (!item.gid) {
        console.error('Missing workspace.gid when deploying workspace:', item);
      }
      
      return {
        envId: sourceEnv.environmentId,
        targetEnvId: targetEnv.environmentId,
        workspaceId: item.gid,
      };
    },
    execute: (params: any) => deployWorkspace(params)
  }
};