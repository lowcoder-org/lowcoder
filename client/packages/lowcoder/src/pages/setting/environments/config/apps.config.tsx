// config/apps.config.tsx
import { DeployableItemConfig } from '../types/deployable-item.types';
import { Environment } from '../types/environment.types';
import { deployApp } from '../services/apps.service';
import { trans } from "i18n";
import { App } from '../types/app.types';

// Define AppStats interface if not already defined


export const appsConfig: DeployableItemConfig = {
 

  deploy: {
    singularLabel: trans("enterprise.environments.config.singularLabels.app"),
    fields: [
      {
        name: 'updateDependenciesIfNeeded',
        label: trans("enterprise.environments.config.fields.updateDependenciesIfNeeded"),
        type: 'checkbox',
        defaultValue: false
      },
      {
        name: 'publishOnTarget',
        label: trans("enterprise.environments.config.fields.publishOnTarget"),
        type: 'checkbox',
        defaultValue: false
      },
      {
        name: 'publicToAll',
        label: trans("enterprise.environments.config.fields.publicToAll"),
        type: 'checkbox',
        defaultValue: false
      },
      {
        name: 'publicToMarketplace',
        label: trans("enterprise.environments.config.fields.publicToMarketplace"),
        type: 'checkbox',
        defaultValue: false
      },
      {
        name: 'deployCredential',
        label: trans("enterprise.environments.config.fields.overwriteCredentials"),
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