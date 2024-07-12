import axios from "axios";
import { NPM_REGISTRY_URL } from "constants/npmPlugins";
import { RemoteCompSource, RemoteCompInfo, NpmVersionMeta, NpmPackageMeta } from "types/remoteComp";

export interface RemoteCompNpmOptions {
  packageName: string;
  packageVersion: string;
}

export interface RemoteCompFileOptions {
  sourceUrl: string;
}

export function getRemoteCompType(
  source: RemoteCompSource,
  config: RemoteCompNpmOptions | RemoteCompFileOptions,
  compName: string
) {
  switch (source) {
    case "url":
      const { sourceUrl } = config as RemoteCompFileOptions;
      return `remote#${source}#${sourceUrl}#${compName}`;
    case "npm":
      const { packageName, packageVersion } = config as RemoteCompNpmOptions;
      return `remote#${source}#${packageName}@${packageVersion}#${compName}`;
    default:
      throw new Error(`Unknown remote source: ${source}`);
  }
}

export function parseCompType(compType: string) {
  const [type, source, sourceInfo, compName] = compType.split("#");
  const isRemote = type === "remote";

  if (!isRemote) {
    return {
      isRemote,
      compName: compType,
    };
  }

  switch (source) {
    case "url":
      return {
        compName,
        isRemote,
        source,
        sourceUrl: sourceInfo,
      } as RemoteCompInfo;
      
    case "npm":
      const [packageName, packageVersion] = sourceInfo.split("@");
      return {
        compName,
        isRemote,
        packageName,
        packageVersion,
        source: source as RemoteCompSource,
      } as RemoteCompInfo;

    default:
      throw new Error(`Unknown remote source: ${source}`);
  }
}

export async function getNpmPackageMeta(packageName: string) {
  const res = await axios.get<NpmPackageMeta>(`${NPM_REGISTRY_URL}/${packageName}/`);
  if (res.status >= 400) {
    return null;
  }
  return res.data;
}

export async function getUrlPackageMeta(url: string) {
  const res = await axios.get<NpmPackageMeta>(`${url}/package.json`);
  if (res.status >= 400) {
    return null;
  }
  return res.data;
}

export async function getLatestVersion(remoteInfo: RemoteCompInfo): Promise<NpmVersionMeta | null> {
  if (!remoteInfo.isRemote || remoteInfo.source !== "npm") {
    return null;
  }

  const packageMeta = await getNpmPackageMeta(remoteInfo.packageName);
  if (!packageMeta) {
    return null;
  }

  const latestVersion = packageMeta["dist-tags"].latest;
  return packageMeta.versions?.[latestVersion] || null;
}

export function normalizeNpmPackage(nameOrUrl: string) {
  const prefixReg = /^https?:\/\/(www.)?npmjs.(org|com)\/package\//;
  if (prefixReg.test(nameOrUrl)) {
    return nameOrUrl.replace(prefixReg, "");
  }

  return nameOrUrl;
}

export function validateNpmPackage(packageNameOrUrl: string) {
  const name = normalizeNpmPackage(packageNameOrUrl);
  return /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name);
}
