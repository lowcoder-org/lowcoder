// config/apps.config.tsx
import { DeployableItemConfig } from '../types/deployable-item.types';
import { Environment } from '../types/environment.types';
import { deployApp } from '../services/apps.service';
import { trans } from "i18n";
import { App } from '../types/app.types';

// Define AppStats interface if not already defined


export const appsConfig: DeployableItemConfig = {
 

  deploy: {
    singularLabel: trans("environments.config_singularLabels_app"),
    fields: [
      {
        name: 'updateDependenciesIfNeeded',
        label: trans("environments.config_fields_updateDependenciesIfNeeded"),
        type: 'checkbox',
        defaultValue: false
      },
      {
        name: 'publishOnTarget',
        label: trans("environments.config_fields_publishOnTarget"),
        type: 'checkbox',
        defaultValue: false
      },
      {
        name: 'publicToAll',
        label: trans("environments.config_fields_publicToAll"),
        type: 'checkbox',
        defaultValue: false
      },
      {
        name: 'publicToMarketplace',
        label: trans("environments.config_fields_publicToMarketplace"),
        type: 'checkbox',
        defaultValue: false
      },
      {
        name: 'deployCredential',
        label: trans("environments.config_fields_overwriteCredentials"),
        type: 'checkbox',
        defaultValue: false
      }
    ],
    prepareParams: (item: App, values: any, sourceEnv: Environment, targetEnv: Environment) => {
      return {
        envId: sourceEnv.environmentId,
        targetEnvId: targetEnv.environmentId,
        applicationId: item.applicationId,
        updateDependenciesIfNeeded: values.updateDependenciesIfNeeded,
        publishOnTarget: values.publishOnTarget,
        publicToAll: values.publicToAll,
        publicToMarketplace: values.publicToMarketplace,
        applicationGid: item.applicationGid,
        deployCredential: values.deployCredential ?? false
      };
    },
    execute: (params: any) => deployApp(params)
  }
};