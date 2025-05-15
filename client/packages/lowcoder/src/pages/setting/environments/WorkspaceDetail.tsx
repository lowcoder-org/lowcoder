import React, { useState } from "react";
import history from "@lowcoder-ee/util/history";
import { 
  Spin, 
  Typography, 
  Card, 
  Tabs, 
  Button,
  Breadcrumb,
  Space,
  Tag,
  Switch, 
  message,
  Tooltip
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

// Use the context hooks
import { useSingleEnvironmentContext } from "./context/SingleEnvironmentContext";
import { useWorkspaceContext } from "./context/WorkspaceContext";
import { useDeployModal } from "./context/DeployModalContext";

import DeployableItemsTab from "./components/DeployableItemsTab";
import { workspaceConfig } from "./config/workspace.config";
import { appsConfig } from "./config/apps.config";
import { dataSourcesConfig } from "./config/data-sources.config";
import { queryConfig } from "./config/query.config";

import AppsTab from "./components/AppsTab";
import DataSourcesTab from "./components/DataSourcesTab";
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const WorkspaceDetail: React.FC = () => {
  // Use the context hooks
  const { environment } = useSingleEnvironmentContext();
  const { workspace, isLoading, error, toggleManagedStatus } = useWorkspaceContext();
  const { openDeployModal } = useDeployModal();

  const [isToggling, setIsToggling] = useState(false);

  // Handle toggle managed status
  const handleToggleManaged = async (checked: boolean) => {
    if (!workspace) return;
    
    setIsToggling(true);
    try {
      const success = await toggleManagedStatus(checked);
      if (success) {
        message.success(`Workspace is now ${checked ? 'Managed' : 'Unmanaged'}`);
      } else {
        message.error('Failed to change managed status');
      }
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '50px' }}>
        <Spin size="large" tip="Loading workspace details..." />
      </div>
    );
  }

  if (error || !environment || !workspace) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '50px' }}>
        <Typography.Title level={3}>
          {error || "Workspace not found"}
        </Typography.Title>
      </div>  
    );
  }

  return (
    <div className="workspace-detail-container" style={{ padding: "24px", flex: 1 }}>
      {/* Breadcrumb navigation */}
      <Breadcrumb style={{ marginBottom: "16px" }}>
        <Breadcrumb.Item>
          <span style={{ cursor: "pointer" }} onClick={() => history.push("/setting/environments")}>
            <HomeOutlined /> Environments
          </span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <span
            style={{ cursor: "pointer" }}
            onClick={() => history.push(`/setting/environments/${environment.environmentId}`)}
          >
            <TeamOutlined /> {environment.environmentName}
          </span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{workspace.name}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Workspace header with details and actions */}
      <Card style={{ marginBottom: "24px" }} bodyStyle={{ padding: "16px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Left section - Workspace info */}
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {workspace.name}
            </Title>
            <div style={{ display: "flex", alignItems: "center", marginTop: "8px" }}>
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
                checked={!!workspace.managed}
                onChange={handleToggleManaged}
                loading={isToggling}
                checkedChildren="Yes"
                unCheckedChildren="No"
              />
            </div>
            <Tooltip
              title={
                !workspace.managed
                  ? "Workspace must be managed before it can be deployed"
                  : "Deploy this workspace to another environment"
              }
            >
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
            </Tooltip>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => history.push(`/setting/environments/${environment.environmentId}`)}
            >
              Back
            </Button>
          </Space>
        </div>
      </Card>

      {/* Tabs for Apps, Data Sources, and Queries */}
      <Tabs defaultActiveKey="apps">
      // Replace the Apps TabPane in WorkspaceDetail.tsx with this:
          <TabPane tab={<span><AppstoreOutlined /> Apps</span>} key="apps">
            <AppsTab
              environment={environment}
              workspace={workspace}
            />
          </TabPane>

        <TabPane tab={<span><DatabaseOutlined /> Data Sources</span>} key="dataSources">
          <DataSourcesTab
            environment={environment}
            workspace={workspace}
          />
        </TabPane>

        <TabPane tab={<span><CodeOutlined /> Queries</span>} key="queries">
          <DeployableItemsTab
            environment={environment}
            config={queryConfig}
            additionalParams={{ workspaceId: workspace.id }}
            title="Queries in this Workspace"
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default WorkspaceDetail;