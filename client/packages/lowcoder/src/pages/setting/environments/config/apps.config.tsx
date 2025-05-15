// config/apps.config.tsx
import React from 'react';
import { Row, Col, Statistic, Tag, Space, Button, Tooltip } from 'antd';
import { AppstoreOutlined, AuditOutlined } from '@ant-design/icons';
import {DeployableItemConfig } from '../types/deployable-item.types';
import { Environment } from '../types/environment.types';
import { getMergedWorkspaceApps, deployApp } from '../services/apps.service';
import { connectManagedApp, unconnectManagedApp } from '../services/enterprise.service'; 
import { ManagedObjectType, setManagedObject, unsetManagedObject } from '../services/managed-objects.service';
import { App, AppStats } from '../types/app.types';


import { 
  createNameColumn, 
  createDescriptionColumn, 
  createPublishedColumn, 
  createManagedColumn, 
  createDeployColumn,
  createAuditColumn, 
  createIdColumn
} from '../utils/columnFactories';

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
  getColumns: ({ environment, refreshing, onToggleManaged, openDeployModal, additionalParams }) => {
    const columns = [
      createIdColumn<App>(),
      createNameColumn<App>(),
      createPublishedColumn<App>(),
    ];
    
    // Add managed column if enabled
    if (appsConfig.enableManaged && onToggleManaged) {
      columns.push(createManagedColumn(onToggleManaged, refreshing));
    }
    
    // Add deploy column if enabled
    if (appsConfig.deploy?.enabled && openDeployModal) {
      columns.push(createDeployColumn(appsConfig, environment, openDeployModal));
    }
    
    // Add audit column if enabled
    if (appsConfig.audit?.enabled) {
      columns.push(createAuditColumn(appsConfig, environment, additionalParams));
    }
    
    return columns;
  },

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
  audit: {
    enabled: true,
    icon: <AuditOutlined />,
    label: 'Audit',
    tooltip: 'View audit logs for this app',
    getAuditUrl: (item, environment, additionalParams) => {
      console.log("Additional params:", additionalParams);
      return `/setting/audit?environmentId=${environment.environmentId}&orgId=${item.id}&appId=${additionalParams?.workspaceId}&pageSize=100&pageNum=1`
    }
  },
  toggleManaged: async ({ item, checked, environment }) => {
    try {
      if (checked) {
        // Connect the app as managed
        await setManagedObject(
          item.applicationGid!,
          environment.environmentId,
          ManagedObjectType.APP,
          item.name
        );
      } else {
        // Disconnect the managed app
        await unsetManagedObject(
          item.applicationGid!,
          environment.environmentId,
          ManagedObjectType.APP
        );
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