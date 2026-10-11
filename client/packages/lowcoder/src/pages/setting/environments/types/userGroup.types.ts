export interface UserGroupStats {
  users: string[];
  adminUserCount: number;
  userCount: number;
}

export interface UserGroup {
  groupId: string;
  groupGid: string;
  groupName: string;
  allUsersGroup: boolean;
  visitorRole: string;
  createTime: number;
  dynamicRule: any;
  stats: UserGroupStats;
  syncDelete: boolean;
  devGroup: boolean;
  syncGroup: boolean;
}

export interface UserGroupsTabStats {
  total: number;
  allUsers: number;
  developers: number;
  custom: number;
}