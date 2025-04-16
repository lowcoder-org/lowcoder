import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import history from "@lowcoder-ee/util/history";
import { 
  Spin, 
  Typography, 
  Card, 
  Row, 
  Col, 
  Tabs, 
  Alert, 
  Button,
  Breadcrumb,
  Space,
  Tag,
  Switch, 
  message
} from "antd";
import { 
  AppstoreOutlined, 
  DatabaseOutlined, 
  CodeOutlined,
  HomeOutlined,
  TeamOutlined,
  ArrowLeftOutlined, 
  CloudUploadOutlined
} from "@ant-design/icons";
import { useEnvironmentContext } from "./context/EnvironmentContext";
import { useWorkspace } from "./hooks/useWorkspace";
import DeployableItemsTab from "./components/DeployableItemsTab";
import { appsConfig } from "./config/apps.config";
import { dataSourcesConfig } from "./config/data-sources.config";
import { queryConfig } from "./config/query.config";
import { useDeployableItems } from "./hooks/useDeployableItems";
import { workspaceConfig } from "./config/workspace.config";
import { useDeployModal } from "./context/DeployModalContext";

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

    const {openDeployModal} = useDeployModal();

     // Use our generic hook with the workspace config
      const {
        items: workspaces,
        stats: workspaceStats,
        loading: workspaceLoading,
        error : workspaceError,
        toggleManagedStatus,
        refreshItems
      } = useDeployableItems(
        workspaceConfig,
        environment,
        { workspaceId } // Additional params if needed
      );
      
        // Find the current workspace in the items array
  const workspace = workspaces.find(w => w.id === workspaceId);

  const handleToggleManaged = async (checked: boolean) => {
    if (!workspace) return;
    
    const success = await toggleManagedStatus(workspace, checked);
    if (success) {
      message.success(`Workspace is now ${checked ? 'Managed' : 'Unmanaged'}`);
    } else {
      message.error('Failed to change managed status');
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
    <div
      className="workspace-detail-container"
      style={{ padding: "24px", flex: 1 }}
    >
      {/* Breadcrumb navigation */}
      <Breadcrumb style={{ marginBottom: "16px" }}>
        <Breadcrumb.Item
          onClick={() => history.push("/home/settings/environments")}
        >
          <HomeOutlined /> Environments
        </Breadcrumb.Item>
        <Breadcrumb.Item
          onClick={() =>
            history.push(`/home/settings/environments/${environmentId}`)
          }
        >
          <TeamOutlined /> {environment.environmentName}
        </Breadcrumb.Item>
        <Breadcrumb.Item>{workspace.name}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Workspace header with details and actions */}
      <Card
        style={{ marginBottom: "24px" }}
        bodyStyle={{ padding: "16px 24px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Left section - Workspace info */}
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {workspace.name}
            </Title>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "8px",
              }}
            >
              <Text type="secondary" style={{ marginRight: "16px" }}>
                ID: {workspace.id}
              </Text>
              <Tag color={workspace.managed ? "green" : "default"}>
                {workspace.managed ? "Managed" : "Unmanaged"}
              </Tag>
            </div>
          </div>

          {/* Right section - Actions */}
          <Space size="middle">
            <div style={{ display: "flex", alignItems: "center" }}>
              <Text style={{ marginRight: "8px" }}>Managed:</Text>
              <Switch
                checked={workspace.managed}
                onChange={handleToggleManaged}
                checkedChildren="Yes"
                unCheckedChildren="No"
              />
            </div>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={() =>
                openDeployModal(workspace, workspaceConfig, environment)
              }
              disabled={!workspace.managed}
            >
              Deploy
            </Button>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() =>
                history.push(`/home/settings/environments/${environmentId}`)
              }
            >
              Back
            </Button>
          </Space>
        </div>
      </Card>

      {/* Tabs for Apps, Data Sources, and Queries */}
      <Tabs defaultActiveKey="apps">
        <TabPane
          tab={
            <span>
              <AppstoreOutlined /> Apps
            </span>
          }
          key="apps"
        >
          <DeployableItemsTab
            environment={environment}
            config={appsConfig}
            additionalParams={{ workspaceId }}
            title="Apps in this Workspace"
          />
        </TabPane>

        {/* Update the TabPane in WorkspaceDetail.tsx */}
        <TabPane
          tab={
            <span>
              <DatabaseOutlined /> Data Sources
            </span>
          }
          key="dataSources"
        >
          <DeployableItemsTab
            environment={environment}
            config={dataSourcesConfig}
            additionalParams={{ workspaceId }}
            title="Data Sources in this Workspace"
          />
        </TabPane>

        <TabPane
          tab={
            <span>
              <CodeOutlined /> Queries
            </span>
          }
          key="queries"
        >
          <DeployableItemsTab
            environment={environment}
            config={queryConfig}
            additionalParams={{ workspaceId }}
            title="Queries in this Workspace"
          />
        </TabPane>
      </Tabs>
    </div>
  );
  }


export default WorkspaceDetail