import { DeployableItem, BaseStats } from "./deployable-item.types";

export interface App extends DeployableItem {
    orgId: string;
    applicationId: string;
    applicationGid: string;
    name: string;
    createAt: number;
    createBy: string;
    role: string;
    applicationType: number;
    applicationStatus: string;
    folderId: string | null;
    lastViewTime: number;
    lastModifyTime: number;
    lastEditedAt: number;
    publicToAll: boolean;
    publicToMarketplace: boolean;
    agencyProfile: boolean;
    editingUserId: string | null;
    title: string;
    description: string;
    category: string;
    icon: string;
    published: boolean;
    folder: boolean;
    managed?: boolean;
    id: string
  }

  export interface AppStats extends BaseStats {
    published: number
  }