import React from 'react';
import { Table, Tag, Empty, Spin, Badge } from 'antd';
import { UserGroup } from '../types/userGroup.types';

interface UserGroupsListProps {
  userGroups: UserGroup[];
  loading: boolean;
  error?: string | null;
}

/**
 * Component to display a list of user groups in a table
 */
const UserGroupsList: React.FC<UserGroupsListProps> = ({
  userGroups,
  loading,
  error,
}) => {
  // Format timestamp to date string
  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  // Table columns definition
  const columns = [
    {
      title: 'Name',
      dataIndex: 'groupName',
      key: 'groupName',
      render: (name: string, record: UserGroup) => (
        <div>
          <span>{name}</span>
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
      render: (record: UserGroup) => (
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
      render: (record: UserGroup) => formatDate(record.createTime),
    },
    {
      title: 'Type',
      key: 'type',
      render: (record: UserGroup) => {
        if (record.allUsersGroup) return <Tag color="blue">Global</Tag>;
        if (record.devGroup) return <Tag color="orange">Dev</Tag>;
        if (record.syncGroup) return <Tag color="purple">Sync</Tag>;
        return <Tag color="default">Standard</Tag>;
      },
    }
  ];

  // If loading, show spinner
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <Spin tip="Loading user groups..." />
      </div>
    );
  }

  // If no user groups or error, show empty state
  if (!userGroups || userGroups.length === 0 || error) {
    return (
      <Empty
        description={error || "No user groups found"}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={userGroups}
      rowKey="groupId"
      pagination={{ pageSize: 10 }}
      size="middle"
    />
  );
};

export default UserGroupsList;