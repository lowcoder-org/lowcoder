import React, { useState, useEffect } from 'react';
import { Card, Button, Divider, Alert, message, Table, Tag, Input, Space, Tooltip } from 'antd';
import { SyncOutlined, CloudUploadOutlined, SearchOutlined } from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { Environment } from '../types/environment.types';
import { Workspace } from '../types/workspace.types';
import { App, AppStats } from '../types/app.types';
import { getMergedWorkspaceApps } from '../services/apps.service';
import { Switch, Spin, Empty } from 'antd';
import { ManagedObjectType, setManagedObject, unsetManagedObject } from '../services/managed-objects.service';
import { useDeployModal } from '../context/DeployModalContext';
import { appsConfig } from '../config/apps.config';

const { Search } = Input;

interface AppsTabProps {
  environment: Environment;
  workspace: Workspace;
}

const AppsTab: React.FC<AppsTabProps> = ({ environment, workspace }) => {
  const [apps, setApps] = useState<App[]>([]);
  const [stats, setStats] = useState<AppStats>({
    total: 0,
    published: 0,
    managed: 0,
    unmanaged: 0
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const { openDeployModal } = useDeployModal();

  // Fetch apps
  const fetchApps = async () => {
    if (!workspace.id || !environment) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getMergedWorkspaceApps(
        workspace.id,
        environment.environmentId,
        environment.environmentApikey,
        environment.environmentApiServiceUrl!
      );
      
      setApps(result.apps);
      
      // Calculate stats
      const total = result.apps.length;
      const published = result.apps.filter(app => app.published).length;
      const managed = result.apps.filter(app => app.managed).length;
      
      setStats({
        total,
        published,
        managed,
        unmanaged: total - managed
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch apps");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [environment, workspace]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchApps();
  };

  // Toggle managed status
  const handleToggleManaged = async (app: App, checked: boolean) => {
    setRefreshing(true);
    try {
      if (checked) {
        await setManagedObject(
          app.applicationGid,
          environment.environmentId,
          ManagedObjectType.APP,
          app.name
        );
      } else {
        await unsetManagedObject(
          app.applicationGid,
          environment.environmentId,
          ManagedObjectType.APP
        );
      }
      
      // Update the app in state
      const updatedApps = apps.map(item => {
        if (item.applicationId === app.applicationId) {
          return { ...item, managed: checked };
        }
        return item;
      });
      
      setApps(updatedApps);
      
      // Update stats
      const managed = updatedApps.filter(app => app.managed).length;
      setStats(prev => ({
        ...prev,
        managed,
        unmanaged: prev.total - managed
      }));
      
      message.success(`${app.name} is now ${checked ? 'Managed' : 'Unmanaged'}`);
      return true;
    } catch (error) {
      message.error(`Failed to change managed status for ${app.name}`);
      return false;
    } finally {
      setRefreshing(false);
    }
  };

  // Filter apps based on search
  const filteredApps = searchText
    ? apps.filter(app => 
        app.name.toLowerCase().includes(searchText.toLowerCase()) || 
        app.applicationId.toLowerCase().includes(searchText.toLowerCase()))
    : apps;

  // Table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="app-name">{text}</span>
    },
    {
      title: 'ID',
      dataIndex: 'applicationId',
      key: 'applicationId', 
      ellipsis: true,
    },
    {
      title: 'Published',
      dataIndex: 'published',
      key: 'published',
      render: (published: boolean) => (
        <Tag color={published ? 'green' : 'default'}>
          {published ? 'Published' : 'Draft'}
        </Tag>
      ),
    },
    {
      title: 'Managed',
      key: 'managed',
      render: (_: any, app: App) => (
        <Switch
          checked={!!app.managed}
          onChange={(checked: boolean) => handleToggleManaged(app, checked)}
          loading={refreshing}
          size="small"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, app: App) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Tooltip title={!app.managed ? "App must be managed before it can be deployed" : "Deploy this app to another environment"}>
            <Button
              type="primary"
              size="small"
              icon={<CloudUploadOutlined />}
              onClick={() => openDeployModal(app, appsConfig, environment)}
              disabled={!app.managed}
            >
              Deploy
            </Button>
          </Tooltip>
        </Space>
      ),
    }
  ];

  return (
    <Card>
      {/* Header with refresh button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <Title level={5}>Apps in this Workspace</Title>
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
          <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Total Apps</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.total}</div>
        </div>
        <div>
          <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Published Apps</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.published}</div>
        </div>
        <div>
          <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Managed Apps</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.managed}</div>
        </div>
        <div>
          <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Unmanaged Apps</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.unmanaged}</div>
        </div>
      </div>

      <Divider style={{ margin: "16px 0" }} />

      {/* Error display */}
      {error && (
        <Alert
          message="Error loading apps"
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
          <Spin tip="Loading apps..." />
        </div>
      ) : apps.length === 0 ? (
        <Empty
          description={error || "No apps found in this workspace"}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          {/* Search Bar */}
          <div style={{ marginBottom: 16 }}>
            <Search
              placeholder="Search apps by name or ID"
              allowClear
              onSearch={value => setSearchText(value)}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
            {searchText && filteredApps.length !== apps.length && (
              <div style={{ marginTop: 8 }}>
                Showing {filteredApps.length} of {apps.length} apps
              </div>
            )}
          </div>
          
          <Table
            columns={columns}
            dataSource={filteredApps}
            rowKey="applicationId"
            pagination={{ pageSize: 10 }}
            size="middle"
            scroll={{ x: 'max-content' }}
          />
        </>
      )}
    </Card>
  );
};

export default AppsTab;