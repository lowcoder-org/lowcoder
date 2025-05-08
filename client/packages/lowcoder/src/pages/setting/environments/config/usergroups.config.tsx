// config/usergroups.config.tsx
import React from 'react';
import { Row, Col, Statistic, Tag, Badge } from 'antd';
import { TeamOutlined, UserOutlined } from '@ant-design/icons';
import { getEnvironmentUserGroups } from '../services/environments.service';
import { UserGroup, UserGroupStats } from '../types/userGroup.types';
import { DeployableItemConfig } from '../types/deployable-item.types';
import { 
  createUserGroupNameColumn,
  createGroupIdColumn,
  createUserCountColumn, 
  createDateColumn,
  createGroupTypeColumn,
  createAuditColumn 
} from '../utils/columnFactories';

const formatDate = (timestamp: number): string => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};


export const userGroupsConfig: DeployableItemConfig<UserGroup, UserGroupStats> = {
  // Basic info
  type: 'userGroups',
  singularLabel: 'User Group',
  pluralLabel: 'User Groups',
  icon: <TeamOutlined />,
  idField: 'id',
  
  // Navigation - No navigation for user groups, provide a dummy function
  buildDetailRoute: () => '#',
  
  // Configuration
  requiredEnvProps: ['environmentApikey', 'environmentApiServiceUrl'],
  
  // Stats rendering - Custom for user groups
  renderStats: (stats) => (
    <Row gutter={16}>
      <Col span={8}>
        <Statistic title="Total User Groups" value={stats.total} prefix={<TeamOutlined />} />
      </Col>
      <Col span={8}>
        <Statistic title="Total Users" value={stats.totalUsers} prefix={<UserOutlined />} />
      </Col>
      <Col span={8}>
        <Statistic title="Admin Users" value={stats.adminUsers} prefix={<UserOutlined />} />
      </Col>
    </Row>
  ),
  
  // Stats calculation - Custom for user groups
  calculateStats: (userGroups) => {
    const total = userGroups.length;
    const totalUsers = userGroups.reduce(
      (sum, group) => sum + (group.stats?.userCount ?? 0), 
      0
    );
    const adminUsers = userGroups.reduce(
      (sum, group) => sum + (group.stats?.adminUserCount ?? 0), 
      0
    );
    
    return {
      total,
      managed: 0, // User groups don't have managed/unmanaged state
      unmanaged: 0, // User groups don't have managed/unmanaged state
      totalUsers,
      adminUsers
    };
  },
  
  // Table configuration
  columns: [
    {
      title: 'Name',
      dataIndex: 'groupName',
      key: 'groupName',
      render: (name: string, record: UserGroup) => (
        <div>
          <span>{record.groupName}</span>
          {record.allUsersGroup && (
            <Tag color="blue" style={{ marginLeft: 8 }}>All Users</Tag>
          )}
          {record.devGroup && (
            <Tag color="orange" style={{ marginLeft: 8 }}>Dev</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'ID',
      dataIndex: 'groupId',
      key: 'groupId',
      ellipsis: true,
    },
    {
      title: 'Users',
      key: 'userCount',
      render: (_, record: UserGroup) => (
        <div>
          <Badge count={record.stats.userCount} showZero style={{ backgroundColor: '#52c41a' }} />
          <span style={{ marginLeft: 8 }}>
            ({record.stats.adminUserCount} admin{record.stats.adminUserCount !== 1 ? 's' : ''})
          </span>
        </div>
      ),
    },
    {
      title: 'Created',
      key: 'createTime',
      render: (_, record: UserGroup) => formatDate(record.createTime),
    },
    {
      title: 'Type',
      key: 'type',
      render: (_, record: UserGroup) => {
        if (record.allUsersGroup) return <Tag color="blue">Global</Tag>;
        if (record.devGroup) return <Tag color="orange">Dev</Tag>;
        if (record.syncGroup) return <Tag color="purple">Sync</Tag>;
        return <Tag color="default">Standard</Tag>;
      },
    }
  ],
  
  // No managed status for user groups
  enableManaged: false,
  
  getColumns: ({ environment, additionalParams }) => {
    const columns = [
      createGroupIdColumn<UserGroup>(),
      createUserGroupNameColumn<UserGroup>(),
    
      createUserCountColumn<UserGroup>(),
      createDateColumn<UserGroup>('createTime', 'Created'),
      createGroupTypeColumn<UserGroup>(),
    ];
    
    // User groups aren't managed, so we don't add the managed column
    
    // Add audit column if enabled
    if (userGroupsConfig.audit?.enabled) {
      columns.push(createAuditColumn(userGroupsConfig, environment, additionalParams));
    }
    
    return columns;
  },
  // Service functions
  fetchItems: async ({ environment }) => {
    const userGroups = await getEnvironmentUserGroups(
      environment.environmentId,
      environment.environmentApikey,
      environment.environmentApiServiceUrl!
    );
    
    // Map the required properties to satisfy DeployableItem interface
    return userGroups.map(group => ({
      ...group,
      id: group.groupId,      // Map groupId to id
      name: group.groupName   // Map groupName to name
    }));
  },
  
  // Dummy function for toggleManaged (will never be called since enableManaged is false)
  toggleManaged: async () => {
    return false;
  }
};