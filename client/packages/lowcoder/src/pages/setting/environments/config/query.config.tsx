// config/query.config.tsx
import { DeployableItemConfig } from '../types/deployable-item.types';
import { Query } from '../types/query.types';
import { deployQuery } from '../services/query.service';
import { Environment } from '../types/environment.types';




export const queryConfig: DeployableItemConfig = {
  
  deploy: {
    singularLabel: 'Query',
    fields: [
      {
        name: 'updateDependenciesIfNeeded',
        label: 'Update Dependencies If Needed',
        type: 'checkbox',
        defaultValue: false
      }
    ],
    prepareParams: (item: Query, values: any, sourceEnv: Environment, targetEnv: Environment) => {
      return {
        envId: sourceEnv.environmentId,
        targetEnvId: targetEnv.environmentId,
        queryId: item.id,
        updateDependenciesIfNeeded: values.updateDependenciesIfNeeded,
        queryGid: item.gid,
      };
    },
    execute: (params: any) => deployQuery(params)
  }
};