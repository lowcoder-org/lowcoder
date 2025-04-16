// config/data-sources.config.tsx
import React from 'react';
import { Row, Col, Statistic, Tag, Space, Button, Tooltip } from 'antd';
import { DatabaseOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { DeployableItemConfig } from '../types/deployable-item.types';
import { DataSource, DataSourceStats } from '../types/datasource.types';
import { Environment } from '../types/environment.types';
import { getMergedWorkspaceDataSources, deployDataSource } from '../services/datasources.service';
import { connectManagedDataSource, unconnectManagedDataSource } from '../services/enterprise.service';



export const dataSourcesConfig: DeployableItemConfig<DataSource, DataSourceStats> = {
  // Basic info
  type: 'dataSources',
  singularLabel: 'Data Source',
  pluralLabel: 'Data Sources',
  icon: <DatabaseOutlined />,
  idField: 'id',
  
  // Navigation
  buildDetailRoute: (params) => "#",
  
  // Configuration
  requiredEnvProps: ['environmentApikey', 'environmentApiServiceUrl'],
  
  // Stats rendering
  renderStats: (stats) => (
    <Row gutter={16}>
      <Col span={8}>
        <Statistic title="Total Data Sources" value={stats.total} prefix={<DatabaseOutlined />} />
      </Col>
      <Col span={8}>
        <Statistic title="Managed Data Sources" value={stats.managed} prefix={<DatabaseOutlined />} />
      </Col>
      <Col span={8}>
        <Statistic title="Unmanaged Data Sources" value={stats.unmanaged} prefix={<DatabaseOutlined />} />
      </Col>
    </Row>
  ),
  
  // Stats calculation
  calculateStats: (dataSources) => {
    const total = dataSources.length;
    const managed = dataSources.filter(ds => ds.managed).length;
    
    // Calculate counts by type
    const byType = dataSources.reduce((acc, ds) => {
      const type = ds.type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total,
      managed,
      unmanaged: total - managed,
      byType
    };
  },
  
  // Table configuration - Customize based on your existing UI
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
      render: (_, record: DataSource) => (
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
  
  // Deployment options
  enableManaged: true,
  
  // Service functions
  fetchItems: async ({ environment, workspaceId }) => {
    if (!workspaceId) {
      throw new Error("Workspace ID is required to fetch data sources");
    }
    
    const result = await getMergedWorkspaceDataSources(
      workspaceId,
      environment.environmentId,
      environment.environmentApikey,
      environment.environmentApiServiceUrl!
    );
    
    return result.dataSources;
  },
  
  toggleManaged: async ({ item, checked, environment }) => {
    try {
      if (checked) {
        await connectManagedDataSource(environment.environmentId, item.name, item.gid);
      } else {
        await unconnectManagedDataSource(item.gid);
      }
      return true;
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
    prepareParams: (item: DataSource, values: any, sourceEnv: Environment, targetEnv: Environment) => {
      return {
        envId: sourceEnv.environmentId,
        targetEnvId: targetEnv.environmentId,
        datasourceId: item.id,
        updateDependenciesIfNeeded: values.updateDependenciesIfNeeded
      };
    },
    execute: (params: any) => deployDataSource(params)
  }
};