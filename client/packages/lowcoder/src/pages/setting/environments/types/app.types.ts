
export interface App  {
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

  export interface AppStats {
    total: number;
    published: number;
    managed: number;
    unmanaged: number;
  }