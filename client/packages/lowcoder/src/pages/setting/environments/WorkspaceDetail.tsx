import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import history from "@lowcoder-ee/util/history";
import DataSourcesList from './components/DataSourcesList';
import { 
  Spin, 
  Typography, 
  Card, 
  Row, 
  Col, 
  Tabs, 
  Alert, 
  Button,
  Statistic,
  Divider,
  Breadcrumb,
  message
} from "antd";
import { 
  AppstoreOutlined, 
  DatabaseOutlined, 
  CodeOutlined,
  HomeOutlined,
  TeamOutlined,
  SyncOutlined,
  ArrowLeftOutlined
} from "@ant-design/icons";
import AppsList from './components/AppsList';
import { useEnvironmentContext } from "./context/EnvironmentContext";
import { useWorkspace } from "./hooks/useWorkspace";
import { useWorkspaceApps } from "./hooks/useWorkspaceApps";
import { useWorkspaceDataSources } from "./hooks/useWorkspaceDataSources";
import { useManagedApps } from "./hooks/enterprise/useManagedApps";
import { App } from "./types/app.types";
import { getMergedApps } from "./utils/getMergedApps";
import { connectManagedApp, unconnectManagedApp } from "./services/enterprise.service";

const { Title, Text } = Typography;
const { TabPane } = Tabs;



const WorkspaceDetail: React.FC = () => {

    // Get parameters from URL
    const { environmentId,workspaceId } = useParams<{ 
      workspaceId: string; 
      environmentId: string;
    }>();
    const {
      environment,
      loading: envLoading,
      error: envError,
      refresh: refreshEnvironment,
    } = useEnvironmentContext();

    const {
      workspace,
      loading: workspaceLoading,
      error: workspaceError,
      refresh: refreshWorkspace
    } = useWorkspace(environment, workspaceId);

    const {
      apps,
      loading: appsLoading,
      error: appsError,
      refresh: refreshApps,
      appStats,
    } = useWorkspaceApps(environment, workspaceId);

    const {
      dataSources,
      loading: dataSourcesLoading,
      error: dataSourcesError,
      refresh: refreshDataSources,
      dataSourceStats,
    } = useWorkspaceDataSources(environment, workspaceId);
    
    const { managedApps } = useManagedApps(environmentId);
    const [mergedApps, setMergedApps] = useState<App[]>([]);

    useEffect(() => {
      setMergedApps(getMergedApps(apps, managedApps));
    }, [apps, managedApps]);



          
    const handleToggleManagedApp = async (app: App, checked: boolean) => {
      try {
        if (checked) {
          await connectManagedApp(environmentId, app.name, app.applicationGid!);
        } else {
          await unconnectManagedApp(app.applicationGid!);
        }

        setMergedApps((currentApps) =>
          currentApps.map((a) =>
            a.applicationId === app.applicationId ? { ...a, managed: checked } : a
          )
        );

        message.success(`${app.name} is now ${checked ? "Managed" : "Unmanaged"}`);
      } catch {
        message.error(`Failed to toggle ${app.name}`);
      }
    };
    if (envLoading || workspaceLoading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '50px' }}>
          <Spin size="large" tip="Loading workspace details..." />
        </div>
      );
    }
    
    if (envError || workspaceError || !environment || !workspace) {
      return (
        <Alert
          message="Error loading workspace details"
          description={envError || workspaceError || "Workspace not found."}
          type="error"
          showIcon
          style={{ margin: '24px' }}
          action={
            <Button type="primary" onClick={() => history.push(`/home/settings/environments/${environmentId}`)}>
              Back to Environment
            </Button>
          }
        />
      );
    }
  
  return (
    <div className="workspace-detail-container" style={{ padding: '24px' }}>
      {/* Breadcrumb navigation */}
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item onClick={() => history.push('/home/settings/environments')}>
          <HomeOutlined /> Environments
        </Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => history.push(`/home/settings/environments/${environmentId}`)}>
          <TeamOutlined /> {environment.environmentName}
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          {workspace.name}
        </Breadcrumb.Item>
      </Breadcrumb>
      
      {/* Header with workspace name and controls */}
      <div className="workspace-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Button 
            type="link" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => history.push(`/home/settings/environments/${environmentId}`)}
            style={{ marginLeft: -12, marginRight: 8 }}
          >
            Back to Environment
          </Button>
          <Title level={3}>{workspace.name}</Title>
          <Text type="secondary">ID: {workspace.id}</Text>
        </div>
      </div>
      
      {/* Tabs for Apps, Data Sources, and Queries */}
      <Tabs defaultActiveKey="apps">
        <TabPane 
          tab={<span><AppstoreOutlined /> Apps</span>} 
          key="apps"
        >
          <Card>
            {/* Header with refresh button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Title level={5}>Apps in this Workspace</Title>
              <Button 
                icon={<SyncOutlined />} 
                onClick={refreshApps}
                size="small"
                loading={appsLoading}
              >
                Refresh Apps
              </Button>
            </div>
            
            {/* App Statistics */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={8}>
                <Statistic 
                  title="Total Apps" 
                  value={appStats.total} 
                  prefix={<AppstoreOutlined />} 
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Published Apps" 
                  value={appStats.published} 
                  prefix={<AppstoreOutlined />} 
                />
              </Col>
            </Row>
            
            <Divider style={{ margin: '16px 0' }} />
            
            {/* Show error if apps loading failed */}
            {appsError && (
              <Alert
                message="Error loading apps"
                description={appsError}
                type="error"
                showIcon
                style={{ marginBottom: '16px' }}
                action={
                  <Button size="small" type="primary" onClick={refreshApps}>
                    Try Again
                  </Button>
                }
              />
            )}
            
            {/* Apps List */}
            <AppsList
              apps={mergedApps}
              loading={appsLoading}
              error={appsError}
              onToggleManaged={handleToggleManagedApp}
            />
          </Card>
        </TabPane>
        
       {/* Update the TabPane in WorkspaceDetail.tsx */}
        <TabPane 
          tab={<span><DatabaseOutlined /> Data Sources</span>} 
          key="dataSources"
        >
          <Card>
            {/* Header with refresh button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Title level={5}>Data Sources in this Workspace</Title>
              <Button 
                icon={<SyncOutlined />} 
                onClick={refreshDataSources}
                size="small"
                loading={dataSourcesLoading}
              >
                Refresh Data Sources
              </Button>
            </div>
            
            {/* Data Source Statistics */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={8}>
                <Statistic 
                  title="Total Data Sources" 
                  value={dataSourceStats.total} 
                  prefix={<DatabaseOutlined />} 
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Data Source Types" 
                  value={dataSourceStats.types} 
                  prefix={<DatabaseOutlined />} 
                />
              </Col>
            </Row>
            
            <Divider style={{ margin: '16px 0' }} />
            
            {/* Show error if data sources loading failed */}
            {dataSourcesError && (
              <Alert
                message="Error loading data sources"
                description={dataSourcesError}
                type="error"
                showIcon
                style={{ marginBottom: '16px' }}
                action={
                  <Button size="small" type="primary" onClick={refreshDataSources}>
                    Try Again
                  </Button>
                }
              />
            )}
            
            {/* Data Sources List */}
            <DataSourcesList 
              dataSources={dataSources}
              loading={dataSourcesLoading}
              error={dataSourcesError}
            />
          </Card>
        </TabPane>
        
        <TabPane 
          tab={<span><CodeOutlined /> Queries</span>} 
          key="queries"
        >
          <Card>
            <Alert
              message="Queries"
              description="Queries feature will be implemented in the next phase."
              type="info"
              showIcon
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
  }


export default WorkspaceDetail