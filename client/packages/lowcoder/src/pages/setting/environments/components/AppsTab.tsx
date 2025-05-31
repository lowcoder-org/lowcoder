import React, { useState, useEffect } from 'react';
import { Card, Button, Divider, Alert, Table, Tag, Input, Space, Tooltip, Row, Col } from 'antd';
import { SyncOutlined, CloudUploadOutlined, AuditOutlined, AppstoreOutlined, CheckCircleFilled, CloudServerOutlined, DisconnectOutlined, FilterOutlined, DeleteOutlined } from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { Environment } from '../types/environment.types';
import { App, AppStats } from '../types/app.types';
import { getMergedWorkspaceApps } from '../services/apps.service';
import { Switch, Spin, Empty, Avatar } from 'antd';
import { ManagedObjectType, setManagedObject, unsetManagedObject } from '../services/managed-objects.service';
import { useDeployModal } from '../context/DeployModalContext';
import { appsConfig } from '../config/apps.config';
import history from "@lowcoder-ee/util/history";
import { messageInstance } from 'lowcoder-design/src/components/GlobalInstances';
import { trans } from 'i18n';

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
      
      messageInstance.success(trans(checked ? "environments.apps_managedSuccess" : "environments.apps_unmanagedSuccess", { name: app.name }));
      return true;
    } catch (error) {
      messageInstance.error(trans("environments.apps_managedError", { name: app.name }));
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
      title: trans("environments.apps_app"),
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
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 500 }}>{app.name}</span>
              {app.applicationStatus === 'RECYCLED' && (
                <Tooltip title={trans("environments.apps_appRecycled")}>
                  <DeleteOutlined 
                    style={{ 
                      color: '#faad14', 
                      fontSize: '14px' 
                    }} 
                  />
                </Tooltip>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              {app.applicationId}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: trans("environments.apps_status"),
      key: 'status',
      render: (app: App) => (
        <Space direction="vertical" size={0}>
          <Tag color={app.published ? 'success' : 'default'} style={{ borderRadius: '4px' }}>
            {app.published ? <CheckCircleFilled /> : null} {app.published ? trans("environments.apps_published") : trans("environments.apps_draft")}
          </Tag>
          <Tag 
            color={app.managed ? 'processing' : 'default'} 
            style={{ marginTop: 8, borderRadius: '4px' }}
          >
            {app.managed ? <CloudServerOutlined /> : <DisconnectOutlined />} {app.managed ? trans("environments.apps_managed") : trans("environments.apps_unmanaged")}
          </Tag>
        </Space>
      ),
    },
    {
      title: trans("environments.apps_managed"),
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
      title: trans("environments.workspaces_actions"),
      key: 'actions',
      render: (_: any, app: App) => (
        <Space onClick={(e) => e.stopPropagation()}>
         
          <Tooltip title={!app.managed ? trans("environments.apps_appMustBeManagedToDeploy") : trans("environments.apps_deployThisApp")}>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={() => openDeployModal(app, appsConfig, environment)}
              disabled={!app.managed}
            >
              {trans("environments.apps_deploy")}
            </Button>
          </Tooltip>
          <Tooltip title={trans("environments.apps_viewAuditLogs")}>
            <Button
              icon={<AuditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                const auditUrl = `/setting/audit?environmentId=${environment.environmentId}&orgId=${workspaceId}&appId=${app.applicationId}&pageSize=100&pageNum=1`;
                window.open(auditUrl, '_blank');
              }}
            >
              {trans("environments.apps_audit")}
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
          color: '#1890ff',
          padding: '8px',
          backgroundColor: 'rgba(24, 144, 255, 0.1)',
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
            <AppstoreOutlined style={{ marginRight: 8 }} /> {trans("environments.apps_title")}
          </Title>
          <p style={{ marginBottom: 0, color: '#8c8c8c', fontSize: '14px' }}>
            {trans("environments.apps_subtitle")}
          </p>
        </div>
        <Button 
          icon={<SyncOutlined spin={refreshing} />} 
          onClick={handleRefresh}
          loading={loading}
        >
          {trans("environments.apps_refresh")}
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Alert
          message={trans("environments.apps_errorLoadingApps")}
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Configuration warnings */}
      {(!environment.environmentApikey || !environment.environmentApiServiceUrl) && !error && (
        <Alert
          message={trans("environments.apps_configurationIssue")}
          description={trans("environments.apps_missingConfiguration")}
          type="warning"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Stats display */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={12} sm={12} md={6}>
          <StatCard 
            title={trans("environments.apps_totalApps")} 
            value={stats.total} 
            icon={<AppstoreOutlined />} 
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard 
            title={trans("environments.apps_publishedApps")} 
            value={stats.published} 
            icon={<CheckCircleFilled />} 
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard 
            title={trans("environments.apps_managedApps")} 
            value={stats.managed} 
            icon={<CloudServerOutlined />} 
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard 
            title={trans("environments.apps_unmanagedApps")} 
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
        ) : apps.length === 0 ? (
          <Empty
            description={error || trans("environments.apps_noAppsFound")}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            {/* Search and Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <Search
                placeholder={trans("environments.apps_searchApps")}
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
                {showManagedOnly ? trans("environments.apps_showAll") : trans("environments.apps_managedOnly")}
              </Button>
            </div>
            
            {searchText && displayedApps.length !== apps.length && (
              <div style={{ marginBottom: 16, color: '#8c8c8c', fontSize: '13px' }}>
                {trans("environments.apps_showingResults", { count: displayedApps.length, total: apps.length })}
              </div>
            )}
            
            <Table
              columns={columns}
              dataSource={displayedApps}
              rowKey="applicationId"
              pagination={{ 
                pageSize: 10,
                showTotal: (total, range) => trans("environments.apps_paginationTotal", { start: range[0], end: range[1], total }),
                size: 'small'
              }}
              size="middle"
              rowClassName={() => 'app-row'}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default AppsTab;