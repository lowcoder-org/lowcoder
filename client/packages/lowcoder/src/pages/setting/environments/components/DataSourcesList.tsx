import React from 'react';
import { Table, Tag, Empty, Spin, Badge, Tooltip } from 'antd';
import { 
  DatabaseOutlined, 
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { DataSourceWithMeta } from '../types/datasource.types';

interface DataSourcesListProps {
  dataSources: DataSourceWithMeta[];
  loading: boolean;
  error?: string | null;
}

/**
 * Component to display a list of data sources in a table
 */
const DataSourcesList: React.FC<DataSourcesListProps> = ({
  dataSources,
  loading,
  error,
}) => {
  // Format timestamp to date string
  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  // Get icon for data source type
  const getDataSourceTypeIcon = (type: string) => {
    return <DatabaseOutlined />;
  };

  // Get color for data source status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return 'green';
      case 'ERROR':
        return 'red';
      case 'WARNING':
        return 'orange';
      default:
        return 'default';
    }
  };

  // Table columns definition
  const columns = [
    {
      title: 'Name',
      key: 'name',
      render: (record: DataSourceWithMeta) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {getDataSourceTypeIcon(record.datasource.type)}
          <span style={{ marginLeft: 8 }}>{record.datasource.name}</span>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: ['datasource', 'type'],
      key: 'type',
      render: (type: string) => (
        <Tag color="blue">{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Created By',
      dataIndex: 'creatorName',
      key: 'creatorName',
      render: (creatorName: string) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <UserOutlined style={{ marginRight: 8 }} />
          <span>{creatorName}</span>
        </div>
      ),
    },
    {
      title: 'Created',
      key: 'createTime',
      render: (record: DataSourceWithMeta) => formatDate(record.datasource.createTime),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: DataSourceWithMeta) => (
        <Tag color={getStatusColor(record.datasource.datasourceStatus)}>
          {record.datasource.datasourceStatus}
        </Tag>
      ),
    },
    {
      title: 'Edit Access',
      dataIndex: 'edit',
      key: 'edit',
      render: (edit: boolean) => (
        <Tooltip title={edit ? 'You can edit this data source' : 'You cannot edit this data source'}>
          {edit ? 
            <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
            <CloseCircleOutlined style={{ color: '#f5222d' }} />
          }
        </Tooltip>
      ),
    },
  ];

  // If loading, show spinner
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <Spin tip="Loading data sources..." />
      </div>
    );
  }

  // If no data sources or error, show empty state
  if (!dataSources || dataSources.length === 0 || error) {
    return (
      <Empty
        description={error || "No data sources found"}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={dataSources}
      rowKey={(record) => record.datasource.id}
      pagination={{ pageSize: 10 }}
      size="middle"
    />
  );
};

export default DataSourcesList;