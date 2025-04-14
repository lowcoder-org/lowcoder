// components/AppsTab.tsx
import React from 'react';
import { Card, Button, Row, Col, Statistic, Divider, Alert, message } from 'antd';
import { AppstoreOutlined, SyncOutlined } from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { Environment } from '../types/environment.types';
import { useWorkspaceApps } from '../hooks/useWorkspaceApps';
import AppsList from './AppsList';
import { App } from '../types/app.types';

interface AppsTabProps {
  environment: Environment;
  workspaceId: string;
}

const AppsTab: React.FC<AppsTabProps> = ({ environment, workspaceId }) => {
  const {
    apps,
    stats,
    loading,
    error,
    toggleManagedStatus
  } = useWorkspaceApps(environment, workspaceId);

  const handleToggleManagedApp = async (app: App, checked: boolean) => {
    const success = await toggleManagedStatus(app, checked);
    
    if (success) {
      message.success(`${app.name} is now ${checked ? "Managed" : "Unmanaged"}`);
    } else {
      message.error(`Failed to toggle ${app.name}`);
    }
  };

  return (
    <Card>
      {/* Header with refresh button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={5}>Apps in this Workspace</Title>
      </div>
      
      {/* App Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Statistic 
            title="Total Apps" 
            value={stats.total} 
            prefix={<AppstoreOutlined />} 
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Published Apps" 
            value={stats.published} 
            prefix={<AppstoreOutlined />} 
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Managed Apps" 
            value={stats.managed} 
            prefix={<AppstoreOutlined />} 
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Unmanaged Apps" 
            value={stats.unmanaged} 
            prefix={<AppstoreOutlined />} 
          />
        </Col>
      </Row>
      
      <Divider style={{ margin: '16px 0' }} />
      
      {/* Show error if apps loading failed */}
      {error && (
        <Alert
          message="Error loading apps"
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
                ? "An API key is required to fetch apps for this workspace."
                : "An API service URL is required to fetch apps for this workspace."
            }
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}
      
      {/* Apps List */}
      <AppsList
        apps={apps}
        loading={loading && !error}
        error={error}
        environment={environment}
        onToggleManaged={handleToggleManagedApp}
        />
    </Card>
  );
};

export default AppsTab;