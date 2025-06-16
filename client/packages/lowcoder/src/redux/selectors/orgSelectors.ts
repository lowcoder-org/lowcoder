import { Org } from "@lowcoder-ee/constants/orgConstants";
import { getUser } from "./usersSelectors";
import { AppState } from "redux/reducers";

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

// Add to usersSelectors.ts
export const getWorkspaces = (state: AppState) => state.ui.users.workspaces;

export const getCurrentOrg = (state: AppState): Org | undefined => {
  const user = getUser(state);
  const workspaces = getWorkspaces(state);
  return workspaces.items.find(org => org.id === user.currentOrgId);
};