// components/DeployableItemsList.tsx
import React from 'react';
import { Table, Tag, Empty, Spin, Switch, Space, Button, Tooltip } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import history from '@lowcoder-ee/util/history';
import { DeployableItem, BaseStats, DeployableItemConfig } from '../types/deployable-item.types';
import { Environment } from '../types/environment.types';
import { useDeployModal } from '../context/DeployModalContext';

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

  const { openDeployModal } = useDeployModal();

  // Handle row click for navigation
  const handleRowClick = (item: T) => {
    // Skip navigation if the route is just '#' (for non-navigable items)
    if (config.buildDetailRoute({}) === '#') return;
    
    // Build the route using the config and navigate
    const route = config.buildDetailRoute({
      environmentId: environment.environmentId,
      itemId: item[config.idField] as string,
      ...additionalParams
    });
    
    history.push(route);
  };

  // Get columns from config
  const columns = config.getColumns({
    environment,
    refreshing,
    onToggleManaged,
    openDeployModal,
    additionalParams 
    }) 
    

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

  const hasNavigation = config.buildDetailRoute({}) !== '#';

  return (
    <Table
      columns={columns}
      dataSource={items}
      rowKey={config.idField}
      pagination={{ pageSize: 10 }}
      size="middle"
      scroll={{ x: 'max-content' }} 
      onRow={(record) => ({
        onClick: hasNavigation ? () => handleRowClick(record) : undefined,
        style: hasNavigation ? { cursor: 'pointer' } : undefined,
      })}
    />
  );
}

export default DeployableItemsList;