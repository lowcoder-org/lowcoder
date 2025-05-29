import React, { useState } from 'react';
import { Button, Card, Space, Typography, Row, Col } from 'antd';
import { 
  CustomerServiceOutlined, 
  EditOutlined, 
  ArrowLeftOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  CloudServerOutlined
} from '@ant-design/icons';
import { Environment } from '../types/environment.types';
import ContactLowcoderModal from './ContactLowcoderModal';
import ModernBreadcrumbs from './ModernBreadcrumbs';
import EnvironmentHeader from './EnvironmentHeader';
import StatsCard from './StatsCard';
import { Level1SettingPageContent } from "../../styled";
import history from "@lowcoder-ee/util/history";

const { Title, Text } = Typography;

interface UnlicensedEnvironmentViewProps {
  environment: Environment;
  onEditClick: () => void;
}

/**
 * Consistent UI for unlicensed environments matching other environment pages
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

  // Stats data consistent with other environment pages
  const statsData = [
    {
      title: "Type",
      value: environment.environmentType || "Unknown",
      icon: <CloudServerOutlined />,
      color: "#1890ff"
    },
    {
      title: "Status",
      value: "Unlicensed",
      icon: <CloseCircleOutlined />,
      color: "#ff4d4f"
    },
    {
      title: "Master Env",
      value: environment.isMaster ? "Yes" : "No",
      icon: <CloudServerOutlined />,
      color: environment.isMaster ? "#722ed1" : "#8c8c8c"
    },
    {
      title: "License Issue",
      value: environment.licenseStatus === 'error' ? "Error" : "Missing",
      icon: environment.licenseStatus === 'error' ? <ExclamationCircleOutlined /> : <CloseCircleOutlined />,
      color: environment.licenseStatus === 'error' ? "#faad14" : "#ff4d4f"
    }
  ];

  return (
    <Level1SettingPageContent style={{ minWidth: "1000px" }}>
      {/* Environment Header Component */}
      <EnvironmentHeader 
        environment={environment} 
        onEditClick={onEditClick} 
      />

      {/* Stats Cards Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        {statsData.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <StatsCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
            />
          </Col>
        ))}
      </Row>

      {/* Breadcrumbs */}
      <ModernBreadcrumbs 
        items={[
          {
            key: 'environments',
            title: 'Environments',
            onClick: () => history.push('/setting/environments')
          },
          {
            key: 'current',
            title: environment.environmentName || "Environment Detail"
          }
        ]}
      />

      {/* License Issue Card */}
      <Card
        style={{
          marginBottom: "24px",
          borderRadius: '4px',
          border: '1px solid #f0f0f0',
          background: 'white'
        }}
        styles={{ body: { padding: '32px' } }}
      >
        <Row justify="center">
          <Col xs={24} sm={20} md={16} lg={12}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              textAlign: 'center'
            }}>
              {/* Status Icon */}
              <div style={{ marginBottom: '24px' }}>
                {getLicenseIcon()}
              </div>

              {/* License Issue Information */}
              <Title level={2} style={{ marginBottom: '12px', color: '#262626' }}>
                {getLicenseTitle()}
              </Title>
              <Text style={{ 
                fontSize: '16px', 
                color: '#595959',
                marginBottom: '24px',
                lineHeight: '1.6',
                maxWidth: '500px'
              }}>
                {getLicenseDescription()}
              </Text>

              {/* Action Buttons */}
              <Space size="large" direction="vertical" style={{ width: '100%', maxWidth: '400px' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<CustomerServiceOutlined />}
                  onClick={() => setIsContactModalVisible(true)}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: 500
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
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: 500
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
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: 500
                  }}
                >
                  Back to Environments
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Help Text */}
      <Card
        style={{
          borderRadius: '4px',
          border: '1px solid #f0f0f0',
          background: '#fafafa'
        }}
        styles={{ body: { padding: '16px' } }}
      >
        <Text style={{ 
          color: '#8c8c8c',
          fontSize: '14px',
          textAlign: 'center',
          display: 'block',
          lineHeight: '1.5'
        }}>
          Need assistance? Contact our team for licensing support or edit the environment configuration to resolve this issue.
        </Text>
      </Card>

      {/* Contact Lowcoder Modal */}
      <ContactLowcoderModal
        visible={isContactModalVisible}
        onClose={() => setIsContactModalVisible(false)}
        environment={environment}
      />
    </Level1SettingPageContent>
  );
};

export default UnlicensedEnvironmentView; 