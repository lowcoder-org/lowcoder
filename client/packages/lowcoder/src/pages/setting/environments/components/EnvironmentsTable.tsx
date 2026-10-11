import React from 'react';
import { Table, Tag, Button, Tooltip, Space, Card, Row, Col, Typography, Avatar, Spin, Alert, Progress } from 'antd';
import { EditOutlined, AuditOutlined, LinkOutlined, EnvironmentOutlined, StarFilled, CloudServerOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, SyncOutlined, ApiOutlined } from '@ant-design/icons';
import { Environment } from '../types/environment.types';
import { getEnvironmentTagColor, formatEnvironmentType } from '../utils/environmentUtils';
import { getAPICallsStatusColor } from '../services/license.service';
import { trans } from 'i18n';

const { Text, Title } = Typography;

interface EnvironmentsTableProps {
  environments: Environment[];
  loading: boolean;
  onRowClick: (record: Environment) => void;
}

/**
 * Clean card-based layout for displaying environments consistent with app design
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

  // Handle row click - allow navigation to all environments including unlicensed
  const handleRowClick = (env: Environment) => {
    onRowClick(env);
  };

  // Generate background color for environment avatar
  const getAvatarColor = (name: string) => {
    const type = name.toUpperCase();
    if (type === 'PROD') return '#f5222d';
    if (type === 'PREPROD') return '#fa8c16';
    if (type === 'TEST') return '#722ed1';
    if (type === 'DEV') return '#1890ff';
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Get license status icon and color
  const getLicenseStatusDisplay = (env: Environment) => {
    switch (env.licenseStatus) {
      case 'checking':
        return {
          icon: <SyncOutlined spin />,
          color: '#40a9ff',
          text: trans("environments.licenseStatus_checking"),
          status: 'processing' as const
        };
      case 'licensed':
        return {
          icon: <CheckCircleOutlined />,
          color: '#73d13d',
          text: trans("environments.licenseStatus_licensed"),
          status: 'success' as const
        };
      case 'unlicensed':
        return {
          icon: <CloseCircleOutlined />,
          color: '#ff7875',
          text: trans("environments.licenseStatus_unlicensed"),
          status: 'warning' as const
        };
      case 'error':
        return {
          icon: <ExclamationCircleOutlined />,
          color: '#ffc53d',
          text: trans("environments.licenseStatus_error"),
          status: 'warning' as const
        };
      default:
        return {
          icon: <ExclamationCircleOutlined />,
          color: '#d9d9d9',
          text: trans("environments.licenseStatus_unknown"),
          status: 'default' as const
        };
    }
  };

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
                hoverable
                style={{ 
                  borderRadius: '4px',
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid #f0f0f0',
                  position: 'relative'
                }}
                styles={{ body: { padding: '16px' } }}
                onClick={() => handleRowClick(env)}
              >
                {/* Subtle overlay for unlicensed environments */}
                {!isAccessible && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.8)',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-end',
                    padding: '12px'
                  }}>
                    {/* Not Licensed Badge */}
                    <div style={{
                      background: licenseDisplay.color,
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {licenseDisplay.icon}
                      {licenseDisplay.text}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar
                      style={{ 
                        backgroundColor: getAvatarColor(env.environmentType || 'TEST'), 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      size={40}
                      icon={<CloudServerOutlined />}
                    />
                    <div>
                      <Title level={5} style={{ margin: 0, marginBottom: '4px', fontSize: '14px' }}>
                        {env.environmentName || trans("environments.unnamedEnvironment")}
                        {env.isMaster && (
                          <Tooltip title={trans("environments.masterEnvironment")}>
                            <StarFilled style={{ color: '#faad14', marginLeft: '6px', fontSize: '12px' }} />
                          </Tooltip>
                        )}
                      </Title>
                      <Space size="small">
                        <Tag 
                          color={getEnvironmentTagColor(env.environmentType)}
                          style={{ fontSize: '11px', borderRadius: '4px' }}
                        >
                          {formatEnvironmentType(env.environmentType)}
                        </Tag>
                        <Tag 
                          icon={licenseDisplay.icon}
                          color={licenseDisplay.status === 'success' ? 'green' : 
                                 licenseDisplay.status === 'warning' ? 'orange' : 
                                 licenseDisplay.status === 'processing' ? 'blue' : 'default'}
                          style={{ fontSize: '11px', borderRadius: '4px' }}
                        >
                          {licenseDisplay.text}
                        </Tag>
                      </Space>
                    </div>
                  </div>
                  {/* Only show audit button for licensed environments */}
                  {isAccessible && (
                    <div>
                      <Tooltip title={trans("environments.viewAuditLogs")} placement="top">
                        <Button
                          type="text"
                          icon={<AuditOutlined />}
                          onClick={(e) => openAuditPage(env.environmentId, e)}
                          size="small"
                          style={{ 
                            width: '28px', 
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        />
                      </Tooltip>
                    </div>
                  )}
                </div>
                
                <div style={{ padding: '8px 0', borderTop: '1px solid #f5f5f5' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>{trans("environments.id")}:</Text>
                      {isAccessible ? (
                        <Text style={{ fontSize: '12px', fontFamily: 'monospace' }} copyable={{ tooltips: [trans("environments.copyId"), trans("environments.copied")] }}>
                          {env.environmentId}
                        </Text>
                      ) : (
                        <Text style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                          {env.environmentId}
                        </Text>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>{trans("environments.domain")}:</Text>
                      {env.environmentFrontendUrl ? (
                        isAccessible ? (
                          <a 
                            href={env.environmentFrontendUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ fontSize: '12px' }}
                          >
                            {env.environmentFrontendUrl.replace(/^https?:\/\//, '')}
                            <LinkOutlined style={{ marginLeft: 4, fontSize: '10px' }} />
                          </a>
                        ) : (
                          <Text style={{ fontSize: '12px' }}>
                            {env.environmentFrontendUrl.replace(/^https?:\/\//, '')}
                          </Text>
                        )
                      ) : (
                        <Text style={{ fontSize: '12px' }}>—</Text>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>{trans("environments.master")}:</Text>
                      <Text style={{ fontSize: '12px' }}>
                        {env.isMaster ? trans("environments.yes") : trans("environments.no")}
                      </Text>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>{trans("environments.license")}:</Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: licenseDisplay.color, fontSize: '12px' }}>
                          {licenseDisplay.icon}
                        </span>
                        <Text style={{ fontSize: '12px', color: licenseDisplay.color }}>
                          {licenseDisplay.text}
                        </Text>
                      </div>
                    </div>

                    {/* API Calls Information - show if license details are available */}
                    {env.licenseDetails && (
                      <div style={{ marginTop: '8px', padding: '8px', background: '#fafafa', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            <ApiOutlined style={{ marginRight: '4px' }} />
                            {trans("environments.apiCalls")}
                          </Text>
                      
                        </div>
                        <Progress
                          percent={env.licenseDetails.apiCallsUsage || 0}
                          strokeColor={getAPICallsStatusColor(
                            env.licenseDetails.remainingAPICalls,
                            env.licenseDetails.totalAPICallsLimit || 0
                          )}
                          size="small"
                          showInfo={false}
                        />
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          marginTop: '4px',
                          fontSize: '10px',
                          color: '#8c8c8c'
                        }}>
                          <span>{trans("environments.percentUsed", { percent: env.licenseDetails.apiCallsUsage || 0 })}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
      
      {environments.length > 10 && (
        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            {trans("environments.showingAllEnvironments", { count: environments.length })}
          </Text>
        </div>
      )}
    </div>
  );
};

export default EnvironmentsTable;