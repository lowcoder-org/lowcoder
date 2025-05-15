import React, { useState, useEffect } from 'react';
import { Card, Button, Divider, Alert, message, Table, Tag, Input, Space, Tooltip } from 'antd';
import { SyncOutlined, CloudUploadOutlined, AuditOutlined } from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { Environment } from '../types/environment.types';
import { Workspace } from '../types/workspace.types';
import { getMergedEnvironmentWorkspaces } from '../services/workspace.service';
import { Spin, Empty } from 'antd';

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

  // Fetch workspaces
  const fetchWorkspaces = async () => {
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
      
      const result = await getMergedEnvironmentWorkspaces(
        environment.environmentId,
        environment.environmentApikey,
        environment.environmentApiServiceUrl
      );
      
      setWorkspaces(result.workspaces);
      setStats(result.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch workspaces");
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

  // Toggle managed status


  // Handle row click for navigation
  const handleRowClick = (workspace: Workspace) => {
    history.push(`/setting/environments/${environment.environmentId}/workspaces/${workspace.id}`);
  };

  // Filter workspaces based on search
  const filteredWorkspaces = searchText
    ? workspaces.filter(workspace => 
        workspace.name.toLowerCase().includes(searchText.toLowerCase()) || 
        workspace.id.toLowerCase().includes(searchText.toLowerCase()))
    : workspaces;

  // Table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="workspace-name">{text}</span>
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Managed',
      key: 'managed',
      render: (_: any, workspace: Workspace) => (
        <Tag color={workspace.managed ? 'blue' : 'default'}>
          {workspace.managed ? 'Managed' : 'Unmanaged'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, workspace: Workspace) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View Audit Logs">
            <Button
              icon={<AuditOutlined />}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                const auditUrl = `/setting/audit?environmentId=${environment.environmentId}&orgId=${workspace.id}&pageSize=100&pageNum=1`;
                window.open(auditUrl, '_blank');
              }}
            >
              Audit
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      {/* Header with refresh button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <Title level={5}>Workspaces in this Environment</Title>
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
          <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Total Workspaces</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.total}</div>
        </div>
        <div>
          <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Managed</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.managed}</div>
        </div>
        <div>
          <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Unmanaged</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.unmanaged}</div>
        </div>
      </div>

      <Divider style={{ margin: "16px 0" }} />

      {/* Error display */}
      {error && (
        <Alert
          message="Error loading workspaces"
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
          <Spin tip="Loading workspaces..." />
        </div>
      ) : workspaces.length === 0 ? (
        <Empty
          description={error || "No workspaces found in this environment"}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          {/* Search Bar */}
          <div style={{ marginBottom: 16 }}>
            <Search
              placeholder="Search workspaces by name or ID"
              allowClear
              onSearch={value => setSearchText(value)}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
            {searchText && filteredWorkspaces.length !== workspaces.length && (
              <div style={{ marginTop: 8 }}>
                Showing {filteredWorkspaces.length} of {workspaces.length} workspaces
              </div>
            )}
          </div>
          
          <Table
            columns={columns}
            dataSource={filteredWorkspaces}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="middle"
            scroll={{ x: 'max-content' }}
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: 'pointer' }
            })}
          />
        </>
      )}
    </Card>
  );
};

export default WorkspacesTab;