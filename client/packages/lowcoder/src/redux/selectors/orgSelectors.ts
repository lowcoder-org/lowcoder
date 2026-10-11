import { Org } from "@lowcoder-ee/constants/orgConstants";
import { AppState } from "redux/reducers";
import { getHomeOrg } from "./applicationSelector";

export const getOrgUsers = (state: AppState) => {
  return state.ui.org.orgUsers;
};

export const getOrgGroups = (state: AppState) => {
  return state.ui.org.orgGroups;
};

export const getOrgUserStats = (state: AppState) => {
  return state.ui.org.orgUserStats;
};

export const getFetchOrgGroupsFinished = (state: AppState) => {
  return state.ui.org.fetchOrgGroupsFinished;
};

export const getOrgCreateStatus = (state: AppState) => {
  return state.ui.org.orgCreateStatus;
};

export const getOrgApiUsage = (state: AppState) => {
  return state.ui.org.apiUsage;
}

export const getOrgLastMonthApiUsage = (state: AppState) => {
  return state.ui.org.lastMonthApiUsage;
}

export const getCurrentOrg = (state: AppState): Pick<Org, 'id' | 'name'> | undefined => {
  const homeOrg = getHomeOrg(state);
  if (!homeOrg) {
    return undefined;
  }
  
  return {
    id: homeOrg.id,
    name: homeOrg.name,
  };
};