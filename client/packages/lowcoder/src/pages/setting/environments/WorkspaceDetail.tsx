import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import history from "@lowcoder-ee/util/history";
import { useWorkspaceDetail } from "./hooks/useWorkspaceDetail";


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
  Breadcrumb
} from "antd";
import { 
  ReloadOutlined, 
  AppstoreOutlined, 
  DatabaseOutlined, 
  CodeOutlined,
  HomeOutlined,
  TeamOutlined,
  SyncOutlined,
  ArrowLeftOutlined
} from "@ant-design/icons";
import { getEnvironmentById } from './services/environments.service';
import AppsList from './components/AppsList';
import { Workspace } from './types/workspace.types';
import { Environment } from './types/environment.types';
import { App } from './types/app.types';

const { Title, Text } = Typography;
const { TabPane } = Tabs;


const WorkspaceDetail: React.FC = () => {
    // Get parameters from URL
    const { environmentId, workspaceId } = useParams<{ 
      environmentId: string;
      workspaceId: string; 
    }>();
    
    // Use the custom hook
    const {
      environment,
      workspace,
      apps,
      appsLoading,
      appsError,
      refreshApps,
      appStats,
      isLoading,
      hasError
    } = useWorkspaceDetail(environmentId, workspaceId);
  
    // Handle loading/error states
    if (isLoading) {
      return <Spin />;
    }
  
    // Handle loading/error states
if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '50px' }}>
        <Spin size="large" tip="Loading workspace details..." />
      </div>
    );
  }
  
  // Handle error state
  if (hasError || !environment || !workspace) {
    return (
      <Alert
        message="Error loading workspace details"
        description="Could not load the workspace or environment data. Please try again."
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
              apps={apps}
              loading={appsLoading}
              error={appsError}
            />
          </Card>
        </TabPane>
        
        <TabPane 
          tab={<span><DatabaseOutlined /> Data Sources</span>} 
          key="dataSources"
        >
          <Card>
            <Alert
              message="Data Sources"
              description="Data Sources feature will be implemented in the next phase."
              type="info"
              showIcon
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