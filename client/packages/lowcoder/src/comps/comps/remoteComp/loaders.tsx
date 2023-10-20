import { NPM_PLUGIN_ASSETS_BASE_URL } from "constants/npmPlugins";
import { trans } from "i18n";
import { CompConstructor } from "lowcoder-core";
import { RemoteCompInfo, RemoteCompLoader, RemoteCompSource } from "types/remoteComp";

async function npmLoader(remoteInfo: RemoteCompInfo): Promise<CompConstructor | null> {
  // log.info("load npm plugin:", remoteInfo);
  const { packageName, packageVersion = "latest", compName } = remoteInfo;
  const entry = `${NPM_PLUGIN_ASSETS_BASE_URL}/${packageName}@${packageVersion}/index.js`;
  console.log("Entry", entry);
  try {
    const module = await import(/* webpackIgnore: true */ entry);
    // let module = moduleGlobe;
    // if (packageName !== "openblocks-comps-workmeet") {
    //   module = await import(entry);
    // }
    console.log("Entry 1", module);
    const comp = module.default?.[compName];
    if (!comp) {
      throw new Error(trans("npm.compNotFound", { compName }));
    }
    return comp;
  } catch (e) {
    console.log("eeeee", e);
    throw new Error(trans("npm.compNotFound", { compName }));
  }
}

async function bundleLoader(remoteInfo: RemoteCompInfo): Promise<CompConstructor | null> {
  const { packageName, packageVersion = "latest", compName } = remoteInfo;
  const entry = `/${packageName}/${packageVersion}/index.js?v=${REACT_APP_COMMIT_ID}`;
  const module = await import(/* webpackIgnore: true */ entry);
  const comp = module.default?.[compName];
  if (!comp) {
    throw new Error(trans("npm.compNotFound", { compName }));
  }
  return comp;
}

export const loaders: Record<RemoteCompSource, RemoteCompLoader> = {
  npm: npmLoader,
  bundle: bundleLoader,
};
