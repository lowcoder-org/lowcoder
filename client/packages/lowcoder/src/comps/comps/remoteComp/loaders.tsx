import { PUBLIC_APP_ID } from "@lowcoder-ee/constants/publicApp";
import { sdkConfig } from "@lowcoder-ee/constants/sdkConfig";
import { ASSETS_BASE_URL, NPM_PLUGIN_ASSETS_BASE_URL } from "constants/npmPlugins";
import { trans } from "i18n";
import { CompConstructor } from "lowcoder-core";
import {
  RemoteCompInfo,
  RemoteCompLoader,
  RemoteCompSource,
} from "types/remoteComp";

async function npmLoader(
  {
    appId,
    ...remoteInfo
  }: RemoteCompInfo & {appId?: string}
): Promise<CompConstructor | null> {

  // Falk: removed "packageVersion = "latest" as default value fir packageVersion - to ensure no automatic version jumping.
  const localPackageVersion = remoteInfo.packageVersion || "latest";
  const { packageName, packageVersion, compName } = remoteInfo;

  const pluginBaseUrl = REACT_APP_BUNDLE_TYPE === 'sdk' && sdkConfig.baseURL
    ? `${sdkConfig.baseURL}/${ASSETS_BASE_URL}`
    : NPM_PLUGIN_ASSETS_BASE_URL;

  const applicationId = (!appId || appId && appId === PUBLIC_APP_ID) ? 'none' : appId;

  const entry = `${pluginBaseUrl}/${applicationId}/${packageName}@${localPackageVersion}/index.js`;

  try {
    const module = await import(
      /* @vite-ignore */
      /* webpackIgnore: true */
      entry
    );
    // console.log("Entry 1", module);
    const comp = module.default?.[compName];
    if (!comp) {
      throw new Error(trans("npm.compNotFound", { compName }));
    }
    return comp;
  } catch (e) {
    console.log("Error during remote component loading", e);
    throw new Error(trans("npm.compNotFound", { compName }));
  }
}

async function bundleLoader(
  remoteInfo: RemoteCompInfo
): Promise<CompConstructor | null> {
  const { packageName, packageVersion = "latest", compName } = remoteInfo;
  const entry = `/${packageName}/${packageVersion}/index.js?v=${REACT_APP_COMMIT_ID}`;
  const module = await import(
    /* @vite-ignore */
    /* webpackIgnore: true */
    entry
  );
  const comp = module?.default?.[compName];
  if (!comp) {
    throw new Error(trans("npm.compNotFound", { compName }));
  }
  return comp;
}

export const loaders: Record<RemoteCompSource, RemoteCompLoader<RemoteCompInfo & {appId?: string}>> = {
  npm: npmLoader,
  bundle: bundleLoader,
};
