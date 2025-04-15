// components/DeployableItemsList.tsx
import React from 'react';
import { Table, Tag, Empty, Spin, Switch, Space } from 'antd';
import history from '@lowcoder-ee/util/history';
import { DeployableItem, BaseStats, DeployableItemConfig } from '../types/deployable-item.types';
import { Environment } from '../types/environment.types';

interface DeployableItemsListProps<T extends DeployableItem, S extends BaseStats> {
  items: T[];
  loading: boolean;
  refreshing: boolean;
  error?: string | null;
  environment: Environment;
  config: DeployableItemConfig<T, S>;
  onToggleManaged?: (item: T, checked: boolean) => Promise<boolean>;
  additionalParams?: Record<string, any>;
}

function DeployableItemsList<T extends DeployableItem, S extends BaseStats>({
  items,
  loading,
  refreshing,
  error,
  environment,
  config,
  onToggleManaged,
  additionalParams = {}
}: DeployableItemsListProps<T, S>) {
  // Handle row click for navigation
  const handleRowClick = (item: T) => {
    // Build the route using the config and navigate
    const route = config.buildDetailRoute({
      environmentId: environment.environmentId,
      itemId: item[config.idField] as string,
      ...additionalParams
    });
    
    history.push(route);
  };

  // Generate columns based on config
  let columns = [...config.columns];
  
  // Add managed column if enabled
  if (config.enableManaged) {
    columns.push({
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
    });
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <Spin tip={`Loading ${config.pluralLabel.toLowerCase()}...`} />
      </div>
    );
  }

  if (!items || items.length === 0 || error) {
    return (
      <Empty
        description={error || `No ${config.pluralLabel.toLowerCase()} found`}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={items}
      rowKey={config.idField}
      pagination={{ pageSize: 10 }}
      size="middle"
      onRow={(record) => ({
        onClick: () => handleRowClick(record),
        style: { cursor: 'pointer' },
      })}
    />
  );
}

export default DeployableItemsList;