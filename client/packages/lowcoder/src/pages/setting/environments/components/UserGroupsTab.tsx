import React, { useState, useEffect } from 'react';
import { Card, Button, Divider, Alert, message, Table, Tag, Input, Space } from 'antd';
import { SyncOutlined, TeamOutlined } from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { Environment } from '../types/environment.types';
import { UserGroup } from '../types/userGroup.types';
import { getEnvironmentUserGroups } from '../services/environments.service';
import { Spin, Empty } from 'antd';

const { Search } = Input;

interface UserGroupsTabProps {
  environment: Environment;
}

const UserGroupsTab: React.FC<UserGroupsTabProps> = ({ environment }) => {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
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
      
      const groups = await getEnvironmentUserGroups(
        environment.environmentId,
        environment.environmentApikey,
        environment.environmentApiServiceUrl
      );
      
      setUserGroups(groups);
      
      // Calculate stats
      const total = groups.length;
      const active = groups.filter(group => group.state === 'ACTIVE').length;
      
      setStats({
        total,
        active,
        inactive: total - active
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
        group.name.toLowerCase().includes(searchText.toLowerCase()) || 
        group.id.toLowerCase().includes(searchText.toLowerCase()))
    : userGroups;

  // Table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="group-name">{text}</span>
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'USER' ? 'blue' : 'purple'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'state',
      key: 'state',
      render: (state: string) => (
        <Tag color={state === 'ACTIVE' ? 'green' : 'red'}>
          {state}
        </Tag>
      ),
    },
    {
      title: 'Member Count',
      dataIndex: 'memberCount',
      key: 'memberCount',
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
          <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Active</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.active}</div>
        </div>
        <div>
          <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Inactive</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.inactive}</div>
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
            rowKey="id"
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