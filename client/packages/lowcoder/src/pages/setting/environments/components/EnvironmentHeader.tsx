import React from 'react';
import { Button, Tag, Typography, Row, Col } from 'antd';
import { EditOutlined, CloudServerOutlined } from '@ant-design/icons';
import { Environment } from '../types/environment.types';
import { getEnvironmentTagColor } from '../utils/environmentUtils';

const { Title, Text } = Typography;

interface EnvironmentHeaderProps {
  environment: Environment;
  onEditClick: () => void;
}

/**
 * Header component for environment details
 * Displays environment name, ID, type, and controls
 */
const EnvironmentHeader: React.FC<EnvironmentHeaderProps> = ({ 
  environment, 
  onEditClick 
}) => {
  return (
    <div
      className="environment-header"
      style={{
        marginBottom: "24px",
        background: '#fff',
        padding: '20px 24px',
        borderRadius: '8px',
        border: '1px solid #f0f0f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}
    >
      <Row justify="space-between" align="middle" gutter={[16, 16]}>
        <Col xs={24} sm={18}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="environment-icon" style={{
              fontSize: '32px',
              backgroundColor: '#f5f5f5',
              width: '64px',
              height: '64px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8b8fa3',
              border: '1px solid #e8e8e8'
            }}>
              <CloudServerOutlined />
            </div>
            <div>
              <Title level={3} style={{ margin: '0 0 8px 0', color: '#222222', fontWeight: '500' }}>
                {environment.environmentName || "Unnamed Environment"}
              </Title>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <Text style={{ 
                  color: '#8b8fa3', 
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}>
                  ID: {environment.environmentId}
                </Text>
                <Tag 
                  color={getEnvironmentTagColor(environment.environmentType)}
                  style={{ 
                    marginLeft: 0, 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                >
                  {environment.environmentType}
                </Tag>
                {environment.isMaster && (
                  <Tag color="green" style={{ marginLeft: 0, borderRadius: '4px', fontSize: '12px' }}>
                    Master
                  </Tag>
                )}
                {environment.isLicensed === false && (
                  <Tag color="orange" style={{ marginLeft: 0, borderRadius: '4px', fontSize: '12px' }}>
                    Unlicensed
                  </Tag>
                )}
              </div>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={6} style={{ textAlign: 'right' }}>
          <Button
            icon={<EditOutlined />}
            onClick={onEditClick}
            type="primary"
            style={{
              fontWeight: '500',
              borderRadius: '4px'
            }}
          >
            Edit Environment
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default EnvironmentHeader;