import { UICompManifest } from "comps/uiCompRegistry";
import { CompConstructor } from "lowcoder-core";

export type RemoteCompSource = "npm" | "bundle";
export interface LowcoderCompMeta extends Omit<UICompManifest, "comp" | "icon"> {
  icon?: string;
}

export interface LowcoderMeta {
  entry: string;
  description: string;
  comps: Record<string, LowcoderCompMeta>;
}

export interface NpmVersionMeta {
  name: string;
  version: string;
  lowcoder: LowcoderMeta;
}

export interface NpmPackageMeta {
  name: string;
  versions: Record<string, NpmVersionMeta>;
  "dist-tags": {
    latest: string;
  };
}

export interface RemoteCompInfo {
  source: RemoteCompSource;
  compName: string;
  isRemote: true;
  packageName: string;
  packageVersion?: string;
}

export type RemoteCompLoader<T = RemoteCompInfo> = (info: T) => Promise<CompConstructor | null>;
