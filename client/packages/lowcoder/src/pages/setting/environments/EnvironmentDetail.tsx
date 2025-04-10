import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { 
  Spin, 
  Typography, 
  Card, 
  Row, 
  Col, 
  Tag, 
  Tabs, 
  Alert, 
  Descriptions, 
  Button,
  Statistic
} from "antd";
import { 
  ReloadOutlined, 
  LinkOutlined, 
  ClusterOutlined, 
  TeamOutlined, 
  UserOutlined 
} from "@ant-design/icons";
import { getEnvironmentById } from "./services/environments.service";
import { Environment } from "./types/environment.types";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * Environment Detail Page Component
 * Shows detailed information about a specific environment
 */
const EnvironmentDetail: React.FC = () => {
  // Get environment ID from URL params
  const { environmentId: id } = useParams<{ environmentId: string }>();
  console.log(id);
  
  // State for environment data and loading state
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch environment data on mount and when ID changes
  useEffect(() => {
    fetchEnvironmentData();
  }, [id]);
  
  // Function to fetch environment data
  const fetchEnvironmentData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getEnvironmentById(id);
      setEnvironment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch environment details');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    fetchEnvironmentData();
  };
  
  // If loading, show spinner
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '50px' }}>
        <Spin size="large" tip="Loading environment details..." />
      </div>
    );
  }
  
  // If error, show error message
  if (error) {
    return (
      <Alert
        message="Error loading environment details"
        description={error}
        type="error"
        showIcon
        style={{ margin: '24px' }}
        action={
          <Button type="primary" icon={<ReloadOutlined />} onClick={handleRefresh}>
            Try Again
          </Button>
        }
      />
    );
  }
  
  // If no environment data, show message
  if (!environment) {
    return (
      <Alert
        message="Environment not found"
        description="The requested environment could not be found"
        type="warning"
        showIcon
        style={{ margin: '24px' }}
      />
    );
  }
  
  return (
    <div className="environment-detail-container" style={{ padding: '24px' }}>
      {/* Header with environment name and controls */}
      <div className="environment-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3}>{environment.environmentName || 'Unnamed Environment'}</Title>
          <Text type="secondary">ID: {environment.environmentId}</Text>
        </div>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </div>
      
      {/* Basic Environment Information Card */}
      <Card 
        title="Environment Overview" 
        style={{ marginBottom: '24px' }}
        extra={environment.isMaster && <Tag color="green">Master</Tag>}
      >
        <Descriptions bordered column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
          <Descriptions.Item label="Domain">
            {environment.environmentFrontendUrl ? (
              <a href={environment.environmentFrontendUrl} target="_blank" rel="noopener noreferrer">
                {environment.environmentFrontendUrl} <LinkOutlined />
              </a>
            ) : (
              'No domain set'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Environment Type">
            <Tag color={environment.environmentType === 'production' ? 'red' : environment.environmentType === 'testing' ? 'orange' : 'blue'}>
              {environment.environmentType}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="API Key Status">
            {environment.environmentApikey ? <Tag color="green">Configured</Tag> : <Tag color="red">Not Configured</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="Master Environment">
            {environment.isMaster ? 'Yes' : 'No'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
      
      {/* Tabs for Workspaces and User Groups */}
      <Tabs defaultActiveKey="workspaces">
        <TabPane 
          tab={<span><ClusterOutlined /> Workspaces</span>} 
          key="workspaces"
        >
          <Card>
            {/* Placeholder for workspace statistics */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={8}>
                <Statistic 
                  title="Total Workspaces" 
                  value={0} 
                  prefix={<ClusterOutlined />} 
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Managed Workspaces" 
                  value={0} 
                  prefix={<ClusterOutlined />} 
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Unmanaged Workspaces" 
                  value={0} 
                  prefix={<ClusterOutlined />} 
                />
              </Col>
            </Row>
            
            {/* Placeholder for workspace list */}
            <Alert
              message="Workspace Information"
              description="Workspace data will be implemented in the next phase. This section will display workspace details and management options."
              type="info"
              showIcon
            />
          </Card>
        </TabPane>
        
        <TabPane 
          tab={<span><TeamOutlined /> User Groups</span>} 
          key="userGroups"
        >
          <Card>
            {/* Placeholder for user group statistics */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={8}>
                <Statistic 
                  title="Total User Groups" 
                  value={0} 
                  prefix={<TeamOutlined />} 
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Total Users" 
                  value={0} 
                  prefix={<UserOutlined />} 
                />
              </Col>
            </Row>
            
            {/* Placeholder for user group list */}
            <Alert
              message="User Group Information"
              description="User group data will be implemented in the next phase. This section will display user group details and membership information."
              type="info"
              showIcon
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default EnvironmentDetail;