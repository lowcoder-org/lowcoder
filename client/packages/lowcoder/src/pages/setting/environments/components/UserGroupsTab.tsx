import React, { useState, useEffect } from 'react';
import { Card, Button, Divider, Alert, message, Table, Tag, Input, Space } from 'antd';
import { SyncOutlined, TeamOutlined } from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { Environment } from '../types/environment.types';
import { UserGroup, UserGroupsTabStats } from '../types/userGroup.types';
import { getEnvironmentUserGroups } from '../services/environments.service';
import { Spin, Empty } from 'antd';

const { Search } = Input;

interface UserGroupsTabProps {
  environment: Environment;
}

const UserGroupsTab: React.FC<UserGroupsTabProps> = ({ environment }) => {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [stats, setStats] = useState<UserGroupsTabStats>({
    total: 0,
    allUsers: 0,
    developers: 0,
    custom: 0
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  // Fetch user groups
  const fetchUserGroups = async () => {
    if (!environment) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check for required environment properties
      if (!environment.environmentApikey || !environment.environmentApiServiceUrl) {
        setError('Missing required configuration: API key or API service URL');
        setLoading(false);
        return;
      }
      
      const response = await getEnvironmentUserGroups(
        environment.environmentId,
        environment.environmentApikey,
        environment.environmentApiServiceUrl
      );
      
      // Extract the groups from the data array in the response
      const groups = response|| [];
      
      setUserGroups(groups);
      
      // Calculate stats
      const total = groups.length;
      const allUsers = groups.filter((group: UserGroup) => group.allUsersGroup).length;
      const developers = groups.filter((group: UserGroup) => group.devGroup).length;
      const custom = total - (allUsers + developers);
      
      setStats({
        total,
        allUsers,
        developers,
        custom
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user groups");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserGroups();
  }, [environment]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserGroups();
  };

  // Filter user groups based on search
  const filteredUserGroups = searchText
    ? userGroups.filter(group => 
        group.groupName.toLowerCase().includes(searchText.toLowerCase()) || 
        group.groupId.toLowerCase().includes(searchText.toLowerCase()))
    : userGroups;

  // Table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'groupName',
      key: 'groupName',
      render: (text: string) => <span className="group-name">{text}</span>
    },
    {
      title: 'ID',
      dataIndex: 'groupId',
      key: 'groupId',
      ellipsis: true,
    },
    {
      title: 'Type',
      key: 'type',
      render: (_: any, group: UserGroup) => {
        if (group.allUsersGroup) return <Tag color="blue">All Users</Tag>;
        if (group.devGroup) return <Tag color="purple">Developers</Tag>;
        return <Tag color="default">Custom</Tag>;
      },
    },
    {
      title: 'Members',
      key: 'members',
      render: (_: any, group: UserGroup) => group.stats?.userCount || 0,
    },
    {
      title: 'Admin Members',
      key: 'adminMembers',
      render: (_: any, group: UserGroup) => group.stats?.adminUserCount || 0,
    },
    {
      title: 'Created',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (createTime: number) => new Date(createTime).toLocaleDateString(),
    }
  ];

  return (
    <Card>
      {/* Header with refresh button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <Title level={5}>User Groups in this Environment</Title>
        <Button 
          icon={<SyncOutlined spin={refreshing} />} 
          onClick={handleRefresh}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Stats display */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Total Groups</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.total}</div>
        </div>
        <div>
          <div style={{ fontSize: '14px', color: '#8c8c8c' }}>All Users Groups</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.allUsers}</div>
        </div>
        <div>
          <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Developer Groups</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.developers}</div>
        </div>
        <div>
          <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Custom Groups</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.custom}</div>
        </div>
      </div>

      <Divider style={{ margin: "16px 0" }} />

      {/* Error display */}
      {error && (
        <Alert
          message="Error loading user groups"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Configuration warnings */}
      {(!environment.environmentApikey || !environment.environmentApiServiceUrl) && !error && (
        <Alert
          message="Configuration Issue"
          description="Missing required configuration: API key or API service URL"
          type="warning"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <Spin tip="Loading user groups..." />
        </div>
      ) : userGroups.length === 0 ? (
        <Empty
          description={error || "No user groups found in this environment"}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          {/* Search Bar */}
          <div style={{ marginBottom: 16 }}>
            <Search
              placeholder="Search user groups by name or ID"
              allowClear
              onSearch={value => setSearchText(value)}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
            {searchText && filteredUserGroups.length !== userGroups.length && (
              <div style={{ marginTop: 8 }}>
                Showing {filteredUserGroups.length} of {userGroups.length} user groups
              </div>
            )}
          </div>
          
          <Table
            columns={columns}
            dataSource={filteredUserGroups}
            rowKey="groupId"
            pagination={{ pageSize: 10 }}
            size="middle"
            scroll={{ x: 'max-content' }}
          />
        </>
      )}
    </Card>
  );
};

export default UserGroupsTab;