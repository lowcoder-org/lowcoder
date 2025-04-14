// components/DataSourcesTab.tsx
// Create this new file

import React from 'react';
import { Card, Button, Row, Col, Statistic, Divider, Alert, message } from 'antd';
import { DatabaseOutlined, SyncOutlined } from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { Environment } from '../types/environment.types';
import { useWorkspaceDataSources } from '../hooks/useWorkspaceDataSources';
import DataSourcesList from './DataSourcesList';
import { DataSource } from '../types/datasource.types';

interface DataSourcesTabProps {
  environment: Environment;
  workspaceId: string;
}

const DataSourcesTab: React.FC<DataSourcesTabProps> = ({ environment, workspaceId }) => {
  const {
    dataSources,
    stats,
    loading,
    error,
    toggleManagedStatus
  } = useWorkspaceDataSources(environment, workspaceId);

  const handleToggleManagedDataSource = async (dataSource: DataSource, checked: boolean) => {
    const success = await toggleManagedStatus(dataSource, checked);
    
    if (success) {
      message.success(`${dataSource.name} is now ${checked ? "Managed" : "Unmanaged"}`);
    } else {
      message.error(`Failed to toggle ${dataSource.name}`);
    }
  };

  return (
    <Card>
      {/* Header with refresh button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={5}>Data Sources in this Workspace</Title>
      </div>
      
      {/* Data Source Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Statistic 
            title="Total Data Sources" 
            value={stats.total} 
            prefix={<DatabaseOutlined />} 
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Data Source Types" 
            value={stats.types} 
            prefix={<DatabaseOutlined />} 
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Managed Data Sources" 
            value={stats.managed} 
            prefix={<DatabaseOutlined />} 
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Unmanaged Data Sources" 
            value={stats.unmanaged} 
            prefix={<DatabaseOutlined />} 
          />
        </Col>
      </Row>
      
      <Divider style={{ margin: '16px 0' }} />
      
      {/* Show error if data sources loading failed */}
      {error && (
        <Alert
          message="Error loading data sources"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
         
        />
      )}
      
      {/* Configuration warning */}
      {(!environment.environmentApikey ||
        !environment.environmentApiServiceUrl) &&
        !error && (
          <Alert
            message="Configuration Issue"
            description={
              !environment.environmentApikey
                ? "An API key is required to fetch data sources for this workspace."
                : "An API service URL is required to fetch data sources for this workspace."
            }
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}
      
      {/* Data Sources List */}
      <DataSourcesList
        dataSources={dataSources}
        loading={loading && !error}
        error={error}
        environment={environment}
        onToggleManaged={handleToggleManagedDataSource}
      />
    </Card>
  );
};

export default DataSourcesTab;