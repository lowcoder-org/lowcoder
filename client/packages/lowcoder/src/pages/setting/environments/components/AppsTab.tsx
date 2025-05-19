import React, { useState, useEffect } from 'react';
import { Card, Button, Divider, Alert, message, Table, Tag, Input, Space, Tooltip, Row, Col } from 'antd';
import { SyncOutlined, CloudUploadOutlined, AuditOutlined, AppstoreOutlined, CheckCircleFilled, CloudServerOutlined, DisconnectOutlined, FilterOutlined } from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { Environment } from '../types/environment.types';
import { App, AppStats } from '../types/app.types';
import { getMergedWorkspaceApps } from '../services/apps.service';
import { Switch, Spin, Empty, Avatar } from 'antd';
import { ManagedObjectType, setManagedObject, unsetManagedObject } from '../services/managed-objects.service';
import { useDeployModal } from '../context/DeployModalContext';
import { appsConfig } from '../config/apps.config';
import history from "@lowcoder-ee/util/history";

const { Search } = Input;

interface AppsTabProps {
  environment: Environment;
  workspaceId: string;
}

const AppsTab: React.FC<AppsTabProps> = ({ environment, workspaceId }) => {
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
  const [showManagedOnly, setShowManagedOnly] = useState(false);

  // Fetch apps
  const fetchApps = async () => {
    if (!workspaceId || !environment) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getMergedWorkspaceApps(
        workspaceId,
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
  }, [environment, workspaceId]);

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

  const displayedApps = showManagedOnly
    ? filteredApps.filter(app => app.managed)
    : filteredApps;

  // Table columns
  const columns = [
    {
      title: 'App',
      key: 'app',
      render: (app: App) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            style={{ 
              backgroundColor: stringToColor(app.name),
              marginRight: 12
            }}
            shape="square"
          >
            {app.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{app.name}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              {app.applicationId}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (app: App) => (
        <Space direction="vertical" size={0}>
          <Tag color={app.published ? 'success' : 'default'} style={{ borderRadius: '12px' }}>
            {app.published ? <CheckCircleFilled /> : null} {app.published ? 'Published' : 'Draft'}
          </Tag>
          <Tag 
            color={app.managed ? 'processing' : 'default'} 
            style={{ marginTop: 8, borderRadius: '12px' }}
          >
            {app.managed ? <CloudServerOutlined /> : <DisconnectOutlined />} {app.managed ? 'Managed' : 'Unmanaged'}
          </Tag>
        </Space>
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
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, app: App) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View Audit Logs">
            <Button
              icon={<AuditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                const auditUrl = `/setting/audit?environmentId=${environment.environmentId}&orgId=${workspaceId}&appId=${app.applicationId}&pageSize=100&pageNum=1`;
                window.open(auditUrl, '_blank');
              }}
            >
              Audit
            </Button>
          </Tooltip>
          <Tooltip title={!app.managed ? "App must be managed before it can be deployed" : "Deploy this app to another environment"}>
            <Button
              type="primary"
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
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '8px' }}>{title}</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{value}</div>
        </div>
        <div style={{ 
          fontSize: '28px', 
          opacity: 0.8, 
          color: '#1890ff',
          padding: '12px',
          backgroundColor: 'rgba(24, 144, 255, 0.1)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
      </div>
    </Card>
  );

  return (
    <div style={{ padding: '16px 0' }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "24px",
        background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
        padding: '20px 24px',
        borderRadius: '8px',
        color: 'white'
      }}>
        <div>
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            <AppstoreOutlined style={{ marginRight: 10 }} /> Apps
          </Title>
          <p style={{ marginBottom: 0 }}>Manage your workspace applications</p>
        </div>
        <Button 
          icon={<SyncOutlined spin={refreshing} />} 
          onClick={handleRefresh}
          loading={loading}
          type="default"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderColor: 'rgba(255, 255, 255, 0.4)',
            color: 'white',
            fontWeight: 500
          }}
        >
          Refresh
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Alert
          message="Error loading apps"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: "20px" }}
        />
      )}

      {/* Configuration warnings */}
      {(!environment.environmentApikey || !environment.environmentApiServiceUrl) && !error && (
        <Alert
          message="Configuration Issue"
          description="Missing required configuration: API key or API service URL"
          type="warning"
          showIcon
          style={{ marginBottom: "20px" }}
        />
      )}

      {/* Stats display */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={12} md={6}>
          <StatCard 
            title="Total Apps" 
            value={stats.total} 
            icon={<AppstoreOutlined />} 
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard 
            title="Published Apps" 
            value={stats.published} 
            icon={<CheckCircleFilled />} 
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard 
            title="Managed Apps" 
            value={stats.managed} 
            icon={<CloudServerOutlined />} 
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard 
            title="Unmanaged Apps" 
            value={stats.unmanaged} 
            icon={<DisconnectOutlined />} 
          />
        </Col>
      </Row>

      {/* Content */}
      <Card 
        style={{ 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Spin size="large" tip="Loading apps..." />
          </div>
        ) : apps.length === 0 ? (
          <Empty
            description={error || "No apps found in this workspace"}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            {/* Search and Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <Search
                placeholder="Search apps by name or ID"
                allowClear
                onSearch={value => setSearchText(value)}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 300 }}
                size="large"
              />
              <Button 
                onClick={() => setShowManagedOnly(!showManagedOnly)}
                type="default"
                icon={<FilterOutlined />}
                style={{
                  marginLeft: '8px',
                  backgroundColor: showManagedOnly ? '#1890ff' : 'white',
                  color: showManagedOnly ? 'white' : '#1890ff',
                  borderColor: '#1890ff'
                }}
              />
            </div>
            
            {searchText && displayedApps.length !== apps.length && (
              <div style={{ marginTop: 8, color: '#8c8c8c' }}>
                Showing {displayedApps.length} of {apps.length} apps
              </div>
            )}
            
            <Table
              columns={columns}
              dataSource={displayedApps}
              rowKey="applicationId"
              pagination={{ 
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} apps`
              }}
              rowClassName={() => 'app-row'}
              style={{ 
                borderRadius: '8px', 
                overflow: 'hidden'
              }}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default AppsTab;