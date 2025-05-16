import React, { useState, useEffect } from 'react';
import { Card, Button, Divider, Alert, message, Table, Tag, Input, Space, Tooltip, Row, Col } from 'antd';
import { 
  SyncOutlined, 
  CloudUploadOutlined, 
  DatabaseOutlined, 
  AuditOutlined,
  ApiOutlined,
  CheckCircleFilled,
  CloudServerOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { Environment } from '../types/environment.types';
import { Workspace } from '../types/workspace.types';
import { DataSource } from '../types/datasource.types';
import { getMergedWorkspaceDataSources } from '../services/datasources.service';
import { Switch, Spin, Empty, Avatar } from 'antd';
import { ManagedObjectType, setManagedObject, unsetManagedObject } from '../services/managed-objects.service';
import { useDeployModal } from '../context/DeployModalContext';
import { dataSourcesConfig } from '../config/data-sources.config';
import history from "@lowcoder-ee/util/history";

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
      title: 'Data Source',
      key: 'datasource',
      render: (dataSource: DataSource) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            style={{ 
              backgroundColor: getDataSourceColor(dataSource.type),
              marginRight: 12
            }}
            shape="square"
            icon={<DatabaseOutlined />}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{dataSource.name}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              {dataSource.id}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getDataSourceColor(type)} style={{ borderRadius: '12px', padding: '2px 12px' }}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (dataSource: DataSource) => (
        <Tag 
          color={dataSource.managed ? 'processing' : 'default'} 
          style={{ borderRadius: '12px' }}
        >
          {dataSource.managed ? <CloudServerOutlined /> : <DisconnectOutlined />} {dataSource.managed ? 'Managed' : 'Unmanaged'}
        </Tag>
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
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, dataSource: DataSource) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View Audit Logs">
            <Button
              icon={<AuditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                const auditUrl = `/setting/audit?environmentId=${environment.environmentId}&orgId=${workspace.id}&datasourceId=${dataSource.id}&pageSize=100&pageNum=1`;
                window.open(auditUrl, '_blank');
              }}
            >
              Audit
            </Button>
          </Tooltip>
          <Tooltip title={!dataSource.managed ? "Data source must be managed before it can be deployed" : "Deploy this data source to another environment"}>
            <Button
              type="primary"
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

  // Helper function to get color based on data source type
  const getDataSourceColor = (type: string) => {
    const colorMap: {[key: string]: string} = {
      'mysql': '#4479A1',
      'postgres': '#336791',
      'mongodb': '#4DB33D',
      'redis': '#DC382D',
      'rest': '#FF6C37',
      'graphql': '#E10098',
      'elasticsearch': '#005571',
      'oracle': '#F80000',
      'mssql': '#CC2927',
      'snowflake': '#29B5E8'
    };
    
    return colorMap[type.toLowerCase()] || '#1890ff';
  };

  // Stat card component
  const StatCard = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => (
    <Card 
      style={{ 
        height: '100%', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '8px' }}>{title}</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{value}</div>
        </div>
        <div style={{ 
          fontSize: '28px', 
          opacity: 0.8, 
          color: '#1890ff',
          padding: '12px',
          backgroundColor: 'rgba(24, 144, 255, 0.1)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
      </div>
    </Card>
  );

  return (
    <div style={{ padding: '16px 0' }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "24px",
        background: 'linear-gradient(135deg, #1890ff 0%, #13c2c2 100%)',
        padding: '20px 24px',
        borderRadius: '8px',
        color: 'white'
      }}>
        <div>
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            <DatabaseOutlined style={{ marginRight: 10 }} /> Data Sources
          </Title>
          <p style={{ marginBottom: 0 }}>Manage your workspace data connections</p>
        </div>
        <Button 
          icon={<SyncOutlined spin={refreshing} />} 
          onClick={handleRefresh}
          loading={loading}
          type="default"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderColor: 'rgba(255, 255, 255, 0.4)',
            color: 'white',
            fontWeight: 500
          }}
        >
          Refresh
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Alert
          message="Error loading data sources"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: "20px" }}
        />
      )}

      {/* Configuration warnings */}
      {(!environment.environmentApikey || !environment.environmentApiServiceUrl) && !error && (
        <Alert
          message="Configuration Issue"
          description="Missing required configuration: API key or API service URL"
          type="warning"
          showIcon
          style={{ marginBottom: "20px" }}
        />
      )}

      {/* Stats display */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={12} md={6}>
          <StatCard 
            title="Total Data Sources" 
            value={stats.total} 
            icon={<DatabaseOutlined />} 
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard 
            title="Available Types" 
            value={stats.types} 
            icon={<ApiOutlined />} 
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard 
            title="Managed" 
            value={stats.managed} 
            icon={<CloudServerOutlined />} 
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard 
            title="Unmanaged" 
            value={stats.unmanaged} 
            icon={<DisconnectOutlined />} 
          />
        </Col>
      </Row>

      {/* Content */}
      <Card 
        style={{ 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Spin size="large" tip="Loading data sources..." />
          </div>
        ) : dataSources.length === 0 ? (
          <Empty
            description={error || "No data sources found in this workspace"}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            {/* Search Bar */}
            <div style={{ marginBottom: 20 }}>
              <Search
                placeholder="Search data sources by name or ID"
                allowClear
                onSearch={value => setSearchText(value)}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 300 }}
                size="large"
              />
              {searchText && filteredDataSources.length !== dataSources.length && (
                <div style={{ marginTop: 8, color: '#8c8c8c' }}>
                  Showing {filteredDataSources.length} of {dataSources.length} data sources
                </div>
              )}
            </div>
            
            <Table
              columns={columns}
              dataSource={filteredDataSources}
              rowKey="id"
              pagination={{ 
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} data sources`
              }}
              rowClassName={() => 'datasource-row'}
              style={{ 
                borderRadius: '8px', 
                overflow: 'hidden'
              }}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default DataSourcesTab;