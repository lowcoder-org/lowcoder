import React, { useState, useEffect } from 'react';
import { Card, Button, Divider, Alert, message, Table, Tag, Input, Space, Tooltip } from 'antd';
import { SyncOutlined, CloudUploadOutlined, CodeOutlined } from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { Environment } from '../types/environment.types';
import { Workspace } from '../types/workspace.types';
import { Query } from '../types/query.types';
import { getMergedWorkspaceQueries } from '../services/query.service';
import { Switch, Spin, Empty } from 'antd';
import { ManagedObjectType, setManagedObject, unsetManagedObject } from '../services/managed-objects.service';
import { useDeployModal } from '../context/DeployModalContext';
import { queryConfig } from '../config/query.config';

const { Search } = Input;

interface QueriesTabProps {
  environment: Environment;
  workspace: Workspace;
}

const QueriesTab: React.FC<QueriesTabProps> = ({ environment, workspace }) => {
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

  // Fetch queries
  const fetchQueries = async () => {
    if (!workspace.id || !environment) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getMergedWorkspaceQueries(
        workspace.id,
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
  }, [environment, workspace]);

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
          query.name
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
      
      message.success(`${query.name} is now ${checked ? 'Managed' : 'Unmanaged'}`);
      return true;
    } catch (error) {
      message.error(`Failed to change managed status for ${query.name}`);
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

  // Table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="query-name">{text}</span>
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
    },
    {
      title: 'Creator',
      dataIndex: 'creatorName',
      key: 'creatorName',
    },
    {
      title: 'Managed',
      key: 'managed',
      render: (_: any, query: Query) => (
        <Switch
          checked={!!query.managed}
          onChange={(checked: boolean) => handleToggleManaged(query, checked)}
          loading={refreshing}
          size="small"
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
              size="small"
              icon={<CloudUploadOutlined />}
              onClick={() => openDeployModal(query, queryConfig, environment)}
              disabled={!query.managed}
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
        <Title level={5}>Queries in this Workspace</Title>
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
          <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Total Queries</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{stats.total}</div>
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
          message="Error loading queries"
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
          <Spin tip="Loading queries..." />
        </div>
      ) : queries.length === 0 ? (
        <Empty
          description={error || "No queries found in this workspace"}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          {/* Search Bar */}
          <div style={{ marginBottom: 16 }}>
            <Search
              placeholder="Search queries by name or ID"
              allowClear
              onSearch={value => setSearchText(value)}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
            {searchText && filteredQueries.length !== queries.length && (
              <div style={{ marginTop: 8 }}>
                Showing {filteredQueries.length} of {queries.length} queries
              </div>
            )}
          </div>
          
          <Table
            columns={columns}
            dataSource={filteredQueries}
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

export default QueriesTab;