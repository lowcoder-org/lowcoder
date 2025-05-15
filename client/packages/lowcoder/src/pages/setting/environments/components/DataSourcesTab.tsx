import React, { useState, useEffect } from 'react';
import { Card, Button, Divider, Alert, message, Table, Tag, Input, Space, Tooltip } from 'antd';
import { SyncOutlined, CloudUploadOutlined, DatabaseOutlined } from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { Environment } from '../types/environment.types';
import { Workspace } from '../types/workspace.types';
import { DataSource } from '../types/datasource.types';
import { getMergedWorkspaceDataSources } from '../services/datasources.service';
import { Switch, Spin, Empty } from 'antd';
import { ManagedObjectType, setManagedObject, unsetManagedObject } from '../services/managed-objects.service';
import { useDeployModal } from '../context/DeployModalContext';
import { dataSourcesConfig } from '../config/data-sources.config';

const { Search } = Input;

interface DataSourcesTabProps {
  environment: Environment;
  workspace: Workspace;
}

const DataSourcesTab: React.FC<DataSourcesTabProps> = ({ environment, workspace }) => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    types: 0,
    managed: 0,
    unmanaged: 0
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const { openDeployModal } = useDeployModal();

  // Fetch data sources
  const fetchDataSources = async () => {
    if (!workspace.id || !environment) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getMergedWorkspaceDataSources(
        workspace.id,
        environment.environmentId,
        environment.environmentApikey,
        environment.environmentApiServiceUrl!
      );
      
      setDataSources(result.dataSources);
      setStats(result.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data sources");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDataSources();
  }, [environment, workspace]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDataSources();
  };

  // Toggle managed status
  const handleToggleManaged = async (dataSource: DataSource, checked: boolean) => {
    setRefreshing(true);
    try {
      if (checked) {
        await setManagedObject(
          dataSource.gid,
          environment.environmentId,
          ManagedObjectType.DATASOURCE,
          dataSource.name
        );
      } else {
        await unsetManagedObject(
          dataSource.gid,
          environment.environmentId,
          ManagedObjectType.DATASOURCE
        );
      }
      
      // Update the data source in state
      const updatedDataSources = dataSources.map(item => {
        if (item.id === dataSource.id) {
          return { ...item, managed: checked };
        }
        return item;
      });
      
      setDataSources(updatedDataSources);
      
      // Update stats
      const managed = updatedDataSources.filter(ds => ds.managed).length;
      setStats(prev => ({
        ...prev,
        managed,
        unmanaged: prev.total - managed
      }));
      
      message.success(`${dataSource.name} is now ${checked ? 'Managed' : 'Unmanaged'}`);
      return true;
    } catch (error) {
      message.error(`Failed to change managed status for ${dataSource.name}`);
      return false;
    } finally {
      setRefreshing(false);
    }
  };

  // Filter data sources based on search
  const filteredDataSources = searchText
    ? dataSources.filter(ds => 
        ds.name.toLowerCase().includes(searchText.toLowerCase()) || 
        ds.id.toString().toLowerCase().includes(searchText.toLowerCase()))
    : dataSources;

  // Table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="datasource-name">{text}</span>
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color="blue">{type}</Tag>
      ),
    },
    {
      title: 'Managed',
      key: 'managed',
      render: (_: any, dataSource: DataSource) => (
        <Switch
          checked={!!dataSource.managed}
          onChange={(checked: boolean) => handleToggleManaged(dataSource, checked)}
          loading={refreshing}
          size="small"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, dataSource: DataSource) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Tooltip title={!dataSource.managed ? "Data source must be managed before it can be deployed" : "Deploy this data source to another environment"}>
            <Button
              type="primary"
              size="small"
              icon={<CloudUploadOutlined />}
              onClick={() => openDeployModal(dataSource, dataSourcesConfig, environment)}
              disabled={!dataSource.managed}
            >
              Deploy
            </Button>
          </Tooltip>
        </Space>
      ),
    }
  ];

  return (
    <Card>
      {/* Header with refresh button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <Title level={5}>Data Sources in this Workspace</Title>
        <Button 
          icon={<SyncOutlined spin={refreshing} />} 
          onClick={handleRefresh}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Stats display */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Total Data Sources</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.total}</div>
        </div>
        <div>
          <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Types</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.types}</div>
        </div>
        <div>
          <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Managed</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.managed}</div>
        </div>
        <div>
          <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Unmanaged</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.unmanaged}</div>
        </div>
      </div>

      <Divider style={{ margin: "16px 0" }} />

      {/* Error display */}
      {error && (
        <Alert
          message="Error loading data sources"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Configuration warnings */}
      {(!environment.environmentApikey || !environment.environmentApiServiceUrl) && !error && (
        <Alert
          message="Configuration Issue"
          description="Missing required configuration: API key or API service URL"
          type="warning"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <Spin tip="Loading data sources..." />
        </div>
      ) : dataSources.length === 0 ? (
        <Empty
          description={error || "No data sources found in this workspace"}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          {/* Search Bar */}
          <div style={{ marginBottom: 16 }}>
            <Search
              placeholder="Search data sources by name or ID"
              allowClear
              onSearch={value => setSearchText(value)}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
            {searchText && filteredDataSources.length !== dataSources.length && (
              <div style={{ marginTop: 8 }}>
                Showing {filteredDataSources.length} of {dataSources.length} data sources
              </div>
            )}
          </div>
          
          <Table
            columns={columns}
            dataSource={filteredDataSources}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="middle"
            scroll={{ x: 'max-content' }}
          />
        </>
      )}
    </Card>
  );
};

export default DataSourcesTab;