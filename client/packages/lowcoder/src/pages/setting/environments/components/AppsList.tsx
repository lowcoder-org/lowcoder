// components/AppsList.tsx
import React, { useState } from 'react';
import { Table, Switch, Button, Space, Tooltip, Tag } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { App } from '../types/app.types';
import { Environment } from '../types/environment.types';
import DeployAppModal from './DeployAppModal';
import { ColumnsType } from 'antd/lib/table';

interface AppsListProps {
  apps: App[];
  loading: boolean;
  error: string | null;
  environment: Environment;
  onToggleManaged: (app: App, checked: boolean) => Promise<void>;
  onRefresh?: () => void; // Make this optional since your current implementation doesn't have it
}

const AppsList: React.FC<AppsListProps> = ({
  apps,
  loading,
  error,
  environment,
  onToggleManaged,
  onRefresh,
}) => {
  const [deployModalVisible, setDeployModalVisible] = useState(false);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);

  const handleDeploy = (app: App) => {
    setSelectedApp(app);
    setDeployModalVisible(true);
  };

  // Cast the value to boolean in onFilter to fix the type issue
  const columns: ColumnsType<App> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: App, b: App) => a.name.localeCompare(b.name),
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
      filters: [
        { text: 'Published', value: true },
        { text: 'Unpublished', value: false },
      ],
      onFilter: (value, record: App) => record.published === Boolean(value),
    },
    {
      title: 'Managed',
      dataIndex: 'managed',
      key: 'managed',
      render: (managed: boolean, record: App) => (
        <Space>
          <Switch
            checked={managed}
            onChange={(checked) => onToggleManaged(record, checked)}
          />
          <Tag color={managed ? 'blue' : 'gray'}>
            {managed ? 'Managed' : 'Unmanaged'}
          </Tag>
        </Space>
      ),
      filters: [
        { text: 'Managed', value: true },
        { text: 'Unmanaged', value: false },
      ],
      onFilter: (value, record: App) => record.managed === Boolean(value),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: App) => (
        <Space>
          <Tooltip title="Deploy to another environment">
            <Button
              icon={<CloudUploadOutlined />}
              onClick={() => handleDeploy(record)}
              type="primary"
              ghost
            >
              Deploy
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        dataSource={apps}
        columns={columns}
        rowKey="applicationId"
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{
          emptyText: error ? error : 'No apps found',
        }}
      />
      
      <DeployAppModal
        visible={deployModalVisible}
        app={selectedApp}
        currentEnvironment={environment}
        onClose={() => setDeployModalVisible(false)}
      />
    </>
  );
};

export default AppsList;