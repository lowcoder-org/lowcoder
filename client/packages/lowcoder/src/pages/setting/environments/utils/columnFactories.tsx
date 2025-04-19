// utils/columnFactories.tsx
import React from 'react';
import { Tag, Space, Switch, Button, Tooltip, Badge} from 'antd';
import { CloudUploadOutlined, AuditOutlined } from '@ant-design/icons';
import { ColumnType } from 'antd/lib/table';
import { DeployableItem, DeployableItemConfig, BaseStats } from '../types/deployable-item.types';
import { Environment } from '../types/environment.types';

// Base columns for workspace
export function createNameColumn<T extends { name: string }>(): ColumnType<T> {
  return {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  };
}

export function createIdColumn<T extends { id: string }>(): ColumnType<T> {
  return {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    ellipsis: true,
  };
}

export function createRoleColumn<T extends { role?: string }>(): ColumnType<T> {
  return {
    title: 'Role',
    dataIndex: 'role',
    key: 'role',
    render: (role: string) => <span>{role}</span>,
  };
}

export function createDateColumn<T>(
  dateField: string,
  title: string
): ColumnType<T> {
  return {
    title: title,
    key: dateField,
    render: (_, record: any) => {
      if (!record[dateField]) return 'N/A';
      const date = new Date(record[dateField]);
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    },
  };
}

export function createStatusColumn<T extends { status?: string }>(): ColumnType<T> {
  return {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => (
      <Tag color={status === 'ACTIVE' ? 'green' : 'red'} className="status-tag">
        {status}
      </Tag>
    ),
  };
}

// Feature columns
export function createManagedColumn<T extends DeployableItem>(
  onToggleManaged?: (item: T, checked: boolean) => Promise<boolean>,
  refreshing: boolean = false
): ColumnType<T> {
  return {
    title: 'Managed',
    key: 'managed',
    render: (_, record: T) => (
      <Space>
        <Tag color={record.managed ? 'green' : 'default'}>
          {record.managed ? 'Managed' : 'Unmanaged'}
        </Tag>
        {onToggleManaged && (
          <Switch
            size="small"
            checked={!!record.managed}
            loading={refreshing}
            onClick={(checked, e) => {
              e.stopPropagation(); // Stop row click event
              onToggleManaged(record, checked);
            }}
            onChange={() => {}}
          />
        )}
      </Space>
    ),
  };
}

export function createAuditColumn<T extends DeployableItem>(
  config: DeployableItemConfig<T, any>,
  environment: Environment,
  additionalParams: Record<string, any> = {}
): ColumnType<T> {
  return {
    title: 'Audit',
    key: 'audit',
    render: (_, record: T) => {
      const openAuditPage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (config.audit?.getAuditUrl) {
          const auditUrl = config.audit.getAuditUrl(record, environment, additionalParams);
          window.open(auditUrl, '_blank');
        }
      };
      
      return (
        <Tooltip title={config.audit?.tooltip || `View audit logs`}>
          <Button
            icon={config.audit?.icon || <AuditOutlined />}
            onClick={openAuditPage}
          >
            {config.audit?.label || 'Audit'}
          </Button>
        </Tooltip>
      );
    },
  };
}


export function createDescriptionColumn<T extends { description?: string }>(): ColumnType<T> {
  return {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  };
}


export function createDeployColumn<T extends DeployableItem, S extends BaseStats>(
  config: DeployableItemConfig<T, S>,
  environment: Environment,
  openDeployModal: (item: T, config: DeployableItemConfig<T, S>, environment: Environment) => void
): ColumnType<T> {
  return {
    title: 'Actions',
    key: 'actions',
    render: (_, record: T) => {
      // Check if the item is managed
      const isManaged = record.managed === true;
      
      return (
        <Space>
          <Tooltip title={isManaged 
            ? `Deploy this ${config.singularLabel.toLowerCase()} to another environment` 
            : `Item must be managed before it can be deployed`}
          >
            <Button
              icon={<CloudUploadOutlined />}
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click navigation
                if (isManaged) {
                  openDeployModal(record, config, environment);
                }
              }}
              type="primary"
              ghost
              disabled={!isManaged}
            >
              Deploy
            </Button>
          </Tooltip>
        </Space>
      );
    },
  };
}

