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
          <Card>
            {/* Header with refresh button */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <Title level={5}>Workspaces in this Environment</Title>
              <Button
                icon={<SyncOutlined />}
                onClick={refreshWorkspaces}
                size="small"
                loading={workspacesLoading}
              >
                Refresh Workspaces
              </Button>
            </div>

            {/* Workspace Statistics */}
            <Row gutter={16} style={{ marginBottom: "24px" }}>
              <Col span={8}>
                <Statistic
                  title="Total Workspaces"
                  value={workspaceStats.total}
                  prefix={<ClusterOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Managed Workspaces"
                  value={workspaceStats.managed}
                  prefix={<ClusterOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Unmanaged Workspaces"
                  value={workspaceStats.unmanaged}
                  prefix={<ClusterOutlined />}
                />
              </Col>
            </Row>

            <Divider style={{ margin: "16px 0" }} />

            {/* Show error if workspace loading failed */}
            {workspacesError && (
              <Alert
                message="Error loading workspaces"
                description={workspacesError}
                type="error"
                showIcon
                style={{ marginBottom: "16px" }}
                action={
                  workspacesError.includes("No API key configured") ? (
                    <Button size="small" type="primary" disabled>
                      API Key Required
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      type="primary"
                      onClick={refreshWorkspaces}
                    >
                      Try Again
                    </Button>
                  )
                }
              />
            )}

            {(!environment.environmentApikey ||
              !environment.environmentApiServiceUrl) &&
              !workspacesError && (
                <Alert
                  message="Configuration Issue"
                  description={
                    !environment.environmentApikey
                      ? "An API key is required to fetch workspaces for this environment."
                      : "An API service URL is required to fetch workspaces for this environment."
                  }
                  type="warning"
                  showIcon
                  style={{ marginBottom: "16px" }}
                />
              )}

            {/* Workspaces List */}
            <WorkspacesList
              workspaces={mergedWorkspaces} // ⬅️ Use local state!
              loading={workspacesLoading && !workspacesError}
              error={workspacesError}
              environmentId={environment.environmentId}
              onToggleManaged={handleToggleManaged} // ⬅️ Add this to enable toggles
            />
          </Card>
        </TabPane>
        <TabPane
          tab={
            <span>
              <TeamOutlined /> User Groups
            </span>
          }
          key="userGroups"
        >
          <Card>
            {/* Header with refresh button */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <Title level={5}>User Groups in this Environment</Title>
              <Button
                icon={<SyncOutlined />}
                onClick={refreshUserGroups}
                size="small"
                loading={userGroupsLoading}
              >
                Refresh User Groups
              </Button>
            </div>

            {/* User Group Statistics */}
            <Row gutter={16} style={{ marginBottom: "24px" }}>
              <Col span={8}>
                <Statistic
                  title="Total User Groups"
                  value={userGroupStats.total}
                  prefix={<TeamOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Total Users"
                  value={userGroupStats.totalUsers}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Admin Users"
                  value={userGroupStats.adminUsers}
                  prefix={<UserOutlined />}
                />
              </Col>
            </Row>

            <Divider style={{ margin: "16px 0" }} />

            {/* Show error if user group loading failed */}
            {userGroupsError && (
              <Alert
                message="Error loading user groups"
                description={userGroupsError}
                type="error"
                showIcon
                style={{ marginBottom: "16px" }}
                action={
                  userGroupsError.includes("No API key configured") ||
                  userGroupsError.includes("No API service URL configured") ? (
                    <Button size="small" type="primary" disabled>
                      Configuration Required
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      type="primary"
                      onClick={refreshUserGroups}
                    >
                      Try Again
                    </Button>
                  )
                }
              />
            )}

            {/* Show warning if no API key or API service URL is configured */}
            {(!environment.environmentApikey ||
              !environment.environmentApiServiceUrl) &&
              !userGroupsError && (
                <Alert
                  message="Configuration Issue"
                  description={
                    !environment.environmentApikey
                      ? "An API key is required to fetch user groups for this environment."
                      : "An API service URL is required to fetch user groups for this environment."
                  }
                  type="warning"
                  showIcon
                  style={{ marginBottom: "16px" }}
                />
              )}

            {/* User Groups List */}
            <UserGroupsList
              userGroups={userGroups}
              loading={userGroupsLoading && !userGroupsError}
              error={userGroupsError}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default EnvironmentDetail;
