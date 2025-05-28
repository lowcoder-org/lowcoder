// config/data-sources.config.tsx
import React from 'react';
import { DeployableItemConfig } from '../types/deployable-item.types';
import { DataSource} from '../types/datasource.types';
import { Environment } from '../types/environment.types';
import { deployDataSource, DataSourceStats } from '../services/datasources.service';



export const dataSourcesConfig: DeployableItemConfig = {
  deploy: {
    singularLabel: 'Data Source',
    fields: [
      {
        name: 'updateDependenciesIfNeeded',
        label: 'Update Dependencies If Needed',
        type: 'checkbox',
        defaultValue: false
      },
      {
        name: 'deployCredential',
        label: 'Overwrite Credentials',
        type: 'checkbox',
        defaultValue: false
      }
    ],
    prepareParams: (item: DataSource, values: any, sourceEnv: Environment, targetEnv: Environment) => {
      return {
        envId: sourceEnv.environmentId,
        targetEnvId: targetEnv.environmentId,
        datasourceId: item.id,
        updateDependenciesIfNeeded: values.updateDependenciesIfNeeded,
        datasourceGid: item.gid,
        deployCredential: values.deployCredential ?? false
      };
    },
    execute: (params: any) => deployDataSource(params)
  }
};