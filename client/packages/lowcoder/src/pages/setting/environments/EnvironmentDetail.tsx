import React, {useState} from "react";
import { useParams } from "react-router-dom";
import {
  Spin,
  Typography,
  Card,
  Row,
  Col,
  Tag,
  Tabs,
  Alert,
  Descriptions,
  Button,
  Statistic,
  Divider,
  message
} from "antd";
import {
  ReloadOutlined,
  LinkOutlined,
  ClusterOutlined,
  TeamOutlined,
  UserOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import WorkspacesList from "./components/WorkspacesList";
import UserGroupsList from "./components/UserGroupsList";
import { useEnvironmentContext } from "./context/EnvironmentContext";
import { useEnvironmentWorkspaces } from "./hooks/useEnvironmentWorkspaces";
import { useEnvironmentUserGroups } from "./hooks/useEnvironmentUserGroups";
import { useManagedWorkspaces } from "./hooks/enterprise/useManagedWorkspaces";
import { getMergedWorkspaces } from "./utils/getMergedWorkspaces";
import { Workspace } from "./types/workspace.types";
import { connectManagedWorkspace, unconnectManagedWorkspace } from "./services/enterprise.service";
import WorkspacesTab from "./components/WorkspacesTab";
import UserGroupsTab from "./components/UserGroupsTab";


const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * Environment Detail Page Component
 * Shows detailed information about a specific environment
 */

type WorkspaceStats = {
  total: number;
  managed: number;
  unmanaged: number;
};
const EnvironmentDetail: React.FC = () => {
  // Get environment ID from URL params
  const {
    environment,
    isLoadingEnvironment: envLoading,
    error: envError,
  } = useEnvironmentContext();  
  
  
  const {
    workspaces,
    loading: workspacesLoading,
    error: workspacesError,
    refresh: refreshWorkspaces,
  } = useEnvironmentWorkspaces(environment);

  const {
    managedWorkspaces,
    managedLoading,
    managedError,
    refreshManagedWorkspaces,
  } = useManagedWorkspaces(environment);

  const {
    userGroups,
    loading: userGroupsLoading,
    error: userGroupsError,
    refresh: refreshUserGroups,
    userGroupStats,
  } = useEnvironmentUserGroups(environment);

  // Use the custom hook to handle data fetching and state management
  // Use the custom hook to handle data fetching and state management

  const [mergedWorkspaces, setMergedWorkspaces] = useState<Workspace[]>([]);
  const [workspaceStats, setWorkspaceStats] = useState<WorkspaceStats>({
    total: 0,
    managed: 0,
    unmanaged: 0,
  });
  

  React.useEffect(() => {
    if (workspaces && managedWorkspaces) {
      const { merged, stats } = getMergedWorkspaces(workspaces, managedWorkspaces);
      setMergedWorkspaces(merged);
      setWorkspaceStats(stats);
    }
  }, [workspaces, managedWorkspaces]);
  
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

  const { merged, stats: initialStats } = getMergedWorkspaces(workspaces, managedWorkspaces);
 


  const handleToggleManaged = async (workspace: Workspace, checked: boolean) => {
    try {
      console.log("WORKSPACE", workspace);
      if (checked) {
        await connectManagedWorkspace(environment.environmentId, workspace.name, workspace.gid!);
      } else {
        await unconnectManagedWorkspace(workspace.gid!);
      }
  
      // Optimistically update the local state
      const updatedList = mergedWorkspaces.map((w) =>
        w.id === workspace.id ? { ...w, managed: checked } : w
      );
  
      const updatedManagedCount = updatedList.filter((w) => w.managed).length;
  
      setMergedWorkspaces(updatedList);
      setWorkspaceStats({
        total: updatedList.length,
        managed: updatedManagedCount,
        unmanaged: updatedList.length - updatedManagedCount,
      });
  
      message.success(`${workspace.name} is now ${checked ? 'Managed' : 'Unmanaged'}`);
    } catch (err) {
      message.error(`Failed to toggle managed state for ${workspace.name}`);
    }
  };
  

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
