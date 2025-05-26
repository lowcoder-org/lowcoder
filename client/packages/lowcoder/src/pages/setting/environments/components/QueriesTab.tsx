import React, { useState, useEffect } from 'react';
import { Card, Button, Divider, Alert, Table, Tag, Input, Space, Tooltip, Row, Col } from 'antd';
import { messageInstance } from 'lowcoder-design/src/components/GlobalInstances';
import { 
  SyncOutlined, 
  CloudUploadOutlined, 
  CodeOutlined, 
  AuditOutlined, 
  UserOutlined,
  CloudServerOutlined,
  DisconnectOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  FilterOutlined
} from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { Environment } from '../types/environment.types';
import { Workspace } from '../types/workspace.types';
import { Query } from '../types/query.types';
import { getMergedWorkspaceQueries } from '../services/query.service';
import { Switch, Spin, Empty, Avatar } from 'antd';
import { ManagedObjectType, setManagedObject, unsetManagedObject } from '../services/managed-objects.service';
import { useDeployModal } from '../context/DeployModalContext';
import { queryConfig } from '../config/query.config';
import history from "@lowcoder-ee/util/history";

const { Search } = Input;

interface QueriesTabProps {
  environment: Environment;
  workspaceId: string;
}

const QueriesTab: React.FC<QueriesTabProps> = ({ environment, workspaceId }) => {
  const [queries, setQueries] = useState<Query[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    managed: 0,
    unmanaged: 0
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const { openDeployModal } = useDeployModal();
  const [showManagedOnly, setShowManagedOnly] = useState(false);

  // Fetch queries
  const fetchQueries = async () => {
    if (!workspaceId || !environment) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getMergedWorkspaceQueries(
        workspaceId,
        environment.environmentId,
        environment.environmentApikey,
        environment.environmentApiServiceUrl!
      );
      
      setQueries(result.queries);
      setStats(result.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch queries");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [environment, workspaceId]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchQueries();
  };

  // Toggle managed status
  const handleToggleManaged = async (query: Query, checked: boolean) => {
    setRefreshing(true);
    try {
      if (checked) {
        await setManagedObject(
          query.gid,
          environment.environmentId,
          ManagedObjectType.QUERY,
        );
      } else {
        await unsetManagedObject(
          query.gid,
          environment.environmentId,
          ManagedObjectType.QUERY
        );
      }
      
      // Update the query in state
      const updatedQueries = queries.map(item => {
        if (item.id === query.id) {
          return { ...item, managed: checked };
        }
        return item;
      });
      
      setQueries(updatedQueries);
      
      // Update stats
      const managed = updatedQueries.filter(q => q.managed).length;
      setStats(prev => ({
        ...prev,
        managed,
        unmanaged: prev.total - managed
      }));
      
      messageInstance.success(`${query.name} is now ${checked ? 'Managed' : 'Unmanaged'}`);
      return true;
    } catch (error) {
      messageInstance.error(`Failed to change managed status for ${query.name}`);
      return false;
    } finally {
      setRefreshing(false);
    }
  };

  // Filter queries based on search
  const filteredQueries = searchText
    ? queries.filter(query => 
        query.name.toLowerCase().includes(searchText.toLowerCase()) || 
        query.id.toLowerCase().includes(searchText.toLowerCase()))
    : queries;

  const displayedQueries = showManagedOnly
    ? filteredQueries.filter(query => query.managed)
    : filteredQueries;

  // Helper function to generate colors from strings
  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Table columns
  const columns = [
    {
      title: 'Query',
      key: 'query',
      render: (query: Query) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            style={{ 
              backgroundColor: stringToColor(query.name),
              marginRight: 12
            }}
            shape="square"
            icon={<CodeOutlined />}
          >
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{query.name}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              {query.id}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Creator',
      dataIndex: 'creatorName',
      key: 'creatorName',
      render: (creatorName: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar 
            size="small" 
            icon={<UserOutlined />} 
            style={{ backgroundColor: '#1890ff' }} 
          />
          {creatorName}
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (query: Query) => (
        <Tag 
          color={query.managed ? 'processing' : 'default'} 
          style={{ borderRadius: '12px' }}
        >
          {query.managed ? <CloudServerOutlined /> : <DisconnectOutlined />} {query.managed ? 'Managed' : 'Unmanaged'}
        </Tag>
      ),
    },
    {
      title: 'Managed',
      key: 'managed',
      render: (_: any, query: Query) => (
        <Switch
          checked={!!query.managed}
          onChange={(checked: boolean) => handleToggleManaged(query, checked)}
          loading={refreshing}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, query: Query) => (
        <Space onClick={(e) => e.stopPropagation()}>
      
          <Tooltip title={!query.managed ? "Query must be managed before it can be deployed" : "Deploy this query to another environment"}>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={() => openDeployModal(query, queryConfig, environment)}
              disabled={!query.managed}
            >
              Deploy
            </Button>
          </Tooltip>
          <Tooltip title="View Audit Logs">
            <Button
              icon={<AuditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                const auditUrl = `/setting/audit?environmentId=${environment.environmentId}&orgId=${workspaceId}&queryId=${query.id}&pageSize=100&pageNum=1`;
                window.open(auditUrl, '_blank');
              }}
            >
              Audit
            </Button>
          </Tooltip>
        </Space>
      ),
    }
  ];

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
        background: 'linear-gradient(135deg, #722ed1 0%, #eb2f96 100%)',
        padding: '20px 24px',
        borderRadius: '8px',
        color: 'white'
      }}>
        <div>
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            <ThunderboltOutlined style={{ marginRight: 10 }} /> Queries
          </Title>
          <p style={{ marginBottom: 0 }}>Manage your workspace API queries</p>
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
          message="Error loading queries"
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
        <Col xs={24} sm={8}>
          <StatCard 
            title="Total Queries" 
            value={stats.total} 
            icon={<CodeOutlined />} 
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard 
            title="Managed" 
            value={stats.managed} 
            icon={<CloudServerOutlined />} 
          />
        </Col>
        <Col xs={24} sm={8}>
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
            <Spin size="large" tip="Loading queries..." />
          </div>
        ) : queries.length === 0 ? (
          <Empty
            description={error || "No queries found in this workspace"}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            {/* Search and Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <Search
                placeholder="Search queries by name or ID"
                allowClear
                onSearch={value => setSearchText(value)}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 300 }}
                size="large"
              />
              <Button 
                onClick={() => setShowManagedOnly(!showManagedOnly)}
                type="default"
                icon={<FilterOutlined />}
                style={{
                  marginLeft: '8px',
                  backgroundColor: showManagedOnly ? '#1890ff' : 'white',
                  color: showManagedOnly ? 'white' : '#1890ff',
                  borderColor: '#1890ff'
                }}
              />
            </div>
            
            {searchText && displayedQueries.length !== queries.length && (
              <div style={{ marginTop: 8, color: '#8c8c8c' }}>
                Showing {displayedQueries.length} of {queries.length} queries
              </div>
            )}
            
            <Table
              columns={columns}
              dataSource={displayedQueries}
              rowKey="id"
              pagination={{ 
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} queries`
              }}
              rowClassName={() => 'query-row'}
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

export default QueriesTab;