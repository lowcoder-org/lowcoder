/**
 * Represents a User Group entity in an environment
*/

import { DeployableItem, BaseStats } from "./deployable-item.types";

export interface UserGroup extends DeployableItem {
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
    id: string;
    name: string;
  }


  /**
 * Statistics for User Groups
 */
export interface UserGroupStats extends BaseStats {
  totalUsers: number;
  adminUsers: number;
}