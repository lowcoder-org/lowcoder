import React from 'react';
import { Table, Tag, Button, Tooltip, Space } from 'antd';
import { EditOutlined, AuditOutlined} from '@ant-design/icons';
import { Environment } from '../types/environment.types';
import { getEnvironmentTagColor, formatEnvironmentType } from '../utils/environmentUtils';



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
  onRowClick,
}) => {
   // Open audit page in new tab
   const openAuditPage = (environmentId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click from triggering
    const auditUrl = `/setting/audit?environmentId=${environmentId}`;
    window.open(auditUrl, '_blank');
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
        <Tag color={getEnvironmentTagColor(type)}>
          {formatEnvironmentType(type)}
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
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Environment) => (
        <Space size="middle" onClick={e => e.stopPropagation()}>
          <Tooltip title="View Audit Logs">
            <Button 
              icon={<AuditOutlined />} 
              size="small"
              onClick={(e) => openAuditPage(record.environmentId, e)}
            >
              Audit
            </Button>
          </Tooltip>
        </Space>
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