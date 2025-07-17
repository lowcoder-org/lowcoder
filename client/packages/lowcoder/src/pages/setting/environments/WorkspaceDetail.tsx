import React, { useState } from "react";
import history from "@lowcoder-ee/util/history";
import { 
  Spin, 
  Typography, 
  Tabs, 
  Row,
  Col,
} from "antd";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { 
  AppstoreOutlined, 
  DatabaseOutlined, 
  CodeOutlined,
  HomeOutlined,
  TeamOutlined,
  CloudServerOutlined,
  CheckCircleOutlined,
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
import StatsCard from "./components/StatsCard";
import ErrorComponent from "./components/ErrorComponent";
import { Level1SettingPageContent } from "../styled";

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
        messageInstance.success(`Workspace is now ${checked ? 'Managed' : 'Unmanaged'}`);
      } else {
        messageInstance.error('Failed to change managed status');
      }
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '50px' }}>
        <Spin size="large" spinning={true}>
          <div style={{ 
            display: 'block', 
            textAlign: 'center', 
            padding: '20px',
            color: '#8c8c8c',
            fontSize: '14px'
          }}>
            Loading workspace details...
          </div>
        </Spin>
      </div>
    );
  }

  if (error || !environment || !workspace) {
    return (
      <ErrorComponent 
        errorMessage={"Workspace not found"}
        returnPath="/setting/environments"
        returnLabel="Return to Environments List"
      />
    );
  }

  const breadcrumbItems = [
    {
      key: 'environments',
      title: (
        <span>
           Environments
        </span>
      ),
      onClick: () => history.push("/setting/environments")
    },
    {
      key: 'environment',
      title: (
        <span>
          {environment.environmentName}
        </span>
      ),
      onClick: () => history.push(`/setting/environments/${environment.environmentId}`)
    },
    {
      key: 'workspace',
      title: workspace.name
    }
  ];

  const tabItems = [
    {
      key: 'apps',
      label: (
        <span>
          <AppstoreOutlined /> Apps
        </span>
      ),
      children: (
        <AppsTab
          environment={environment}
          workspaceId={workspace.id}
        />
      )
    },
    {
      key: 'dataSources',
      label: (
        <span>
          <DatabaseOutlined /> Data Sources
        </span>
      ),
      children: (
        <DataSourcesTab
          environment={environment}
          workspaceId={workspace.id}
        />
      )
    },
    {
      key: 'queries',
      label: (
        <span>
          <CodeOutlined /> Queries
        </span>
      ),
      children: (
        <QueriesTab
          environment={environment}
          workspaceId={workspace.id}
        />
      )
    }
  ];

  return (
    <Level1SettingPageContent style={{ minWidth: "1000px" }}>
      {/* New Workspace Header */}

      {/* Modern Breadcrumbs navigation */}
      <ModernBreadcrumbs items={breadcrumbItems} />

      <WorkspaceHeader
        workspace={workspace}
        environment={environment}
        isToggling={isToggling}
        onToggleManagedStatus={handleToggleManaged}
        onDeploy={() => openDeployModal(workspace, workspaceConfig, environment)}
      />

      {/* Stats Cards Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Status"
            value={workspace.managed ? "Managed" : "Unmanaged"}
            icon={workspace.managed ? <CheckCircleOutlined /> : <CloudServerOutlined />}
            color={workspace.managed ? "#52c41a" : "#faad14"}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Environment"
            value={environment.environmentType || "Unknown"}
            icon={<CloudServerOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Workspace ID"
            value={workspace.id.slice(-8)}
            icon={<TeamOutlined />}
            color="#722ed1"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Created"
            value={workspace.creationDate ? new Date(workspace.creationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Unknown"}
            icon={<DatabaseOutlined />}
            color="#52c41a"
          />
        </Col>
      </Row>

      

      {/* Tabs for Apps, Data Sources, and Queries */}
      <Tabs 
        defaultActiveKey="apps" 
        className="modern-tabs" 
        type="line"
        items={tabItems}
      />
    </Level1SettingPageContent>
  );
};

export default WorkspaceDetail;