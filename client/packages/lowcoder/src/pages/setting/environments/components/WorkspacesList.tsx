import React from 'react';
import { Table, Tag, Empty, Spin, Switch, Space } from 'antd';
import { Workspace } from '../types/workspace.types';
import history from '@lowcoder-ee/util/history';
import { buildEnvironmentWorkspaceId } from '@lowcoder-ee/constants/routesURL';

interface WorkspacesListProps {
  workspaces: Workspace[];
  loading: boolean;
  error?: string | null;
  environmentId: string;
  onToggleManaged?: (workspace: Workspace, checked: boolean) => void;
  refreshing?: boolean;
}

const WorkspacesList: React.FC<WorkspacesListProps> = ({
  workspaces,
  loading,
  error,
  environmentId,
  onToggleManaged,
  refreshing = false,
}) => {
  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const handleRowClick = (workspace: Workspace) => {
    history.push(`${buildEnvironmentWorkspaceId(environmentId, workspace.id)}`);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <span>{role}</span>,
    },
    {
      title: 'Creation Date',
      key: 'creationDate',
      render: (record: Workspace) => formatDate(record.creationDate),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'} className="status-tag">
          {status}
        </Tag>
      ),
    },
    {
      title: 'Managed',
      key: 'managed',
      render: (record: Workspace) => (
        <Space>
          <Tag color={record.managed ? 'green' : 'default'}>
            {record.managed ? 'Managed' : 'Unmanaged'}
          </Tag>
          {onToggleManaged && (
            <Switch
              size="small"
              checked={record.managed}
              loading={refreshing}
              onClick={(checked,e) => {
                e.stopPropagation(); // ✅ THIS STOPS the row from being triggered
                onToggleManaged(record, checked);
              }}
              onChange={() => {}}
            />
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <Spin tip="Loading workspaces..." />
      </div>
    );
  }

  if (!workspaces || workspaces.length === 0 || error) {
    return (
      <Empty
        description={error || 'No workspaces found'}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={workspaces}
      rowKey="id"
      pagination={{ pageSize: 10 }}
      size="middle"
      onRow={(record) => ({
        onClick: () => handleRowClick(record),
        style: { cursor: 'pointer' },
      })}
    />
  );
};

export default WorkspacesList;
