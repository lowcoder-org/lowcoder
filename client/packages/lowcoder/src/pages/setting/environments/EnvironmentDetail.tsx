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
} from "antd";
import {
  ReloadOutlined,
  LinkOutlined,
  ClusterOutlined,
  TeamOutlined,
  UserOutlined,
  SyncOutlined,
} from "@ant-design/icons";

import { useEnvironmentContext } from "./context/EnvironmentContext";
import WorkspacesTab from "./components/WorkspacesTab";
import UserGroupsTab from "./components/UserGroupsTab";


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
    isLoadingEnvironment: envLoading,
    error: envError,
  } = useEnvironmentContext();  
  
  
  
  // If loading, show spinner
  if (envLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          padding: "50px",
        }}
      >
        <Spin size="large" tip="Loading environment details..." />
      </div>
    );
  }

  // If error, show error message
  if (envError) {
    return (
      <Alert
        message="Error loading environment details"
        description={envError}
        type="error"
        showIcon
        style={{ margin: "24px" }}
      />
    );
  }

  // If no environment data, show message
  if (!environment) {
    return (
      <Alert
        message="Environment not found"
        description="The requested environment could not be found"
        type="warning"
        showIcon
        style={{ margin: "24px" }}
      />
    );
  }
   
  return (
    <div className="environment-detail-container" style={{ padding: "24px" }}>
      {/* Header with environment name and controls */}
      <div
        className="environment-header"
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Title level={3}>
            {environment.environmentName || "Unnamed Environment"}
          </Title>
          <Text type="secondary">ID: {environment.environmentId}</Text>
        </div>
      </div>

      {/* Basic Environment Information Card */}
      <Card
        title="Environment Overview"
        style={{ marginBottom: "24px" }}
        extra={environment.isMaster && <Tag color="green">Master</Tag>}
      >
        <Descriptions
          bordered
          column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
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
        <TabPane
          tab={
            <span>
              <ClusterOutlined /> Workspaces
            </span>
          }
          key="workspaces"
        >
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
          <UserGroupsTab environment={environment} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default EnvironmentDetail;
