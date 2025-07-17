import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Table, Tag, Input, Space, Row, Col, Avatar, Tooltip } from 'antd';
import { SyncOutlined, TeamOutlined, UserOutlined, UsergroupAddOutlined, SettingOutlined, CodeOutlined } from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { Environment } from '../types/environment.types';
import { UserGroup, UserGroupsTabStats } from '../types/userGroup.types';
import { getEnvironmentUserGroups } from '../services/environments.service';
import { Spin, Empty } from 'antd';
import { trans } from 'i18n';

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
        setError(trans("environments.userGroups_missingConfiguration"));
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
      setError(err instanceof Error ? err.message : trans("environments.userGroups_errorLoadingUserGroups"));
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

  // Helper function to generate colors from strings
  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Stat card component
  const StatCard = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => (
    <Card 
      style={{ 
        height: '100%', 
        borderRadius: '4px',
        border: '1px solid #f0f0f0'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#8c8c8c', marginBottom: '8px' }}>{title}</div>
          <div style={{ fontSize: '20px', fontWeight: 500 }}>{value}</div>
        </div>
        <div style={{ 
          fontSize: '24px', 
          opacity: 0.8, 
          color: '#722ed1',
          padding: '8px',
          backgroundColor: 'rgba(114, 46, 209, 0.1)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
      </div>
    </Card>
  );

  // Table columns
  const columns = [
    {
      title: trans("environments.userGroups_userGroup"),
      key: 'group',
      render: (group: UserGroup) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            style={{ 
              backgroundColor: stringToColor(group.groupName),
              marginRight: 12
            }}
            shape="square"
            size="small"
          >
            {group.groupName.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500, fontSize: '14px' }}>{group.groupName}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
              {group.groupId}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: trans("environments.userGroups_type"),
      key: 'type',
      render: (_: any, group: UserGroup) => {
        if (group.allUsersGroup) return (
          <Tag color="blue" style={{ borderRadius: '4px' }}>
            <UserOutlined style={{ marginRight: 4 }} /> {trans("environments.userGroups_allUsers")}
          </Tag>
        );
        if (group.devGroup) return (
          <Tag color="purple" style={{ borderRadius: '4px' }}>
            <CodeOutlined style={{ marginRight: 4 }} /> {trans("environments.userGroups_developers")}
          </Tag>
        );
        return (
          <Tag color="default" style={{ borderRadius: '4px' }}>
            <SettingOutlined style={{ marginRight: 4 }} /> {trans("environments.userGroups_custom")}
          </Tag>
        );
      },
    },
    {
      title: trans("environments.userGroups_members"),
      key: 'members',
      render: (_: any, group: UserGroup) => (
        <Tooltip title={trans("environments.userGroups_totalMembersTooltip")}>
          <Tag style={{ borderRadius: '4px', backgroundColor: '#f6f6f6', color: '#333' }}>
            <UserOutlined style={{ marginRight: 4 }} /> {group.stats?.userCount || 0}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: trans("environments.userGroups_adminMembers"),
      key: 'adminMembers',
      render: (_: any, group: UserGroup) => (
        <Tooltip title={trans("environments.userGroups_adminMembersTooltip")}>
          <Tag style={{ borderRadius: '4px', backgroundColor: '#fff1f0', color: '#cf1322' }}>
            <UserOutlined style={{ marginRight: 4 }} /> {group.stats?.adminUserCount || 0}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: trans("environments.userGroups_created"),
      dataIndex: 'createTime',
      key: 'createTime',
      render: (createTime: number) => (
        <span style={{ color: '#8c8c8c', fontSize: '13px' }}>
          {new Date(createTime).toLocaleDateString()}
        </span>
      ),
    }
  ];

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "20px"
      }}>
        <div>
          <Title level={4} style={{ margin: 0, marginBottom: '4px' }}>
            <UsergroupAddOutlined style={{ marginRight: 8 }} /> {trans("environments.userGroups_title")}
          </Title>
          <p style={{ marginBottom: 0, color: '#8c8c8c', fontSize: '14px' }}>
            {trans("environments.userGroups_subtitle")}
          </p>
        </div>
        <Button 
          icon={<SyncOutlined spin={refreshing} />} 
          onClick={handleRefresh}
          loading={loading}
        >
          {trans("environments.userGroups_refresh")}
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Alert
          message={trans("environments.userGroups_errorLoadingUserGroups")}
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Configuration warnings */}
      {(!environment.environmentApikey || !environment.environmentApiServiceUrl) && !error && (
        <Alert
          message={trans("environments.userGroups_configurationIssue")}
          description={trans("environments.userGroups_missingConfiguration")}
          type="warning"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Stats display */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard 
            title={trans("environments.userGroups_totalGroups")} 
            value={stats.total} 
            icon={<TeamOutlined />} 
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard 
            title={trans("environments.userGroups_allUsersGroups")} 
            value={stats.allUsers} 
            icon={<UserOutlined />} 
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard 
            title={trans("environments.userGroups_developerGroups")} 
            value={stats.developers} 
            icon={<CodeOutlined />} 
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard 
            title={trans("environments.userGroups_customGroups")} 
            value={stats.custom} 
            icon={<SettingOutlined />} 
          />
        </Col>
      </Row>

      {/* Content */}
      <Card 
        style={{ 
          borderRadius: '4px',
          border: '1px solid #f0f0f0'
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : userGroups.length === 0 ? (
          <Empty
            description={error || trans("environments.userGroups_noUserGroupsFound")}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            {/* Search Bar */}
            <div style={{ marginBottom: 16 }}>
              <Search
                placeholder={trans("environments.userGroups_searchUserGroups")}
                allowClear
                onSearch={value => setSearchText(value)}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 300 }}
              />
              {searchText && filteredUserGroups.length !== userGroups.length && (
                <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: '13px' }}>
                  {trans("environments.userGroups_showingResults", { count: filteredUserGroups.length, total: userGroups.length })}
                </div>
              )}
            </div>
            
            <Table
              columns={columns}
              dataSource={filteredUserGroups}
              rowKey="groupId"
              pagination={{ 
                pageSize: 10,
                showTotal: (total, range) => trans("environments.userGroups_paginationTotal", { start: range[0], end: range[1], total }),
                size: 'small'
              }}
              size="middle"
              rowClassName={() => 'group-row'}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default UserGroupsTab;