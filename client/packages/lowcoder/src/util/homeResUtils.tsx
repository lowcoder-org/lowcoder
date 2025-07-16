import {
  AllTypesIcon,
  ApplicationDocIcon,
  FolderIcon,
  MobileAppIcon,
  ModuleDocIcon,
  NavDocIcon,
} from "lowcoder-design";
import { HomeResTypeEnum } from "../types/homeRes";
import {
  APPLICATION_VIEW_URL,
  APPLICATION_MARKETPLACE_VIEW_URL,
  buildFolderUrl,
  ALL_APPLICATIONS_URL
} from "../constants/routesURL";
import history from "./history";
import { trans } from "../i18n";
import { FunctionComponent } from "react";

export const HomeResInfo: Record<
  HomeResTypeEnum,
  { name: string; icon: FunctionComponent<any>; desc?: string }
> = {
  [HomeResTypeEnum.All]: {
    name: trans("home.all"),
    icon: AllTypesIcon,
  },
  [HomeResTypeEnum.Application]: {
    name: trans("home.app"),
    icon: ApplicationDocIcon,
  },
  [HomeResTypeEnum.Module]: {
    name: trans("home.module"),
    icon: ModuleDocIcon,
  },
  [HomeResTypeEnum.Navigation]: {
    name: trans("home.navigation"),
    icon: NavDocIcon,
  },
  [HomeResTypeEnum.NavLayout]: {
    name: trans("home.navLayout"),
    icon: NavDocIcon,
    desc: trans("home.navLayoutDesc"),
  },
  [HomeResTypeEnum.Folder]: {
    name: trans("home.folder"),
    icon: FolderIcon,
  },
  [HomeResTypeEnum.MobileTabLayout]: {
    name: trans("home.mobileTabLayout"),
    icon: NavDocIcon,
    desc: trans("home.mobileTabLayoutDesc"),
  },
};

export const handleAppEditClick = (e: any, id: string): void => {
  /* if (e?.metaKey) {
    window.open(APPLICATION_VIEW_URL(id, "edit"), '_blank');
  } else {
    history.push(APPLICATION_VIEW_URL(id, "edit"), '_blank');
  } */
  window.open(history.createHref({pathname: APPLICATION_VIEW_URL(id, "edit")}), '_blank');
};

export const handleAppViewClick = (id: string) => window.open(history.createHref({pathname: APPLICATION_VIEW_URL(id, "view")}), '_blank');

export const handleMarketplaceAppViewClick = (id: string, isLocalMarketplace?: boolean) => isLocalMarketplace == true ? window.open(history.createHref({pathname: APPLICATION_VIEW_URL(id, "view_marketplace")}), '_blank') : window.open(history.createHref({pathname: APPLICATION_MARKETPLACE_VIEW_URL(id, "view_marketplace")}), '_blank');

export const handleFolderViewClick = (id: string) => history.push(buildFolderUrl(id));

export const backFolderViewClick = () => history.push(ALL_APPLICATIONS_URL);