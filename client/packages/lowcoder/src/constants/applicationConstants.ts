import type { JSONValue } from "util/jsonTypes";
import type { ExtraActionType } from "lowcoder-core";
import type { CommonSettingResponseData } from "api/commonSettingApi";
import type { PermissionItem } from "../components/PermissionDialog/PermissionList";
import type { UiLayoutType } from "comps/comps/uiComp";

// To be same with HomeResTypeEnum
export enum AppTypeEnum {
  Application = 1,
  Module = 2,
  NavLayout = 3,
  MobileTabLayout = 6,
  // Folder = 4,
  // Mobile = 5,
  // WorkflowScreen = 7,
  // Bundle = 8,
}

export enum ApplicationCategoriesEnum {
  SUPPORT = "Support",
  BUSINESS = "Business",
  DASHBOARD = "Dashboards & Reporting",
  SLIDES = "Slides & Presentations",
  WEBSITE = "Website",
  SHOPPING = "Shopping & Ecommerce",
  TOOLS = "Tools & Internal Apps",
  COMMUNICATION = "Communication",
  PRODUCTIVITY = "Productivity",
  EDUCATION = "Education",
  SOCIAL_MEDIA = "Social Media",
  ENTERTAINMENT = "Entertainment",
  FINANCE = "Finance",
  HEALTH_FITNESS = "Health & Fitness",
  LIFESTYLE = "Lifestyle",
  NEWS_MAGAZINES = "News & Magazines",
  PERSONALIZATION = "Personalization",
  PHOTOGRAPHY = "Photography",
  SPORTS = "Sports",
  TRAVEL_LOCAL = "Travel & Local",
  WEATHER = "Weather",
  MEDICAL = "Medical",
  MUSIC_AUDIO = "Music & Audio",
  AUTO_VEHICLES = "Auto & Vehicles",
  ART_DESIGN = "Art & Design",
  BEAUTY = "Beauty",
  DATING = "Dating",
  EVENTS = "Events",
  FOOD_DRINK = "Food & Drink",
  HOUSE_HOME = "House & Home",
  PARENTING = "Parenting",
  MAPS_NAVIGATION = "Maps & Navigation",
};

export const AppUILayoutType: Record<AppTypeEnum, UiLayoutType> = {
  [AppTypeEnum.Application]: "normal",
  [AppTypeEnum.Module]: "module",
  [AppTypeEnum.NavLayout]: "nav",
  [AppTypeEnum.MobileTabLayout]: "mobileTabLayout",
  // [AppTypeEnum.WorkflowScreen]: "module",
  // [AppTypeEnum.Slide]: "normal",
};

export type ApplicationDSLType = "editing" | "published" | "view_marketplace";
export type ApplicationRoleType = "viewer" | "editor" | "owner";
export type ApplicationPermissionType = "USER" | "GROUP" | "ORG_ADMIN";

export interface ApplicationExtra {
  moduleHeight?: number;
  moduleWidth?: number;
  layers?: boolean;
}

export interface ApplicationMeta {
  name: string;
  applicationType: AppTypeEnum;
  applicationId: string;
  containerSize?: { height: number; width: number };
  createBy: string;
  createAt: number;
  creatorEmail?: string;
  title?: string;
  description?: string;
  image?: string;
  category?: ApplicationCategoriesEnum;
  showheader?: boolean;
  orgId: string;
  role: ApplicationRoleType;
  extra: ApplicationExtra;
  lastModifyTime: number; // may be 0
  lastViewTime: number;
  folderId: string;
  folder: false;
  isLocalMarketplace?: boolean;
  applicationStatus: "NORMAL" | "RECYCLED" | "DELETED";
  editingUserId: string | null;
  lastEditedAt: number;
}

export interface FolderMeta {
  folderId: string;
  parentFolderId?: string;
  orgId: string;
  name: string;
  createBy: string;
  createAt: number;
  manageable: boolean;
  lastViewTime: number;
  folder: true;
  subApplications?: ApplicationMeta[];
  subFolders?: FolderMeta[];
}

export interface ApplicationDetail {
  applicationInfoView: ApplicationMeta;
  applicationDSL: JSONValue;
  moduleDSL: Record<string, JSONValue>;
  orgCommonSettings?: CommonSettingResponseData;
  templateId?: string;
}

export type AppInviteInfo = {
  invitationCode: string;
  applicationId: string;
  role: ApplicationRoleType;
};

export interface AppPermissionInfo {
  orgName: string;
  creatorId: string;
  permissions: PermissionItem[];
  invitationCodes: AppInviteInfo[];
  publicToAll: boolean;
  publicToMarketplace: boolean;
}

// adding viewMode for marketplace and adminMode for Admin area use
export type AppViewMode = "edit" | "preview" | "view" | "view_marketplace" | "admin";

export type AppPathParams = {
  viewMode: AppViewMode;
  applicationId: string;
  appPageId: string;
};

export type AppSnapshotContext = {
  operations: {
    compType?: string;
    compName: string;
    oldName?: string;
    operation: ExtraActionType;
    snapshotCreateTime?: number;
  }[];
};

export type AppSnapshot = {
  snapshotId: string;
  context: AppSnapshotContext;
  userId: string;
  userName: string;
  userAvatar: string;
  createTime: number;
};

export type AppSnapshotList = {
  count: number; // total count
  list: AppSnapshot[];
};

export type MarketplaceType = "local" | "lowcoder";
