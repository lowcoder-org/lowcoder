import React, { useState } from 'react';
import { Button, Card, Space, Typography, Row, Col } from 'antd';
import { 
  CustomerServiceOutlined, 
  EditOutlined, 
  ArrowLeftOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Environment } from '../types/environment.types';
import ContactLowcoderModal from './ContactLowcoderModal';
import history from "@lowcoder-ee/util/history";

const { Title, Text } = Typography;

interface UnlicensedEnvironmentViewProps {
  environment: Environment;
  onEditClick: () => void;
}

/**
 * Modern UI for unlicensed environments
 */
const UnlicensedEnvironmentView: React.FC<UnlicensedEnvironmentViewProps> = ({
  environment,
  onEditClick
}) => {
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);

  const getLicenseIcon = () => {
    switch (environment.licenseStatus) {
      case 'unlicensed':
        return <CloseCircleOutlined style={{ fontSize: '48px', color: '#ff7875' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#ffc53d' }} />;
      default:
        return <WarningOutlined style={{ fontSize: '48px', color: '#ff7875' }} />;
    }
  };

  const getLicenseTitle = () => {
   return environment.licenseError;
 }



  const getLicenseDescription = () => {
    
    switch (environment.licenseStatus) {
      case 'unlicensed':
        return 'This environment needs a valid license to unlock its full capabilities and features. Please make sure your API Service URL is correctly configured and Plugin is installed.';
      case 'error':
        return 'We encountered an issue while checking the license. Please review the configuration settings.';
      default:
        return 'This environment requires license configuration to proceed.';
    }
  };

  return (
    <div style={{ 
      padding: "24px", 
      flex: 1,
      minWidth: '1000px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Row justify="center" style={{ minHeight: '80vh' }}>
        <Col xs={24} sm={20} md={16} lg={14} xl={12}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '70vh',
            textAlign: 'center'
          }}>
            {/* Main Status Card */}
            <Card
              style={{
                width: '100%',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                border: 'none',
                background: 'white',
                overflow: 'hidden'
              }}
              bodyStyle={{ padding: '48px 32px' }}
            >
              {/* Status Icon */}
              <div style={{ marginBottom: '24px' }}>
                {getLicenseIcon()}
              </div>

              {/* Environment Info */}
              <div style={{ marginBottom: '32px' }}>
                <Title level={2} style={{ marginBottom: '8px', color: '#262626' }}>
                  {getLicenseTitle()}
                </Title>
                <Text style={{ 
                  fontSize: '16px', 
                  color: '#595959',
                  display: 'block',
                  marginBottom: '16px',
                  lineHeight: '1.6'
                }}>
                  {getLicenseDescription()}
                </Text>
                
                {/* Environment Details */}
                <div style={{
                  background: '#fafafa',
                  padding: '16px',
                  borderRadius: '8px',
                  marginTop: '24px',
                  border: '1px solid #f0f0f0'
                }}>
                  <Text strong style={{ color: '#8c8c8c', fontSize: '14px' }}>Environment:</Text>
                  <Text style={{ 
                    display: 'block', 
                    fontSize: '16px', 
                    color: '#262626',
                    marginTop: '4px'
                  }}>
                    {environment.environmentName || 'Unnamed Environment'}
                  </Text>
                  <Text style={{ 
                    fontSize: '13px', 
                    color: '#8c8c8c',
                    fontFamily: 'monospace'
                  }}>
                    ID: {environment.environmentId}
                  </Text>
                </div>
              </div>

              {/* Action Buttons */}
              <Space size="large" direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<CustomerServiceOutlined />}
                  onClick={() => setIsContactModalVisible(true)}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 500,
                    background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
                  }}
                >
                  Contact Lowcoder Team
                </Button>

                <Button
                  size="large"
                  icon={<EditOutlined />}
                  onClick={onEditClick}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 500,
                    borderColor: '#d9d9d9',
                    color: '#595959'
                  }}
                >
                  Edit Environment
                </Button>

                <Button
                  size="large"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => history.push("/setting/environments")}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 500,
                    borderColor: '#d9d9d9',
                    color: '#8c8c8c'
                  }}
                >
                  Back to Environments
                </Button>
              </Space>
            </Card>

            {/* Footer Help Text */}
            <Text style={{ 
              marginTop: '24px', 
              color: '#8c8c8c',
              fontSize: '14px',
              maxWidth: '400px',
              lineHeight: '1.5'
            }}>
              Need assistance? Contact our team for licensing support or edit the environment configuration to resolve this issue.
            </Text>
          </div>
        </Col>
      </Row>

      {/* Contact Lowcoder Modal */}
      <ContactLowcoderModal
        visible={isContactModalVisible}
        onClose={() => setIsContactModalVisible(false)}
        environment={environment}
      />
    </div>
  );
};

export default UnlicensedEnvironmentView; 