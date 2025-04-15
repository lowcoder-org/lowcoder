// config/query.config.tsx
import React from 'react';
import { Row, Col, Statistic, Tag } from 'antd';
import { ApiOutlined } from '@ant-design/icons';
import { DeployableItemConfig } from '../types/deployable-item.types';
import { Query } from '../types/query.types';
import { connectManagedQuery, unconnectManagedQuery } from '../services/enterprise.service';
import { getMergedWorkspaceQueries } from '../services/query.service';

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
  
  // Table configuration
  columns: [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Creator',
      dataIndex: 'creatorName',
      key: 'creatorName',
    },
    {
      title: 'Creation Date',
      key: 'createTime',
      render: (_, record: Query) => {
        if (!record.createTime) return 'N/A';
        const date = new Date(record.createTime);
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      },
    },
    {
      title: 'Query Type',
      key: 'queryType',
      render: (_, record: Query) => {
        const queryType = record.libraryQueryDSL?.query?.compType || 'Unknown';
        return <Tag color="blue">{queryType}</Tag>;
      },
    }
  ],
  
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
        await connectManagedQuery(environment.environmentId, item.name, item.gid);
      } else {
        await unconnectManagedQuery(item.gid);
      }
      return true;
    } catch (error) {
      console.error('Error toggling managed status:', error);
      return false;
    }
  }
};