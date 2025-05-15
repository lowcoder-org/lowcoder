import React, {useState} from "react";
import {
  Spin,
  Typography,
  Card,
  Tag,
  Tabs,
  Alert,
  Descriptions,
  Menu,
  Button,
  Breadcrumb,
} from "antd";
import {
  LinkOutlined,
  TeamOutlined,
  EditOutlined,
  HomeOutlined
} from "@ant-design/icons";

import { useSingleEnvironmentContext } from "./context/SingleEnvironmentContext";
import { workspaceConfig } from "./config/workspace.config";
import { userGroupsConfig } from "./config/usergroups.config";
import DeployableItemsTab from "./components/DeployableItemsTab";
import EditEnvironmentModal from "./components/EditEnvironmentModal";
import { Environment } from "./types/environment.types";
import history from "@lowcoder-ee/util/history";
import WorkspacesTab from "./components/WorkspacesTab";
import UserGroupsTab from "./components/UserGroupsTab";
const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * Environment Detail Page Component
 * Shows detailed information about a specific environment
 */
const EnvironmentDetail: React.FC = () => {
  // Use the SingleEnvironmentContext instead of EnvironmentContext
  const {
    environment,
    isLoading,
    error,
    updateEnvironmentData
  } = useSingleEnvironmentContext();  
  
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
  const handleSaveEnvironment = async (data: Partial<Environment>) => {
    if (!environment) return;
    
    setIsUpdating(true);
    try {
      // Close the modal first, before the update completes
      handleCloseModal();
      
      // Then update the environment data
      await updateEnvironmentData(data);
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
  
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading environment..." />
      </div>
    );
  }

  if (error || !environment) {
    return (
      <div style={{ padding: "24px", flex: 1 }}>
        <Breadcrumb style={{ marginBottom: "16px" }}>
          <Breadcrumb.Item>
            <span
              style={{ cursor: "pointer" }}
              onClick={() => history.push("/setting/environments")}
            >
              <HomeOutlined /> Environments
            </span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Not Found</Breadcrumb.Item>
        </Breadcrumb>
        
        <Card>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Title level={3} style={{ color: "#ff4d4f" }}>
              Environment Not Found
            </Title>
            <Text type="secondary" style={{ display: "block", margin: "16px 0" }}>
              {error || "The environment you're looking for doesn't exist or you don't have permission to view it."}
            </Text>
            <Button 
              type="primary"
              onClick={() => history.push("/setting/environments")}
              style={{ marginTop: "16px" }}
            >
              Return to Environments List
            </Button>
          </div>
        </Card>
      </div>
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
          {/* Using our new standalone WorkspacesTab component */}
          <WorkspacesTab environment={environment} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <TeamOutlined /> User Groups
            </span>
          }
          key="userGroups"
        >
          {/* Now using our standalone UserGroupsTab component */}
          <UserGroupsTab environment={environment} />
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