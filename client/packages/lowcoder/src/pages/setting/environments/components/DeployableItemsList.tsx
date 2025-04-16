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

  // Open audit page 
  const openAuditPage = (item: T, e: React.MouseEvent) => {
    e.stopPropagation();
    if (config.audit?.getAuditUrl) {
      const auditUrl = config.audit.getAuditUrl(item, environment, additionalParams);
      window.open(auditUrl, '_blank');
    }
  };

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

  // Determine columns - Use new getColumns method if available, fall back to old approach
  const columns = config.getColumns ? 
    config.getColumns({
      environment,
      refreshing,
      onToggleManaged,
      openDeployModal,
      additionalParams 
    }) :
    generateLegacyColumns();
    
  // Legacy column generation for backward compatibility
  function generateLegacyColumns() {
    let legacyColumns = [...config.columns];
    
    // Add managed column if enabled
    if (config.enableManaged) {
      legacyColumns.push({
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

    // Add deploy action column if enabled
    if (config.deploy?.enabled) {
      legacyColumns.push({
        title: 'Actions',
        key: 'actions',
        render: (_, record: T) => (
          <Space>
            <Tooltip title={`Deploy this ${config.singularLabel.toLowerCase()} to another environment`}>
              <Button
                icon={<CloudUploadOutlined />}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click navigation
                  openDeployModal(record, config, environment);
                }}
                type="primary"
                ghost
              >
                Deploy
              </Button>
            </Tooltip>
          </Space>
        ),
      });
    }

    // Add audit column if enabled
    if (config.audit?.enabled) {
      legacyColumns.push({
        title: 'Audit',
        key: 'audit',
        render: (_, record: T) => (
          <Tooltip title={config.audit?.tooltip || `View audit logs`}>
            <Button
              icon={config.audit?.icon}
              onClick={(e) => openAuditPage(record, e)}
            >
              {config.audit?.label || 'Audit'}
            </Button>
          </Tooltip>
        ),
      });
    }
    
    return legacyColumns;
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

  const hasNavigation = config.buildDetailRoute({}) !== '#';

  return (
    <Table
      columns={columns}
      dataSource={items}
      rowKey={config.idField}
      pagination={{ pageSize: 10 }}
      size="middle"
      onRow={(record) => ({
        onClick: hasNavigation ? () => handleRowClick(record) : undefined,
        style: hasNavigation ? { cursor: 'pointer' } : undefined,
      })}
    />
  );
}

export default DeployableItemsList;