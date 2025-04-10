/**
 * Represents a User Group entity in an environment
 */
export interface UserGroup {
    groupId: string;
    groupGid: string;
    groupName: string;
    allUsersGroup: boolean;
    visitorRole: string;
    createTime: number;
    dynamicRule: any;
    stats: {
      users: string[];
      userCount: number;
      adminUserCount: number;
    };
    syncDelete: boolean;
    devGroup: boolean;
    syncGroup: boolean;
  }