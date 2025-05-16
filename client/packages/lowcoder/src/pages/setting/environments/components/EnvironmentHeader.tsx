import React from 'react';
import { Button, Tag, Typography, Row, Col } from 'antd';
import { EditOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Environment } from '../types/environment.types';
import { getEnvironmentTagColor, getEnvironmentHeaderGradient } from '../utils/environmentUtils';

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
        background: getEnvironmentHeaderGradient(environment.environmentType),
        padding: '20px 24px',
        borderRadius: '8px',
        color: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <Row justify="space-between" align="middle" gutter={[16, 16]}>
        <Col xs={24} sm={18}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="environment-icon" style={{
              fontSize: '32px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <EnvironmentOutlined />
            </div>
            <div>
              <Title level={3} style={{ margin: '0 0 4px 0', color: 'white' }}>
                {environment.environmentName || "Unnamed Environment"}
              </Title>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                  ID: {environment.environmentId}
                </Text>
                <Tag 
                  color={getEnvironmentTagColor(environment.environmentType)}
                  style={{ marginLeft: 0, borderRadius: '12px' }}
                >
                  {environment.environmentType}
                </Tag>
                {environment.isMaster && (
                  <Tag color="green" style={{ marginLeft: 0, borderRadius: '12px' }}>
                    Master
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
            ghost
            size="large"
          >
            Edit Environment
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default EnvironmentHeader;