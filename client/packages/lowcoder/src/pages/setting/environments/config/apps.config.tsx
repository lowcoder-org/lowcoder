// config/apps.config.tsx
import React from 'react';
import { Row, Col, Statistic, Tag, Space, Button, Tooltip } from 'antd';
import { AppstoreOutlined, CloudUploadOutlined } from '@ant-design/icons';
import {DeployableItemConfig } from '../types/deployable-item.types';
import { Environment } from '../types/environment.types';
import { getMergedWorkspaceApps, deployApp } from '../services/apps.service';
import { connectManagedApp, unconnectManagedApp } from '../services/enterprise.service';
import { App, AppStats } from '../types/app.types';

// Define AppStats interface if not already defined


export const appsConfig: DeployableItemConfig<App, AppStats> = {
  // Basic info
  type: 'apps',
  singularLabel: 'App',
  pluralLabel: 'Apps',
  icon: <AppstoreOutlined />,
  idField: 'id', // or applicationId if you prefer to use that directly
  
  // Navigation
  buildDetailRoute: () => '#',

  
  // Configuration
  requiredEnvProps: ['environmentApikey', 'environmentApiServiceUrl'],
  
  // Stats rendering
  renderStats: (stats) => (
    <Row gutter={16}>
      <Col span={6}>
        <Statistic title="Total Apps" value={stats.total} prefix={<AppstoreOutlined />} />
      </Col>
      <Col span={6}>
        <Statistic title="Published Apps" value={stats.published} prefix={<AppstoreOutlined />} />
      </Col>
      <Col span={6}>
        <Statistic title="Managed Apps" value={stats.managed} prefix={<AppstoreOutlined />} />
      </Col>
      <Col span={6}>
        <Statistic title="Unmanaged Apps" value={stats.unmanaged} prefix={<AppstoreOutlined />} />
      </Col>
    </Row>
  ),
  
  // Stats calculation
  calculateStats: (apps) => {
    const total = apps.length;
    const published = apps.filter(app => app.published).length;
    const managed = apps.filter(app => app.managed).length;
    
    return {
      total,
      published,
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
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'published',
      key: 'published',
      render: (published: boolean) => (
        <Tag color={published ? 'green' : 'orange'}>
          {published ? 'Published' : 'Unpublished'}
        </Tag>
      ),
    },
  ],
  
  // Deployment options
  enableManaged: true,
  
  // Service functions
  fetchItems: async ({ environment, workspaceId }) => {
    if (!workspaceId) {
      throw new Error("Workspace ID is required to fetch apps");
    }
    
    const result = await getMergedWorkspaceApps(
      workspaceId,
      environment.environmentId,
      environment.environmentApikey,
      environment.environmentApiServiceUrl!
    );
    
    // Map to ensure proper id field
    return result.apps.map(app => ({
      ...app,
      id: app.applicationId // Map applicationId to id for DeployableItem compatibility
    }));
  },
  
  toggleManaged: async ({ item, checked, environment }) => {
    try {
      if (checked) {
        await connectManagedApp(environment.environmentId, item.name, item.applicationGid!);
      } else {
        await unconnectManagedApp(item.applicationGid!);
      }
      return true;
    } catch (error) {
      console.error('Error toggling managed status:', error);
      return false;
    }
  },
  // deployment options

  deploy: {
    enabled: true,
    fields: [
      {
        name: 'updateDependenciesIfNeeded',
        label: 'Update Dependencies If Needed',
        type: 'checkbox',
        defaultValue: false
      },
      {
        name: 'publishOnTarget',
        label: 'Publish On Target',
        type: 'checkbox',
        defaultValue: false
      },
      {
        name: 'publicToAll',
        label: 'Public To All',
        type: 'checkbox',
        defaultValue: false
      },
      {
        name: 'publicToMarketplace',
        label: 'Public To Marketplace',
        type: 'checkbox',
        defaultValue: false
      }
    ],
    prepareParams: (item: App, values: any, sourceEnv: Environment, targetEnv: Environment) => {
      return {
        envId: sourceEnv.environmentId,
        targetEnvId: targetEnv.environmentId,
        applicationId: item.applicationId,
        updateDependenciesIfNeeded: values.updateDependenciesIfNeeded,
        publishOnTarget: values.publishOnTarget,
        publicToAll: values.publicToAll,
        publicToMarketplace: values.publicToMarketplace,
      };
    },
    execute: (params: any) => deployApp(params)
  }
};