// App-specific columns
export function createPublishedColumn<T extends { published?: boolean }>(): ColumnType<T> {
  return {
    title: 'Status',
    dataIndex: 'published',
    key: 'published',
    render: (published: boolean) => (
      <Tag color={published ? 'green' : 'orange'}>
        {published ? 'Published' : 'Unpublished'}
      </Tag>
    ),
  };
}

// Data Source specific columns
export function createTypeColumn<T extends { type?: string }>(): ColumnType<T> {
  return {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    render: (type: string) => (
      <Tag color="blue">{type || 'Unknown'}</Tag>
    ),
  };
}

export function createDatabaseColumn<T extends { datasourceConfig?: { database?: string | null } }>(): ColumnType<T> {
  return {
    title: 'Database',
    key: 'database',
    render: (_, record: T) => (
      <span>{record.datasourceConfig?.database || 'N/A'}</span>
    ),
  };
}

export function createDatasourceStatusColumn<T extends { datasourceStatus?: string }>(): ColumnType<T> {
  return {
    title: 'Status',
    dataIndex: 'datasourceStatus',
    key: 'status',
    render: (status: string) => (
      <Tag color={status === 'NORMAL' ? 'green' : 'red'}>
        {status}
      </Tag>
    ),
  };
}


// Query-specific column factories to add to columnFactories.tsx
export function createCreatorColumn<T extends { creatorName?: string }>(): ColumnType<T> {
  return {
    title: 'Creator',
    dataIndex: 'creatorName',
    key: 'creatorName',
  };
}

export function createQueryTypeColumn<T extends { libraryQueryDSL?: { query?: { compType?: string } } }>(): ColumnType<T> {
  return {
    title: 'Query Type',
    key: 'queryType',
    render: (_, record: T) => {
      const queryType = record.libraryQueryDSL?.query?.compType || 'Unknown';
      return <Tag color="blue">{queryType}</Tag>;
    },
  };
}

export function createUserGroupNameColumn<T extends { 
  groupName?: string; 
  allUsersGroup?: boolean; 
  devGroup?: boolean;
}>(): ColumnType<T> {
  return {
    title: 'Name',
    dataIndex: 'groupName',
    key: 'groupName',
    render: (name: string, record: T) => (
      <div>
        <span>{record.groupName}</span>
        {record.allUsersGroup && (
          <Tag color="blue" style={{ marginLeft: 8 }}>All Users</Tag>
        )}
        {record.devGroup && (
          <Tag color="orange" style={{ marginLeft: 8 }}>Dev</Tag>
        )}
      </div>
    ),
  };
}

export function createGroupIdColumn<T extends { groupId?: string }>(): ColumnType<T> {
  return {
    title: 'ID',
    dataIndex: 'groupId',
    key: 'groupId',
    ellipsis: true,
  };
}

export function createUserCountColumn<T extends { 
  stats?: { userCount: number; adminUserCount: number; }
}>(): ColumnType<T> {
  return {
    title: 'Users',
    key: 'userCount',
    render: (_, record: T) => (
      <div>
        <Badge count={record.stats?.userCount || 0} showZero style={{ backgroundColor: '#52c41a' }} />
        <span style={{ marginLeft: 8 }}>
          ({record.stats?.adminUserCount || 0} admin{(record.stats?.adminUserCount || 0) !== 1 ? 's' : ''})
        </span>
      </div>
    ),
  };
}

export function createGroupTypeColumn<T extends { 
  allUsersGroup?: boolean; 
  devGroup?: boolean;
  syncGroup?: boolean;
}>(): ColumnType<T> {
  return {
    title: 'Type',
    key: 'type',
    render: (_, record: T) => {
      if (record.allUsersGroup) return <Tag color="blue">Global</Tag>;
      if (record.devGroup) return <Tag color="orange">Dev</Tag>;
      if (record.syncGroup) return <Tag color="purple">Sync</Tag>;
      return <Tag color="default">Standard</Tag>;
    },
  };
}