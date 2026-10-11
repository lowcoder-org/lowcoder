import React, { useState, useEffect } from 'react';
import { Card, Button, Divider, Alert, Table, Tag, Input, Space, Tooltip, Row, Col, Avatar } from 'antd';
import { messageInstance } from 'lowcoder-design/src/components/GlobalInstances';
import { 
  SyncOutlined, 
  CloudUploadOutlined, 
  DatabaseOutlined, 
  AuditOutlined,
  ApiOutlined,
  CheckCircleFilled,
  CloudServerOutlined,
  DisconnectOutlined,
  FilterOutlined
} from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { Environment } from '../types/environment.types';
import { DataSource } from '../types/datasource.types';
import { getMergedWorkspaceDataSources } from '../services/datasources.service';
import { Switch, Spin, Empty } from 'antd';
import { ManagedObjectType, setManagedObject, unsetManagedObject } from '../services/managed-objects.service';
import { useDeployModal } from '../context/DeployModalContext';
import { dataSourcesConfig } from '../config/data-sources.config';
import history from "@lowcoder-ee/util/history";
import { trans } from 'i18n';

const { Search } = Input;

interface DataSourcesTabProps {
  environment: Environment;
  workspaceId: string;
}

const DataSourcesTab: React.FC<DataSourcesTabProps> = ({ environment, workspaceId }) => {
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
  const [showManagedOnly, setShowManagedOnly] = useState(false);

  // Fetch data sources
  const fetchDataSources = async () => {
    if (!workspaceId || !environment) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getMergedWorkspaceDataSources(
        workspaceId,
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
  }, [environment, workspaceId]);

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
      
      messageInstance.success(trans(checked ? "environments.dataSources_managedSuccess" : "environments.dataSources_unmanagedSuccess", { name: dataSource.name }));
      return true;
    } catch (error) {
      messageInstance.error(trans("environments.dataSources_managedError", { name: dataSource.name }));
      return false;
    } finally {
      setRefreshing(false);
    }
  };

  // Filter data sources based on managed status and search
  const filteredDataSources = searchText
    ? dataSources.filter(ds => 
        ds.name.toLowerCase().includes(searchText.toLowerCase()) || 
        ds.id.toString().toLowerCase().includes(searchText.toLowerCase()))
    : dataSources;

  const displayedDataSources = showManagedOnly
    ? filteredDataSources.filter(ds => ds.managed)
    : filteredDataSources;

  // Table columns
  const columns = [
    {
      title: trans("environments.dataSources_dataSource"),
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
      title: trans("environments.dataSources_type"),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getDataSourceColor(type)} style={{ borderRadius: '4px', padding: '2px 12px' }}>
          {type}
        </Tag>
      ),
    },
    {
      title: trans("environments.dataSources_status"),
      key: 'status',
      render: (dataSource: DataSource) => (
        <Tag 
          color={dataSource.managed ? 'processing' : 'default'} 
          style={{ borderRadius: '4px' }}
        >
          {dataSource.managed ? <CloudServerOutlined /> : <DisconnectOutlined />} {dataSource.managed ? trans("environments.dataSources_managed") : trans("environments.dataSources_unmanaged")}
        </Tag>
      ),
    },
    {
      title: trans("environments.dataSources_managed"),
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
      title: trans("environments.workspaces_actions"),
      key: 'actions',
      render: (_: any, dataSource: DataSource) => (
        <Space onClick={(e) => e.stopPropagation()}>
       
          <Tooltip title={!dataSource.managed ? trans("environments.dataSources_dataSourceMustBeManagedToDeploy") : trans("environments.dataSources_deployThisDataSource")}>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={() => openDeployModal(dataSource, dataSourcesConfig, environment)}
              disabled={!dataSource.managed}
            >
              {trans("environments.dataSources_deploy")}
            </Button>
          </Tooltip>
          <Tooltip title={trans("environments.dataSources_viewAuditLogs")}>
            <Button
              icon={<AuditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                const auditUrl = `/setting/audit?environmentId=${environment.environmentId}&orgId=${workspaceId}&datasourceId=${dataSource.id}&pageSize=100&pageNum=1`;
                window.open(auditUrl, '_blank');
              }}
            >
              {trans("environments.dataSources_audit")}
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
        borderRadius: '4px',
        border: '1px solid #f0f0f0'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#8c8c8c', marginBottom: '8px' }}>{title}</div>
          <div style={{ fontSize: '20px', fontWeight: 500 }}>{value}</div>
        </div>
        <div style={{ 
          fontSize: '24px', 
          opacity: 0.8, 
          color: '#52c41a',
          padding: '8px',
          backgroundColor: 'rgba(82, 196, 26, 0.1)',
          borderRadius: '4px',
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
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "20px"
      }}>
        <div>
          <Title level={4} style={{ margin: 0, marginBottom: '4px' }}>
            <DatabaseOutlined style={{ marginRight: 8 }} /> {trans("environments.dataSources_title")}
          </Title>
          <p style={{ marginBottom: 0, color: '#8c8c8c', fontSize: '14px' }}>
            {trans("environments.dataSources_subtitle")}
          </p>
        </div>
        <Button 
          icon={<SyncOutlined spin={refreshing} />} 
          onClick={handleRefresh}
          loading={loading}
        >
          {trans("environments.dataSources_refresh")}
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Alert
          message={trans("environments.dataSources_errorLoadingDataSources")}
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Configuration warnings */}
      {(!environment.environmentApikey || !environment.environmentApiServiceUrl) && !error && (
        <Alert
          message={trans("environments.dataSources_configurationIssue")}
          description={trans("environments.dataSources_missingConfiguration")}
          type="warning"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Stats display */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={12} sm={12} md={6}>
          <StatCard 
            title={trans("environments.dataSources_totalDataSources")} 
            value={stats.total} 
            icon={<DatabaseOutlined />} 
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard 
            title={trans("environments.dataSources_availableTypes")} 
            value={stats.types} 
            icon={<ApiOutlined />} 
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard 
            title={trans("environments.dataSources_managed")} 
            value={stats.managed} 
            icon={<CloudServerOutlined />} 
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard 
            title={trans("environments.dataSources_unmanaged")} 
            value={stats.unmanaged} 
            icon={<DisconnectOutlined />} 
          />
        </Col>
      </Row>

      {/* Content */}
      <Card 
        style={{ 
          borderRadius: '4px',
          border: '1px solid #f0f0f0'
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : dataSources.length === 0 ? (
          <Empty
            description={error || trans("environments.dataSources_noDataSourcesFound")}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            {/* Search and Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <Search
                placeholder={trans("environments.dataSources_searchDataSources")}
                allowClear
                onSearch={value => setSearchText(value)}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 300 }}
              />
              <Button 
                onClick={() => setShowManagedOnly(!showManagedOnly)}
                type={showManagedOnly ? "primary" : "default"}
                icon={<FilterOutlined />}
                style={{ marginLeft: '8px' }}
              >
                {showManagedOnly ? trans("environments.dataSources_showAll") : trans("environments.dataSources_managedOnly")}
              </Button>
            </div>
            
            {searchText &&  displayedDataSources.length !== dataSources.length && (
              <div style={{ marginBottom: 16, color: '#8c8c8c', fontSize: '13px' }}>
                {trans("environments.dataSources_showingResults", { count: displayedDataSources.length, total: dataSources.length })}
              </div>
            )}
            
            <Table
              columns={columns}
              dataSource={displayedDataSources}
              rowKey="id"
              pagination={{ 
                pageSize: 10,
                showTotal: (total, range) => trans("environments.dataSources_paginationTotal", { start: range[0], end: range[1], total }),
                size: 'small'
              }}
              size="middle"
              rowClassName={() => 'datasource-row'}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default DataSourcesTab;