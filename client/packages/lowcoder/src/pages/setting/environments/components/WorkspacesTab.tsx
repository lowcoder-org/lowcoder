// components/WorkspacesTab.tsx
import React from 'react';
import { Card, Button, Row, Col, Statistic, Divider, Alert, message } from 'antd';
import { ClusterOutlined, SyncOutlined } from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { Environment } from '../types/environment.types';
import { Workspace } from '../types/workspace.types';
import { useEnvironmentWorkspaces } from '../hooks/useEnvironmentWorkspaces';
import { useManagedWorkspaces } from '../hooks/enterprise/useManagedWorkspaces';
import WorkspacesList  from './WorkspacesList';
import { connectManagedWorkspace, unconnectManagedWorkspace } from '../services/enterprise.service';
import { getMergedWorkspaces } from '../utils/getMergedWorkspaces';

interface WorkspaceStats {
  total: number;
  managed: number;
  unmanaged: number;
}

interface WorkspacesTabProps {
  environment: Environment;
}

const WorkspacesTab: React.FC<WorkspacesTabProps> = ({ environment }) => {
  // Keep the existing hooks for now - we'll optimize these later
  const {
    workspaces,
    loading: workspacesLoading,
    error: workspacesError,
  } = useEnvironmentWorkspaces(environment);

  const {
    managedWorkspaces,
    managedLoading,
    managedError,
  } = useManagedWorkspaces(environment);

  // Keep the merging logic for now - we'll optimize this later
  const [mergedWorkspaces, setMergedWorkspaces] = React.useState<Workspace[]>([]);
  const [workspaceStats, setWorkspaceStats] = React.useState<WorkspaceStats>({
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

  const handleToggleManaged = async (workspace: Workspace, checked: boolean) => {
    try {
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
        workspaces={mergedWorkspaces}
        loading={workspacesLoading && !workspacesError}
        error={workspacesError}
        environmentId={environment.environmentId}
        onToggleManaged={handleToggleManaged}
      />
    </Card>
  );
};

export default WorkspacesTab;