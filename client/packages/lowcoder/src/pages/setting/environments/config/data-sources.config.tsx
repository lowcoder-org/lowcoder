// config/data-sources.config.tsx
import React from 'react';
import { DeployableItemConfig } from '../types/deployable-item.types';
import { DataSource} from '../types/datasource.types';
import { Environment } from '../types/environment.types';
import { deployDataSource, DataSourceStats } from '../services/datasources.service';
import { trans } from "i18n";

export const dataSourcesConfig: DeployableItemConfig = {
  deploy: {
    singularLabel: trans("environments.config_singularLabels_dataSource"),
    fields: [
      {
        name: 'deployCredential',
        label: trans("environments.config_fields_overwriteCredentials"),
        type: 'checkbox',
        defaultValue: false
      }
    ],
    prepareParams: (item: DataSource, values: any, sourceEnv: Environment, targetEnv: Environment) => {
      return {
        envId: sourceEnv.environmentId,
        targetEnvId: targetEnv.environmentId,
        datasourceId: item.id,
        datasourceGid: item.gid,
        deployCredential: values.deployCredential ?? false
      };
    },
    execute: (params: any) => deployDataSource(params)
  }
};