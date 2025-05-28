// config/apps.config.tsx
import { DeployableItemConfig } from '../types/deployable-item.types';
import { Environment } from '../types/environment.types';
import { deployApp } from '../services/apps.service';

import { App } from '../types/app.types';



// Define AppStats interface if not already defined


export const appsConfig: DeployableItemConfig = {
 

  deploy: {
    singularLabel: 'App',
    fields: [
      {
        name: 'updateDependenciesIfNeeded',
        label: 'Update Dependencies If Needed',
        type: 'checkbox',
        defaultValue: false
      },
      {
        name: 'publishOnTarget',
        label: 'Publish On Target',
        type: 'checkbox',
        defaultValue: false
      },
      {
        name: 'publicToAll',
        label: 'Public To All',
        type: 'checkbox',
        defaultValue: false
      },
      {
        name: 'publicToMarketplace',
        label: 'Public To Marketplace',
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