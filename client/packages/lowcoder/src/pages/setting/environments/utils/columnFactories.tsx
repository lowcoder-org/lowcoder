// utils/columnFactories.tsx
import React from 'react';
import { Tag, Space, Switch, Button, Tooltip } from 'antd';
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