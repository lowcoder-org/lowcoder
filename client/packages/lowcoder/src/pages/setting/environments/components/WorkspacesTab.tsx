// components/WorkspacesTab.tsx
import React from 'react';
import { Card, Button, Row, Col, Statistic, Divider, Alert, message } from 'antd';
import { ClusterOutlined, SyncOutlined } from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { Environment } from '../types/environment.types';
import { useWorkspaces } from '../hooks/useWorkspaces';
import WorkspacesList from './WorkspacesList';
import { Workspace } from '../types/workspace.types';

interface WorkspacesTabProps {
  environment: Environment;
}

const WorkspacesTab: React.FC<WorkspacesTabProps> = ({ environment }) => {
  // Use the new hook that handles both regular and managed workspaces
  const {
    workspaces,
    stats,
    loading,
    error,
    toggleManagedStatus
  } = useWorkspaces(environment);

  const handleToggleManaged = async (workspace: Workspace, checked:boolean) => {
    const success = await toggleManagedStatus(workspace, checked);
    
    if (success) {
      message.success(`${workspace.name} is now ${checked ? 'Managed' : 'Unmanaged'}`);
    } else {
      message.error(`Failed to toggle managed state for ${workspace.name}`);
      // Optionally refresh to ensure UI is in sync with backend
    }
  };

  return (
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
      </div>

      {/* Workspace Statistics */}
      <Row gutter={16} style={{ marginBottom: "24px" }}>
        <Col span={8}>
          <Statistic
            title="Total Workspaces"
            value={stats.total}
            prefix={<ClusterOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Managed Workspaces"
            value={stats.managed}
            prefix={<ClusterOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Unmanaged Workspaces"
            value={stats.unmanaged}
            prefix={<ClusterOutlined />}
          />
        </Col>
      </Row>

      <Divider style={{ margin: "16px 0" }} />

      {/* Show error if workspace loading failed */}
      {error && (
        <Alert
          message="Error loading workspaces"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {(!environment.environmentApikey ||
        !environment.environmentApiServiceUrl) &&
        !error && (
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
        workspaces={workspaces}
        loading={loading && !error}
        error={error}
        environmentId={environment.environmentId}
        onToggleManaged={handleToggleManaged}
      />
    </Card>
  );
};

export default WorkspacesTab;