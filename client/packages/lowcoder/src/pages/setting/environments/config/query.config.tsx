// config/query.config.tsx
import { DeployableItemConfig } from '../types/deployable-item.types';
import { Query } from '../types/query.types';
import { deployQuery } from '../services/query.service';
import { Environment } from '../types/environment.types';
import { trans } from "i18n";

export const queryConfig: DeployableItemConfig = {
  
  deploy: {
    singularLabel: trans("environments.config_singularLabels_query"),
    fields: [
      {
        name: 'deployCredential',
        label: trans("environments.config_fields_overwriteCredentials"),
        type: 'checkbox',
        defaultValue: false
      }
    ],
    prepareParams: (item: Query, values: any, sourceEnv: Environment, targetEnv: Environment) => {
      return {
        envId: sourceEnv.environmentId,
        targetEnvId: targetEnv.environmentId,
        queryId: item.id,
        queryGid: item.gid,
        deployCredential: values.deployCredential ?? false
      };
    },
    execute: (params: any) => deployQuery(params)
  }
};