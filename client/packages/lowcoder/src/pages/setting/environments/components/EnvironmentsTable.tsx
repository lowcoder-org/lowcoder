import React from 'react';
import { Table, Tag, Button, Tooltip, Space, Card, Row, Col, Typography, Avatar } from 'antd';
import { EditOutlined, AuditOutlined, LinkOutlined, EnvironmentOutlined, StarFilled } from '@ant-design/icons';
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

  // For card display, we'll use a custom layout instead of Table
  if (environments.length === 0) {
    return null;
  }

  return (
    <div className="environments-grid">
      <Row gutter={[16, 16]}>
        {environments.map(env => (
          <Col xs={24} sm={24} md={12} lg={8} xl={8} key={env.environmentId}>
            <Card
              hoverable
              style={{ 
                borderRadius: '8px',
                overflow: 'hidden',
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                border: '1px solid #f0f0f0'
              }}
              bodyStyle={{ padding: '20px' }}
              onClick={() => onRowClick(env)}
            >
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
                    icon={<EnvironmentOutlined />}
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
                    <Tag 
                      color={getEnvironmentTagColor(env.environmentType)}
                      style={{ borderRadius: '12px' }}
                    >
                      {formatEnvironmentType(env.environmentType)}
                    </Tag>
                  </div>
                </div>
                <div>
                  <Tooltip title="View Audit Logs" placement="top">
                    <Button
                      type="text"
                      icon={<AuditOutlined />}
                      onClick={(e) => openAuditPage(env.environmentId, e)}
                      size="small"
                      style={{ borderRadius: '50%', width: '32px', height: '32px' }}
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
                </div>
              </div>
            </Card>
          </Col>
        ))}
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