import React, { useState } from "react";
import { Typography, Alert, Input, Button, Space, Empty, Card, Spin, Row, Col, Tooltip, Badge } from "antd";
import { SearchOutlined, ReloadOutlined,  CloudServerOutlined} from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import { useEnvironmentContext } from "./context/EnvironmentContext";
import { Environment } from "./types/environment.types";
import EnvironmentsTable from "./components/EnvironmentsTable";
import { buildEnvironmentId } from "@lowcoder-ee/constants/routesURL";
import { getEnvironmentTagColor } from "./utils/environmentUtils";

const { Title, Text } = Typography;

/**
 * Environment Listing Page Component
 * Displays a table of environments
 */
const EnvironmentsList: React.FC = () => {
  // Use the shared context instead of a local hook
  const { 
    environments, 
    isLoading, 
    error,
    refreshEnvironments 
  } = useEnvironmentContext();

  // State for search input
  const [searchText, setSearchText] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Hook for navigation
  const history = useHistory();

  // Filter environments based on search text
  const filteredEnvironments = environments.filter((env) => {
    const searchLower = searchText.toLowerCase();
    return (
      (env.environmentName || "").toLowerCase().includes(searchLower) ||
      (env.environmentFrontendUrl || "").toLowerCase().includes(searchLower) ||
      env.environmentId.toLowerCase().includes(searchLower) ||
      env.environmentType.toLowerCase().includes(searchLower)
    );
  });

  // Handle row click to navigate to environment detail
  const handleRowClick = (record: Environment) => {
    history.push(buildEnvironmentId(record.environmentId));
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshEnvironments();
    setIsRefreshing(false);
  };

  // Count environment types
  const environmentCounts = environments.reduce((counts, env) => {
    const type = env.environmentType.toUpperCase();
    counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  return (
    <div 
      className="environments-container" 
      style={{ 
        padding: "24px",
        flex: 1,
        minWidth: "1000px",
         // Ensure minimum width to prevent excessive shrinking
      }}
    >
      {/* Modern gradient header */}
      <div
        className="environments-header"
        style={{
          marginBottom: "24px",
          background: 'linear-gradient(135deg, #0050b3 0%, #1890ff 100%)',
          padding: '24px 32px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} sm={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                fontSize: '36px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}>
                <CloudServerOutlined />
              </div>
              <div>
                <Title level={2} style={{ margin: '0 0 4px 0', color: 'white' }}>
                  Environments
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px' }}>
                  Manage your deployment environments across dev, test, preprod, and production
                </Text>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
            <Space size="middle">
              <Button
                icon={<ReloadOutlined spin={isRefreshing} />}
                onClick={handleRefresh}
                type="primary"
                ghost
                loading={isLoading && !isRefreshing}
                size="large"
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Environment type stats */}
      {environments.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={24}>
            <Card 
              title="Environment Overview" 
              style={{ 
                borderRadius: '12px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
              headStyle={{ 
                borderBottom: '1px solid #f0f0f0',
                padding: '16px 24px'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <Row gutter={[32, 16]} justify="space-around">
                <Col>
                  <Tooltip title="Total number of environments">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '38px', fontWeight: 600, color: '#1890ff' }}>
                        {environments.length}
                      </div>
                      <div style={{ fontSize: '14px', color: '#8c8c8c', marginTop: '4px' }}>
                        Total Environments
                      </div>
                    </div>
                  </Tooltip>
                </Col>

                {['PROD', 'PREPROD', 'TEST', 'DEV'].map(type => (
                  <Col key={type}>
                    <Tooltip title={`Number of ${type} environments`}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                          fontSize: '38px', 
                          fontWeight: 600, 
                          color: getEnvironmentTagColor(type) === 'default' ? '#8c8c8c' : getEnvironmentTagColor(type) 
                        }}>
                          {environmentCounts[type] || 0}
                        </div>
                        <div style={{ fontSize: '14px', color: '#8c8c8c', marginTop: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                          <Badge color={getEnvironmentTagColor(type)} /> 
                          {type} Environments
                        </div>
                      </div>
                    </Tooltip>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      {/* Main content card */}
      <Card 
        title="Environment List" 
        style={{ 
          borderRadius: '12px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
        headStyle={{ 
          borderBottom: '1px solid #f0f0f0',
          padding: '16px 24px'
        }}
        bodyStyle={{ padding: '24px' }}
        extra={
          <Input
            placeholder="Search environments"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
            allowClear
          />
        }
      >
        {/* Error handling */}
        {error && (
          <Alert
            message="Error loading environments"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: "24px" }}
          />
        )}

        {/* Loading, empty state or table */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Spin size="large" tip="Loading environments..." />
          </div>
        ) : environments.length === 0 && !error ? (
          <Empty
            description="No environments found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '60px 0' }}
          />
        ) : filteredEnvironments.length === 0 ? (
          <Empty
            description="No environments match your search"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '60px 0' }}
          />
        ) : (
          /* Table component */
          <EnvironmentsTable
            environments={filteredEnvironments}
            loading={isLoading}
            onRowClick={handleRowClick}
          />
        )}

        {/* Results counter when searching */}
        {searchText && filteredEnvironments.length !== environments.length && (
          <div style={{ marginTop: 16, color: '#8c8c8c', textAlign: 'right' }}>
            Showing {filteredEnvironments.length} of {environments.length} environments
          </div>
        )}
      </Card>
    </div>
  );
};

export default EnvironmentsList;