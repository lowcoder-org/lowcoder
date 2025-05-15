// config/query.config.tsx
import React from 'react';
import { Row, Col, Statistic, Tag } from 'antd';
import { ApiOutlined } from '@ant-design/icons';
import { DeployableItemConfig } from '../types/deployable-item.types';
import { Query } from '../types/query.types';
import { connectManagedQuery, unconnectManagedQuery } from '../services/enterprise.service';
import { getMergedWorkspaceQueries, deployQuery } from '../services/query.service';
import { ManagedObjectType, setManagedObject, unsetManagedObject } from '../services/managed-objects.service';
import { Environment } from '../types/environment.types';

import { 
  createNameColumn, 
  createCreatorColumn,
  createDateColumn,
  createQueryTypeColumn,
  createManagedColumn, 
  createDeployColumn,
  createAuditColumn 
} from '../utils/columnFactories';

// Define QueryStats interface
export interface QueryStats {
  total: number;
  managed: number;
  unmanaged: number;
}

export const queryConfig: DeployableItemConfig<Query, QueryStats> = {
  // Basic info
  type: 'queries',
  singularLabel: 'Query',
  pluralLabel: 'Queries',
  icon: <ApiOutlined />,
  idField: 'id',
  
  // Navigation - queries don't have detail pages in this implementation
  buildDetailRoute: () => '#',
  
  // Configuration
  requiredEnvProps: ['environmentApikey', 'environmentApiServiceUrl'],
  
  // Stats rendering
  renderStats: (stats) => (
    <Row gutter={16}>
      <Col span={8}>
        <Statistic title="Total Queries" value={stats.total} prefix={<ApiOutlined />} />
      </Col>
      <Col span={8}>
        <Statistic title="Managed Queries" value={stats.managed} prefix={<ApiOutlined />} />
      </Col>
      <Col span={8}>
        <Statistic title="Unmanaged Queries" value={stats.unmanaged} prefix={<ApiOutlined />} />
      </Col>
    </Row>
  ),
  
  // Stats calculation
  calculateStats: (queries) => {
    const total = queries.length;
    const managed = queries.filter(q => q.managed).length;
    
    return {
      total,
      managed,
      unmanaged: total - managed
    };
  },
  columns: [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color="blue">{type || 'Unknown'}</Tag>
      ),
    },
    {
      title: 'Database',
      key: 'database',
      render: (_, record: Query) => (
        <span>{record.datasourceConfig?.database || 'N/A'}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'datasourceStatus',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'NORMAL' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
  ],
  getColumns: ({ environment, refreshing, onToggleManaged, openDeployModal, additionalParams }) => {
    const columns = [
      createNameColumn<Query>(),
      createCreatorColumn<Query>(),
      createDateColumn<Query>('createTime', 'Creation Date'),
      createQueryTypeColumn<Query>(),
    ];
    
    // Add managed column if enabled
    if (queryConfig.enableManaged && onToggleManaged) {
      columns.push(createManagedColumn(onToggleManaged, refreshing));
    }
    
    // Add deploy column if enabled
    if (queryConfig.deploy?.enabled && openDeployModal) {
      columns.push(createDeployColumn(queryConfig, environment, openDeployModal));
    }
    
    // Add audit column if enabled
    if (queryConfig.audit?.enabled) {
      columns.push(createAuditColumn(queryConfig, environment, additionalParams));
    }
    
    return columns;
  },
  
  // Deployment options
  enableManaged: true,
  
  // Service functions
  fetchItems: async ({ environment, workspaceId }) => {
    if (!workspaceId) {
      throw new Error("Workspace ID is required to fetch queries");
    }
    
    const result = await getMergedWorkspaceQueries(
      workspaceId,
      environment.environmentId,
      environment.environmentApikey,
      environment.environmentApiServiceUrl!
    );
    
    return result.queries;
  },
  
  toggleManaged: async ({ item, checked, environment }) => {
    try {
      if (checked) {
        return await setManagedObject(
          item.gid,
          environment.environmentId,
          ManagedObjectType.QUERY,
          item.name
        );
      } else {
        return await unsetManagedObject(
          item.gid,
          environment.environmentId,
          ManagedObjectType.QUERY
        );
      }
    } catch (error) {
      console.error('Error toggling managed status:', error);
      return false;
    }
  },
  deploy: {
    enabled: true,
    fields: [
      {
        name: 'updateDependenciesIfNeeded',
        label: 'Update Dependencies If Needed',
        type: 'checkbox',
        defaultValue: false
      }
    ],
    prepareParams: (item: Query, values: any, sourceEnv: Environment, targetEnv: Environment) => {
      return {
        envId: sourceEnv.environmentId,
        targetEnvId: targetEnv.environmentId,
        queryId: item.id,
        updateDependenciesIfNeeded: values.updateDependenciesIfNeeded
      };
    },
    execute: (params: any) => deployQuery(params)
  }
};