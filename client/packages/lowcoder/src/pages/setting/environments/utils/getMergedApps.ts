import { App } from '../types/app.types';


export const getMergedApps = (standardApps: App[], managedApps: any[]): App[] => {
  return standardApps.map((app) => ({
    ...app,
    managed: managedApps.some((managedApp) => managedApp.appGid === app.applicationGid),
  }));
};
