import React from 'react';
import { Table, Tag } from 'antd';
import { Environment } from '../types/environment.types';

interface EnvironmentsTableProps {
  environments: Environment[];
  loading: boolean;
  onRowClick: (record: Environment) => void;
}

/**
 * Table component for displaying environments
 */
const EnvironmentsTable: React.FC<EnvironmentsTableProps> = ({
  environments,
  loading,
  onRowClick
}) => {
  // Get color for environment type/stage
  const getTypeColor = (type: string): string => {
    switch (type.toUpperCase()) {
      case 'DEV': return 'blue';
      case 'TEST': return 'orange';
      case 'PROD': return 'green';
      default: return 'default';
    }
  };

  // Define table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'environmentName',
      key: 'environmentName',
      render: (name: string) => name || 'Unnamed Environment',
    },
    {
      title: 'Domain',
      dataIndex: 'environmentFrontendUrl',
      key: 'environmentFrontendUrl',
      render: (url: string) => url || 'No URL',
    },
    {
      title: 'ID',
      dataIndex: 'environmentId',
      key: 'environmentId',
    },
    {
      title: 'Stage',
      dataIndex: 'environmentType',
      key: 'environmentType',
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Master',
      dataIndex: 'isMaster',
      key: 'isMaster',
      render: (isMaster: boolean) => (
        <Tag color={isMaster ? 'green' : 'default'}>
          {isMaster ? 'Yes' : 'No'}
        </Tag>
      ),
    },
  ];

  return (
    <Table
      dataSource={environments}
      columns={columns}
      rowKey="environmentId"
      loading={loading}
      pagination={{ 
        pageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50']
      }}
      onRow={(record) => ({
        onClick: () => onRowClick(record),
        style: { 
          cursor: 'pointer',
          transition: 'background-color 0.3s',
          ':hover': {
            backgroundColor: '#f5f5f5',
          }
        }
      })}
      rowClassName={() => 'environment-row'}
    />
  );
};

export default EnvironmentsTable;