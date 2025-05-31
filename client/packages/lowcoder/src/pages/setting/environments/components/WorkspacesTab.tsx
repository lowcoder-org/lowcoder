import React, { useState, useEffect } from 'react';
import { Card, Button, Divider, Alert, Table, Tag, Input, Space, Tooltip, Row, Col, Avatar } from 'antd';
import { SyncOutlined, AuditOutlined, TeamOutlined, CheckCircleFilled, CloudServerOutlined, DisconnectOutlined, FilterOutlined } from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { Environment } from '../types/environment.types';
import { Workspace } from '../types/workspace.types';
import { getMergedEnvironmentWorkspaces } from '../services/workspace.service';
import { Spin, Empty } from 'antd';
import { trans } from 'i18n';

import history from '@lowcoder-ee/util/history';

const { Search } = Input;

interface WorkspacesTabProps {
  environment: Environment;
}

const WorkspacesTab: React.FC<WorkspacesTabProps> = ({ environment }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    managed: 0,
    unmanaged: 0
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showManagedOnly, setShowManagedOnly] = useState(false);

  // Fetch workspaces
  const fetchWorkspaces = async () => {
    if (!environment) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check for required environment properties
      if (!environment.environmentApikey || !environment.environmentApiServiceUrl) {
        setError(trans("environments.workspaces_missingConfiguration"));
        setLoading(false);
        return;
      }
      
      const result = await getMergedEnvironmentWorkspaces(
        environment.environmentId,
        environment.environmentApikey,
        environment.environmentApiServiceUrl
      );
      
      setWorkspaces(result.workspaces);
      setStats(result.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : trans("environments.workspaces_errorLoadingWorkspaces"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [environment]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchWorkspaces();
  };

  // Handle row click for navigation
  const handleRowClick = (workspace: Workspace) => {
    history.push(`/setting/environments/${environment.environmentId}/workspaces/${workspace.id}`);
  };

  // Filter workspaces based on search and managed status
  const filteredWorkspaces = searchText
    ? workspaces.filter(workspace => 
        workspace.name.toLowerCase().includes(searchText.toLowerCase()) || 
        workspace.id.toLowerCase().includes(searchText.toLowerCase()))
    : workspaces;

  const displayedWorkspaces = showManagedOnly
    ? filteredWorkspaces.filter(workspace => workspace.managed)
    : filteredWorkspaces;

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
          color: '#52c41a',
          padding: '8px',
          backgroundColor: 'rgba(82, 196, 26, 0.1)',
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
      title: trans("environments.workspaces_workspace"),
      key: 'workspace',
      render: (workspace: Workspace) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            style={{ 
              backgroundColor: stringToColor(workspace.name),
              marginRight: 12
            }}
            shape="square"
            size="small"
          >
            {workspace.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500, fontSize: '14px' }}>{workspace.name}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
              {workspace.id}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: trans("environments.workspaces_role"),
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: trans("environments.workspaces_status"),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'} style={{ borderRadius: '4px' }}>
          {status === 'ACTIVE' ? <CheckCircleFilled style={{ marginRight: 4 }} /> : null}
          {status}
        </Tag>
      ),
    },
    {
      title: trans("environments.workspaces_managed"),
      key: 'managed',
      render: (_: any, workspace: Workspace) => (
        <Tag 
          color={workspace.managed ? 'processing' : 'default'}
          style={{ borderRadius: '4px' }}
        >
          {workspace.managed 
            ? <CloudServerOutlined style={{ marginRight: 4 }} /> 
            : <DisconnectOutlined style={{ marginRight: 4 }} />
          }
          {workspace.managed ? trans("environments.workspaces_managed") : trans("environments.workspaces_unmanaged")}
        </Tag>
      ),
    },
    {
      title: trans("environments.workspaces_actions"),
      key: 'actions',
      render: (_: any, workspace: Workspace) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Tooltip title={trans("environments.workspaces_viewAuditLogs")}>
            <Button
              icon={<AuditOutlined />}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                const auditUrl = `/setting/audit?environmentId=${environment.environmentId}&orgId=${workspace.id}&pageSize=100&pageNum=1`;
                window.open(auditUrl, '_blank');
              }}
            >
              {trans("environments.workspaces_audit")}
            </Button>
          </Tooltip>
        </Space>
      ),
    },
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
            <TeamOutlined style={{ marginRight: 8 }} /> {trans("environments.workspaces_title")}
          </Title>
          <p style={{ marginBottom: 0, color: '#8c8c8c', fontSize: '14px' }}>
            {trans("environments.workspaces_subtitle")}
          </p>
        </div>
        <Button 
          icon={<SyncOutlined spin={refreshing} />} 
          onClick={handleRefresh}
          loading={loading}
        >
          {trans("environments.workspaces_refresh")}
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Alert
          message={trans("environments.workspaces_errorLoadingWorkspaces")}
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Configuration warnings */}
      {(!environment.environmentApikey || !environment.environmentApiServiceUrl) && !error && (
        <Alert
          message={trans("environments.workspaces_configurationIssue")}
          description={trans("environments.workspaces_missingConfiguration")}
          type="warning"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Stats display */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={8}>
          <StatCard 
            title={trans("environments.workspaces_totalWorkspaces")} 
            value={stats.total} 
            icon={<TeamOutlined />} 
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard 
            title={trans("environments.workspaces_managedWorkspaces")} 
            value={stats.managed} 
            icon={<CloudServerOutlined />} 
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard 
            title={trans("environments.workspaces_unmanagedWorkspaces")} 
            value={stats.unmanaged} 
            icon={<DisconnectOutlined />} 
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
        ) : workspaces.length === 0 ? (
          <Empty
            description={error || trans("environments.workspaces_noWorkspacesFound")}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            {/* Search and Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <Search
                placeholder={trans("environments.workspaces_searchWorkspaces")}
                allowClear
                onSearch={value => setSearchText(value)}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 300 }}
              />
              <Button 
                onClick={() => setShowManagedOnly(!showManagedOnly)}
                type={showManagedOnly ? "primary" : "default"}
                icon={<FilterOutlined />}
                style={{ marginLeft: '8px' }}
              >
                {showManagedOnly ? trans("environments.workspaces_showAll") : trans("environments.workspaces_managedOnly")}
              </Button>
            </div>
            
            {searchText && displayedWorkspaces.length !== workspaces.length && (
              <div style={{ marginBottom: 16, color: '#8c8c8c', fontSize: '13px' }}>
                {trans("environments.workspaces_showingResults", { count: displayedWorkspaces.length, total: workspaces.length })}
              </div>
            )}
            
            <Table
              columns={columns}
              dataSource={displayedWorkspaces}
              rowKey="id"
              pagination={{ 
                pageSize: 10,
                showTotal: (total, range) => trans("environments.workspaces_paginationTotal", { start: range[0], end: range[1], total }),
                size: 'small'
              }}
              size="middle"
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
                style: { cursor: 'pointer' }
              })}
              rowClassName={() => 'workspace-row'}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default WorkspacesTab;