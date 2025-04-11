import React from 'react';
import { Table, Tag, Empty, Spin, Avatar, Tooltip, Switch, Space } from 'antd';
import { 
  AppstoreOutlined, 
  UserOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined 
} from '@ant-design/icons';
import { App } from '../types/app.types';

interface AppsListProps {
  apps: App[];
  loading: boolean;
  error?: string | null;
  onToggleManaged?: (app: App, checked: boolean) => void;

}

/**
 * Component to display a list of apps in a table
 */
const AppsList: React.FC<AppsListProps> = ({
  apps,
  loading,
  error,
  onToggleManaged

}) => {
  // Format timestamp to date string
  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  // Table columns definition
  const columns = [
    {
      title: 'Title',
      key: 'title',
      render: (record: App) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size="small" 
            icon={<AppstoreOutlined />} 
            src={record.icon || undefined} 
            style={{ marginRight: 8 }}
          />
          <span>{record.title || record.name}</span>
        </div>
      ),
    },
    {
      title: 'Created By',
      dataIndex: 'createBy',
      key: 'createBy',
      render: (createBy: string) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
          <span>{createBy}</span>
        </div>
      ),
    },
    {
      title: 'Created',
      key: 'createAt',
      render: (record: App) => formatDate(record.createAt),
    },
    {
      title: 'Last Modified',
      key: 'lastModifyTime',
      render: (record: App) => formatDate(record.lastModifyTime),
    },
    {
      title: 'Published',
      dataIndex: 'published',
      key: 'published',
      render: (published: boolean) => (
        <Tooltip title={published ? 'Published' : 'Not Published'}>
          {published ? 
            <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
            <CloseCircleOutlined style={{ color: '#f5222d' }} />
          }
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'applicationStatus',
      key: 'applicationStatus',
      render: (status: string) => (
        <Tag color={status === 'NORMAL' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Managed',
      key: 'managed',
      render: (record: App) => (
        <Space>
          <Tag color={record.managed ? 'green' : 'default'}>
            {record.managed ? 'Managed' : 'Unmanaged'}
          </Tag>
          <Switch
            size="small"
            checked={record.managed}
            onClick={(checked, e) => {
              e.stopPropagation(); // Prevent navigation
              onToggleManaged?.(record, checked);
            }}
          />
        </Space>
      ),
    },
  ];

  // If loading, show spinner
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <Spin tip="Loading apps..." />
      </div>
    );
  }

  // If no apps or error, show empty state
  if (!apps || apps.length === 0 || error) {
    return (
      <Empty
        description={error || "No apps found"}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={apps}
      rowKey="applicationId"
      pagination={{ pageSize: 10 }}
      size="middle"
    />
  );
};

export default AppsList;