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
import { trans } from 'i18n';

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
      
      messageInstance.success(trans(checked ? "enterprise.environments.queries.managedSuccess" : "enterprise.environments.queries.unmanagedSuccess", { name: query.name }));
      return true;
    } catch (error) {
      messageInstance.error(trans("enterprise.environments.queries.managedError", { name: query.name }));
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
      title: trans("enterprise.environments.queries.query"),
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
      title: trans("enterprise.environments.queries.creator"),
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
      title: trans("enterprise.environments.queries.status"),
      key: 'status',
      render: (query: Query) => (
        <Tag 
          color={query.managed ? 'processing' : 'default'} 
          style={{ borderRadius: '4px' }}
        >
          {query.managed ? <CloudServerOutlined /> : <DisconnectOutlined />} {query.managed ? trans("enterprise.environments.queries.managed") : trans("enterprise.environments.queries.unmanaged")}
        </Tag>
      ),
    },
    {
      title: trans("enterprise.environments.queries.managed"),
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
      title: trans("enterprise.environments.workspaces.actions"),
      key: 'actions',
      render: (_: any, query: Query) => (
        <Space onClick={(e) => e.stopPropagation()}>
      
          <Tooltip title={!query.managed ? trans("enterprise.environments.queries.queryMustBeManagedToDeploy") : trans("enterprise.environments.queries.deployThisQuery")}>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={() => openDeployModal(query, queryConfig, environment)}
              disabled={!query.managed}
            >
              {trans("enterprise.environments.queries.deploy")}
            </Button>
          </Tooltip>
          <Tooltip title={trans("enterprise.environments.queries.viewAuditLogs")}>
            <Button
              icon={<AuditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                const auditUrl = `/setting/audit?environmentId=${environment.environmentId}&orgId=${workspaceId}&queryId=${query.id}&pageSize=100&pageNum=1`;
                window.open(auditUrl, '_blank');
              }}
            >
              {trans("enterprise.environments.queries.audit")}
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
          color: '#722ed1',
          padding: '8px',
          backgroundColor: 'rgba(114, 46, 209, 0.1)',
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
            <ThunderboltOutlined style={{ marginRight: 8 }} /> {trans("enterprise.environments.queries.title")}
          </Title>
          <p style={{ marginBottom: 0, color: '#8c8c8c', fontSize: '14px' }}>
            {trans("enterprise.environments.queries.subtitle")}
          </p>
        </div>
        <Button 
          icon={<SyncOutlined spin={refreshing} />} 
          onClick={handleRefresh}
          loading={loading}
        >
          {trans("enterprise.environments.queries.refresh")}
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Alert
          message={trans("enterprise.environments.queries.errorLoadingQueries")}
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Configuration warnings */}
      {(!environment.environmentApikey || !environment.environmentApiServiceUrl) && !error && (
        <Alert
          message={trans("enterprise.environments.queries.configurationIssue")}
          description={trans("enterprise.environments.queries.missingConfiguration")}
          type="warning"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Stats display */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={8}>
          <StatCard 
            title={trans("enterprise.environments.queries.totalQueries")} 
            value={stats.total} 
            icon={<CodeOutlined />} 
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard 
            title={trans("enterprise.environments.queries.managed")} 
            value={stats.managed} 
            icon={<CloudServerOutlined />} 
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard 
            title={trans("enterprise.environments.queries.unmanaged")} 
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
        ) : queries.length === 0 ? (
          <Empty
            description={error || trans("enterprise.environments.queries.noQueriesFound")}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            {/* Search and Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <Search
                placeholder={trans("enterprise.environments.queries.searchQueries")}
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
                {showManagedOnly ? trans("enterprise.environments.queries.showAll") : trans("enterprise.environments.queries.managedOnly")}
              </Button>
            </div>
            
            {searchText && displayedQueries.length !== queries.length && (
              <div style={{ marginBottom: 16, color: '#8c8c8c', fontSize: '13px' }}>
                {trans("enterprise.environments.queries.showingResults", { count: displayedQueries.length, total: queries.length })}
              </div>
            )}
            
            <Table
              columns={columns}
              dataSource={displayedQueries}
              rowKey="id"
              pagination={{ 
                pageSize: 10,
                showTotal: (total, range) => trans("enterprise.environments.queries.paginationTotal", { start: range[0], end: range[1], total }),
                size: 'small'
              }}
              size="middle"
              rowClassName={() => 'query-row'}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default QueriesTab;