// components/DataSourcesList.tsx
// Create this new file

import React, { useState } from 'react';
import { Table, Switch, Button, Space, Tooltip, Tag } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { DataSource } from '../types/datasource.types';
import { Environment } from '../types/environment.types';
import { ColumnsType } from 'antd/lib/table';
import DeployDataSourceModal from './DeployDataSourceModal';

interface DataSourcesListProps {
  dataSources: DataSource[];
  loading: boolean;
  error: string | null;
  environment: Environment;
  onToggleManaged: (dataSource: DataSource, checked: boolean) => Promise<void>;
  onRefresh?: () => void;
}

const DataSourcesList: React.FC<DataSourcesListProps> = ({
  dataSources,
  loading,
  error,
  environment,
  onToggleManaged,
  onRefresh,
}) => {
  const [deployModalVisible, setDeployModalVisible] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);

  const handleDeploy = (dataSource: DataSource) => {
    setSelectedDataSource(dataSource);
    setDeployModalVisible(true);
  };

  const columns: ColumnsType<DataSource> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      filters: Array.from(new Set(dataSources.map(ds => ds.type)))
        .map(type => ({ text: type, value: type })),
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Status',
      dataIndex: 'datasourceStatus',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'orange'}>
          {status}
        </Tag>
      ),
      filters: Array.from(new Set(dataSources.map(ds => ds.datasourceStatus)))
        .map(status => ({ text: status, value: status })),
      onFilter: (value, record) => record.datasourceStatus === value,
    },
    {
      title: 'DB Name',
      dataIndex: ['datasourceConfig', 'database'],
      key: 'database',
      render: (database: string | null) => database || 'N/A',
    },
    {
      title: 'Managed',
      dataIndex: 'managed',
      key: 'managed',
      render: (managed: boolean, record: DataSource) => (
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
      onFilter: (value, record) => record.managed === Boolean(value),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: DataSource) => (
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
        dataSource={dataSources}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{
          emptyText: error ? error : 'No data sources found',
        }}
      />
      
      <DeployDataSourceModal
        visible={deployModalVisible}
        dataSource={selectedDataSource}
        currentEnvironment={environment}
        onClose={() => setDeployModalVisible(false)}
        onSuccess={onRefresh}
      />
    </>
  );
};

export default DataSourcesList;