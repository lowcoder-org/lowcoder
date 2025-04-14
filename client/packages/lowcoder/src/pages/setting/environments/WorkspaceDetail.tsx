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
import AppsTab from "./components/AppsTab";
import DataSourcesTab from "./components/DataSourcesTab";

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
      isLoadingEnvironment: envLoading,
      error: envError,
    } = useEnvironmentContext();

    const {
      workspace,
      loading: workspaceLoading,
      error: workspaceError,
    } = useWorkspace(environment, workspaceId);
    
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
          <AppsTab environment={environment} workspaceId={workspaceId} />
        </TabPane>
        
       {/* Update the TabPane in WorkspaceDetail.tsx */}
        <TabPane 
          tab={<span><DatabaseOutlined /> Data Sources</span>} 
          key="dataSources"
        >
          <DataSourcesTab environment={environment} workspaceId={workspaceId} />
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