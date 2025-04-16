// config/workspace.config.tsx
import React from 'react';
import { Row, Col, Statistic, Tag } from 'antd';
import { ClusterOutlined, AuditOutlined } from '@ant-design/icons';
import { Workspace, WorkspaceStats, DeployableItemConfig } from '../types/deployable-item.types';
import { buildEnvironmentWorkspaceId } from '@lowcoder-ee/constants/routesURL';
import { getMergedEnvironmentWorkspaces } from '../services/workspace.service';
import { connectManagedWorkspace, unconnectManagedWorkspace } from '../services/enterprise.service';
import { 
  createNameColumn, 
  createIdColumn, 
  createRoleColumn, 
  createDateColumn, 
  createStatusColumn, 
  createManagedColumn, 
  createAuditColumn 
} from '../utils/columnFactories';

export const workspaceConfig: DeployableItemConfig<Workspace, WorkspaceStats> = {
  // Basic info
  type: 'workspaces',
  singularLabel: 'Workspace',
  pluralLabel: 'Workspaces',
  icon: <ClusterOutlined />,
  idField: 'id',
  
  // Navigation
  buildDetailRoute: (params) => buildEnvironmentWorkspaceId(params.environmentId, params.itemId),
  
  // Configuration
  requiredEnvProps: ['environmentApikey', 'environmentApiServiceUrl'],
  
  // Stats rendering
  renderStats: (stats) => (
    <Row gutter={16}>
      <Col span={8}>
        <Statistic title="Total Workspaces" value={stats.total} prefix={<ClusterOutlined />} />
      </Col>
      <Col span={8}>
        <Statistic title="Managed Workspaces" value={stats.managed} prefix={<ClusterOutlined />} />
      </Col>
      <Col span={8}>
        <Statistic title="Unmanaged Workspaces" value={stats.unmanaged} prefix={<ClusterOutlined />} />
      </Col>
    </Row>
  ),
  
  // Stats calculation
  calculateStats: (workspaces) => {
    const total = workspaces.length;
    const managed = workspaces.filter(w => w.managed).length;
    return {
      total,
      managed,
      unmanaged: total - managed
    };
  },
  
  // Original columns for backward compatibility
  columns: [
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
      render: (_, record: Workspace) => {
        if (!record.creationDate) return 'N/A';
        const date = new Date(record.creationDate);
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      },
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
    }
  ],
  
  // New getColumns method
  getColumns: ({ environment, refreshing, onToggleManaged, additionalParams }) => {
    const columns = [
      createNameColumn<Workspace>(),
      createIdColumn<Workspace>(),
      createRoleColumn<Workspace>(),
      createDateColumn<Workspace>('creationDate', 'Creation Date'),
      createStatusColumn<Workspace>()
    ];
    

    // Add audit column if enabled
    if (workspaceConfig.audit?.enabled) {
      columns.push(createAuditColumn(workspaceConfig, environment, additionalParams));
    }
    
    return columns;
  },
  
  // Enable managed functionality
  enableManaged: true,
  
  // Fetch function
  fetchItems: async ({ environment }) => {
    const result = await getMergedEnvironmentWorkspaces(
      environment.environmentId,
      environment.environmentApikey,
      environment.environmentApiServiceUrl!
    );
    return result.workspaces;
  },
  
  // Toggle managed status
  toggleManaged: async ({ item, checked, environment }) => {
    try {
      if (checked) {
        await connectManagedWorkspace(environment.environmentId, item.name, item.gid!);
      } else {
        await unconnectManagedWorkspace(item.gid!);
      }
      return true;
    } catch (error) {
      console.error('Error toggling managed status:', error);
      return false;
    }
  },
  
  // Audit configuration
  audit: {
    enabled: true,
    icon: <AuditOutlined />,
    label: 'Audit',
    tooltip: 'View audit logs for this workspace',
    getAuditUrl: (item, environment) => 
      `/setting/audit?environmentId=${environment.environmentId}&orgId=${item.id}&pageSize=100&pageNum=1`
  }
};