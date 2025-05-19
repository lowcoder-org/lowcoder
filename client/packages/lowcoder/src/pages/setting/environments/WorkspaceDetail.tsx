import React, { useState } from "react";
import history from "@lowcoder-ee/util/history";
import { 
  Spin, 
  Typography, 
  Tabs, 
  message,
} from "antd";
import { 
  AppstoreOutlined, 
  DatabaseOutlined, 
  CodeOutlined,
  HomeOutlined,
  TeamOutlined,
} from "@ant-design/icons";

// Use the context hooks
import { useSingleEnvironmentContext } from "./context/SingleEnvironmentContext";
import { useWorkspaceContext } from "./context/WorkspaceContext";
import { useDeployModal } from "./context/DeployModalContext";

import { workspaceConfig } from "./config/workspace.config";
import AppsTab from "./components/AppsTab";
import DataSourcesTab from "./components/DataSourcesTab";
import QueriesTab from "./components/QueriesTab";
import ModernBreadcrumbs from "./components/ModernBreadcrumbs";
import WorkspaceHeader from "./components/WorkspaceHeader";

const { TabPane } = Tabs;

const WorkspaceDetail: React.FC = () => {
  // Use the context hooks
  const { environment } = useSingleEnvironmentContext();
  const { workspace, isLoading, error, toggleManagedStatus } = useWorkspaceContext();
  const { openDeployModal } = useDeployModal();

  console.log("workspace render", workspace);  

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

  const breadcrumbItems = [
    {
      key: 'environments',
      title: (
        <span>
          <HomeOutlined /> Environments
        </span>
      ),
      onClick: () => history.push("/setting/environments")
    },
    {
      key: 'environment',
      title: (
        <span>
          <TeamOutlined /> {environment.environmentName}
        </span>
      ),
      onClick: () => history.push(`/setting/environments/${environment.environmentId}`)
    },
    {
      key: 'workspace',
      title: workspace.name
    }
  ];

  return (
    <div className="workspace-detail-container" style={{ 
      padding: "24px", 
      flex: 1,
      minWidth: "1000px",
      overflowX: "auto"
    }}>
      {/* Modern Breadcrumbs navigation */}
      <ModernBreadcrumbs items={breadcrumbItems} />

      {/* New Workspace Header */}
      <WorkspaceHeader
        workspace={workspace}
        environment={environment}
        isToggling={isToggling}
        onToggleManagedStatus={handleToggleManaged}
        onDeploy={() => openDeployModal(workspace, workspaceConfig, environment)}
      />

      {/* Tabs for Apps, Data Sources, and Queries */}
      <Tabs defaultActiveKey="apps" className="modern-tabs" type="card">
        <TabPane tab={<span><AppstoreOutlined /> Apps</span>} key="apps">
          <AppsTab
            environment={environment}
            workspaceId={workspace.id}
          />
        </TabPane>

        <TabPane tab={<span><DatabaseOutlined /> Data Sources</span>} key="dataSources">
          <DataSourcesTab
            environment={environment}
            workspaceId={workspace.id}
          />
        </TabPane>
        <TabPane tab={<span><CodeOutlined /> Queries</span>} key="queries">
          <QueriesTab
            environment={environment}
            workspaceId={workspace.id}
          />
        </TabPane>
        
      </Tabs>
    </div>
  );
};

export default WorkspaceDetail;