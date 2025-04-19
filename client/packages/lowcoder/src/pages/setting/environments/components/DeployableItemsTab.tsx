// components/DeployableItemsTab.tsx
import React from 'react';
import { Card, Button, Divider, Alert, message } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { Environment } from '../types/environment.types';
import { DeployableItem, BaseStats, DeployableItemConfig } from '../types/deployable-item.types';
import { useDeployableItems } from '../hooks/useDeployableItems';
import DeployableItemsList from './DeployableItemsList';

interface DeployableItemsTabProps<T extends DeployableItem, S extends BaseStats> {
  environment: Environment;
  config: DeployableItemConfig<T, S>;
  additionalParams?: Record<string, any>;
  title?: string;
}

function DeployableItemsTab<T extends DeployableItem, S extends BaseStats>({
  environment,
  config,
  additionalParams = {},
  title
}: DeployableItemsTabProps<T, S>) {
  // Use our generic hook with the provided config
  const {
    items,
    stats,
    loading,
    error,
    refreshing,
    toggleManagedStatus,
    refreshItems
  } = useDeployableItems<T, S>(config, environment, additionalParams);

  // Handle toggling managed status
  const handleToggleManaged = async (item: T, checked: boolean) => {
    const success = await toggleManagedStatus(item, checked);
    
    if (success) {
      message.success(`${item.name} is now ${checked ? 'Managed' : 'Unmanaged'}`);
    } else {
      message.error(`Failed to toggle managed state for ${item.name}`);
    }

    return success;
  };

  // Handle refresh button click
  const handleRefresh = () => {
    refreshItems();
    message.info(`Refreshing ${config.pluralLabel.toLowerCase()}...`);
  };

  // Check for missing required environment properties
  const missingProps = config.requiredEnvProps.filter(
    prop => !environment[prop as keyof Environment]
  );

  return (
    <Card>
      {/* Header with refresh button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <Title level={5}>
          {title || `${config.pluralLabel} in this Environment`}
        </Title>
        <Button 
          icon={<SyncOutlined spin={refreshing} />} 
          onClick={handleRefresh}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Render stats using the config's renderStats function */}
      {config.renderStats(stats)}

      <Divider style={{ margin: "16px 0" }} />

      {/* Show error if loading failed */}
      {error && (
        <Alert
          message={`Error loading ${config.pluralLabel.toLowerCase()}`}
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Configuration warnings based on required props */}
      {missingProps.length > 0 && !error && (
        <Alert
          message="Configuration Issue"
          description={
            `Missing required configuration: ${missingProps.join(', ')}`
          }
          type="warning"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Items List */}
      <DeployableItemsList
        items={items}
        loading={loading && !error}
        refreshing={refreshing}
        error={error}
        environment={environment}
        config={config}
        onToggleManaged={config.enableManaged ? handleToggleManaged : undefined}
        additionalParams={additionalParams}
      />
    </Card>
  );
}

export default DeployableItemsTab;