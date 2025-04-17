import React, {useState} from "react";
import { useParams } from "react-router-dom";
import {
  Spin,
  Typography,
  Card,
  Tag,
  Tabs,
  Alert,
  Descriptions,
  Dropdown,
  Menu,
  Button,
  Breadcrumb,
} from "antd";
import {
  ReloadOutlined,
  LinkOutlined,
  ClusterOutlined,
  TeamOutlined,
  UserOutlined,
  SyncOutlined,
  EditOutlined,
  EllipsisOutlined,
  MoreOutlined,
  HomeOutlined
} from "@ant-design/icons";

import { useEnvironmentContext } from "./context/EnvironmentContext";
import { workspaceConfig } from "./config/workspace.config";
import { userGroupsConfig } from "./config/usergroups.config";
import DeployableItemsTab from "./components/DeployableItemsTab";
import EditEnvironmentModal from "./components/EditEnvironmentModal";
import { Environment } from "./types/environment.types";
import history from "@lowcoder-ee/util/history";

const { Title, Text } = Typography;
const { TabPane } = Tabs;


/**
 * Environment Detail Page Component
 * Shows detailed information about a specific environment
 */
const EnvironmentDetail: React.FC = () => {
  // Get environment ID from URL params
  const {
    environment,
    isLoadingEnvironment,
    error,
    updateEnvironmentData
  } = useEnvironmentContext();  
  
  
  
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Handle edit menu item click
  const handleEditClick = () => {
    setIsEditModalVisible(true);
  };
  
  // Handle modal close
  const handleCloseModal = () => {
    setIsEditModalVisible(false);
  };
  
  // Handle save environment
  const handleSaveEnvironment = async (environmentId: string, data: Partial<Environment>) => {
    setIsUpdating(true);
    try {
      await updateEnvironmentData(environmentId, data);
      handleCloseModal();
    } catch (error) {
      console.error('Failed to update environment:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Dropdown menu for environment actions
  const actionsMenu = (
    <Menu>
      <Menu.Item key="edit" icon={<EditOutlined />} onClick={handleEditClick}>
        Edit Environment
      </Menu.Item>
      {/* Add more menu items here if needed */}
    </Menu>
  );
  debugger
  
  if (isLoadingEnvironment) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading environment..." />
      </div>
    );
  }

  if (error || !environment) {
    return (
      <Alert
        message="Error loading environment"
        description={error || "Environment not found"}
        type="error"
        showIcon
      />
    );
  }
  return (
    <div
      className="environment-detail-container"
      style={{ padding: "24px", flex: 1 }}
    >
      <Breadcrumb style={{ marginBottom: "16px" }}>
        <Breadcrumb.Item>
          <span
            style={{ cursor: "pointer" }}
            onClick={() => history.push("/setting/environments")}
          >
            <HomeOutlined /> Environments
          </span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{environment.environmentName}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header with environment name and controls */}
      {/* Header with environment name and controls */}
      <div
        className="environment-header"
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ flex: "1 1 auto", minWidth: "200px" }}>
          <Title level={3} style={{ margin: 0, wordBreak: "break-word" }}>
            {environment.environmentName || "Unnamed Environment"}
          </Title>
          <Text type="secondary">ID: {environment.environmentId}</Text>
        </div>
        <div style={{ flexShrink: 0 }}>
          <Button
            icon={<EditOutlined />}
            onClick={handleEditClick}
            type="primary"
          >
            Edit Environment
          </Button>
        </div>
      </div>

      {/* Basic Environment Information Card - improved responsiveness */}
      <Card
        title="Environment Overview"
        style={{ marginBottom: "24px" }}
        extra={environment.isMaster && <Tag color="green">Master</Tag>}
      >
        <Descriptions
          bordered
          layout="vertical" // Change to vertical layout on smaller screens
          column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
          size="small" // Use smaller size on mobile
        >
          <Descriptions.Item label="Domain">
            {environment.environmentFrontendUrl ? (
              <a
                href={environment.environmentFrontendUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {environment.environmentFrontendUrl} <LinkOutlined />
              </a>
            ) : (
              "No domain set"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Environment Type">
            <Tag
              color={
                environment.environmentType === "production"
                  ? "red"
                  : environment.environmentType === "testing"
                    ? "orange"
                    : "blue"
              }
            >
              {environment.environmentType}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="API Key Status">
            {environment.environmentApikey ? (
              <Tag color="green">Configured</Tag>
            ) : (
              <Tag color="red">Not Configured</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Master Environment">
            {environment.isMaster ? "Yes" : "No"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Tabs for Workspaces and User Groups */}
      <Tabs defaultActiveKey="workspaces">
        <TabPane tab="Workspaces" key="workspaces">
          {/* Using our new generic component with the workspace config */}
          <DeployableItemsTab
            environment={environment}
            config={workspaceConfig}
            title="Workspaces in this Environment"
          />
        </TabPane>
        <TabPane
          tab={
            <span>
              <TeamOutlined /> User Groups
            </span>
          }
          key="userGroups"
        >
          {/* Using our new generic component with the user group config */}
          <DeployableItemsTab
            environment={environment}
            config={userGroupsConfig}
            title="User Groups in this Environment"
          />
        </TabPane>
      </Tabs>
      {/* Edit Environment Modal */}
      {environment && (
        <EditEnvironmentModal
          visible={isEditModalVisible}
          environment={environment}
          onClose={handleCloseModal}
          onSave={handleSaveEnvironment}
          loading={isUpdating}
        />
      )}
    </div>
  );
};

export default EnvironmentDetail;
