import { Workspace } from "../types/workspace.types";
export interface ManagedOrg {
    orgGid: string;
    environmentId: string;
    orgName: string;
    orgTags: string[];
    createdAt: string;
    updatedAt: string;
  }
  

  export type MergedWorkspace = Workspace & { managed: boolean };
