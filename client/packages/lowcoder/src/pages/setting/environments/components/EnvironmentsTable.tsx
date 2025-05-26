import React from 'react';
import { Table, Tag, Button, Tooltip, Space, Card, Row, Col, Typography, Avatar, Spin, Alert } from 'antd';
import { EditOutlined, AuditOutlined, LinkOutlined, EnvironmentOutlined, StarFilled, CloudServerOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { Environment } from '../types/environment.types';
import { getEnvironmentTagColor, formatEnvironmentType } from '../utils/environmentUtils';

const { Text, Title } = Typography;

interface EnvironmentsTableProps {
  environments: Environment[];
  loading: boolean;
  onRowClick: (record: Environment) => void;
}

/**
 * Modern card-based layout for displaying environments
 */
const EnvironmentsTable: React.FC<EnvironmentsTableProps> = ({
  environments,
  loading,
  onRowClick,
}) => {
  // Open audit page in new tab
  const openAuditPage = (environmentId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click from triggering
    const auditUrl = `/setting/audit?environmentId=${environmentId}`;
    window.open(auditUrl, '_blank');
  };

  // Handle row click with license check
  const handleRowClick = (env: Environment) => {
    if (env.isLicensed === false) {
      // Prevent navigation for unlicensed environments
      return;
    }
    onRowClick(env);
  };

  // Generate background color for environment avatar
  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const type = name.toUpperCase();
    if (type === 'PROD') return '#f5222d';
    if (type === 'PREPROD') return '#fa8c16';
    if (type === 'TEST') return '#722ed1';
    if (type === 'DEV') return '#1890ff';
    
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Get license status icon and color
  const getLicenseStatusDisplay = (env: Environment) => {
    switch (env.licenseStatus) {
      case 'checking':
        return {
          icon: <SyncOutlined spin />,
          color: '#1890ff',
          text: 'Checking...',
          status: 'processing' as const
        };
      case 'licensed':
        return {
          icon: <CheckCircleOutlined />,
          color: '#52c41a',
          text: 'Licensed',
          status: 'success' as const
        };
      case 'unlicensed':
        return {
          icon: <CloseCircleOutlined />,
          color: '#ff4d4f',
          text: 'Not Licensed',
          status: 'error' as const
        };
      case 'error':
        return {
          icon: <ExclamationCircleOutlined />,
          color: '#faad14',
          text: 'License Error',
          status: 'warning' as const
        };
      default:
        return {
          icon: <ExclamationCircleOutlined />,
          color: '#d9d9d9',
          text: 'Unknown',
          status: 'default' as const
        };
    }
  };

  // For card display, we'll use a custom layout instead of Table
  if (environments.length === 0) {
    return null;
  }

  return (
    <div className="environments-grid">
      <Row gutter={[16, 16]}>
        {environments.map(env => {
          const licenseDisplay = getLicenseStatusDisplay(env);
          const isAccessible = env.isLicensed !== false;
          
          return (
            <Col xs={24} sm={24} md={12} lg={8} xl={8} key={env.environmentId}>
              <Card
                hoverable={isAccessible}
                style={{ 
                  borderRadius: '8px',
                  overflow: 'hidden',
                  height: '100%',
                  cursor: isAccessible ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  border: '1px solid #f0f0f0',
                  opacity: isAccessible ? 1 : 0.6,
                  position: 'relative'
                }}
                bodyStyle={{ padding: '20px' }}
                onClick={() => handleRowClick(env)}
              >
                {/* License status overlay for non-licensed environments */}
                {!isAccessible && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ fontSize: '24px', color: licenseDisplay.color }}>
                      {licenseDisplay.icon}
                    </div>
                    <Text strong style={{ color: licenseDisplay.color }}>
                      {licenseDisplay.text}
                    </Text>
                    {env.licenseError && (
                      <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', maxWidth: '200px' }}>
                        {env.licenseError}
                      </Text>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar
                      style={{ 
                        backgroundColor: getAvatarColor(env.environmentType), 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                      }}
                      size={48}
                      icon={<CloudServerOutlined />}
                    />
                    <div>
                      <Title level={5} style={{ margin: 0, marginBottom: '4px' }}>
                        {env.environmentName || 'Unnamed Environment'}
                        {env.isMaster && (
                          <Tooltip title="Master Environment">
                            <StarFilled style={{ color: '#faad14', marginLeft: '8px', fontSize: '14px' }} />
                          </Tooltip>
                        )}
                      </Title>
                      <Space size="small">
                        <Tag 
                          color={getEnvironmentTagColor(env.environmentType)}
                          style={{ borderRadius: '12px' }}
                        >
                          {formatEnvironmentType(env.environmentType)}
                        </Tag>
                        <Tag 
                          icon={licenseDisplay.icon}
                          color={licenseDisplay.status === 'success' ? 'green' : 
                                 licenseDisplay.status === 'error' ? 'red' : 
                                 licenseDisplay.status === 'warning' ? 'orange' : 'blue'}
                          style={{ borderRadius: '12px' }}
                        >
                          {licenseDisplay.text}
                        </Tag>
                      </Space>
                    </div>
                  </div>
                  <div>
                    <Tooltip title="View Audit Logs" placement="top">
                      <Button
                        type="text"
                        icon={<AuditOutlined />}
                        onClick={(e) => openAuditPage(env.environmentId, e)}
                        size="small"
                        disabled={!isAccessible}
                        style={{ 
                          borderRadius: '50%', 
                          width: '32px', 
                          height: '32px'
                        }}
                      />
                    </Tooltip>
                  </div>
                </div>
                
                <div style={{ padding: '12px 0', borderTop: '1px solid #f5f5f5', marginTop: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary" style={{ fontSize: '13px' }}>ID:</Text>
                      <Text style={{ fontSize: '13px', fontFamily: 'monospace' }} copyable={{ tooltips: ['Copy ID', 'Copied!'] }}>
                        {env.environmentId}
                      </Text>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary" style={{ fontSize: '13px' }}>Domain:</Text>
                      {env.environmentFrontendUrl ? (
                        <a 
                          href={env.environmentFrontendUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontSize: '13px' }}
                        >
                          {env.environmentFrontendUrl.replace(/^https?:\/\//, '')}
                          <LinkOutlined style={{ marginLeft: 4, fontSize: '12px' }} />
                        </a>
                      ) : (
                        <Text style={{ fontSize: '13px' }}>—</Text>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary" style={{ fontSize: '13px' }}>Master:</Text>
                      <Text style={{ fontSize: '13px' }}>
                        {env.isMaster ? 'Yes' : 'No'}
                      </Text>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary" style={{ fontSize: '13px' }}>License:</Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: licenseDisplay.color, fontSize: '13px' }}>
                          {licenseDisplay.icon}
                        </span>
                        <Text style={{ fontSize: '13px', color: licenseDisplay.color }}>
                          {licenseDisplay.text}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
      
      {environments.length > 10 && (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <Text type="secondary">
            Showing all {environments.length} environments
          </Text>
        </div>
      )}
    </div>
  );
};

export default EnvironmentsTable;