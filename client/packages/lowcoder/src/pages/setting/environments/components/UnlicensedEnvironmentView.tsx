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
import { trans } from 'i18n';

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
        return trans("environments.unlicensed_unlicensedDescription");
      case 'error':
        return trans("environments.unlicensed_errorDescription");
      default:
        return trans("environments.unlicensed_defaultDescription");
    }
  };

  // Stats data consistent with other environment pages
  const statsData = [
    {
      title: trans("environments.unlicensed_type"),
      value: environment.environmentType || trans("environments.detail_unknown"),
      icon: <CloudServerOutlined />,
      color: "#1890ff"
    },
    {
      title: trans("environments.unlicensed_status"),
      value: trans("environments.detail_unlicensed"),
      icon: <CloseCircleOutlined />,
      color: "#ff4d4f"
    },
    {
      title: trans("environments.unlicensed_masterEnv"),
      value: environment.isMaster ? trans("environments.yes") : trans("environments.no"),
      icon: <CloudServerOutlined />,
      color: environment.isMaster ? "#722ed1" : "#8c8c8c"
    },
    {
      title: trans("environments.unlicensed_licenseIssue"),
      value: environment.licenseStatus === 'error' ? trans("environments.unlicensed_error") : trans("environments.unlicensed_missing"),
      icon: environment.licenseStatus === 'error' ? <ExclamationCircleOutlined /> : <CloseCircleOutlined />,
      color: environment.licenseStatus === 'error' ? "#faad14" : "#ff4d4f"
    }
  ];

  return (
    <Level1SettingPageContent style={{ minWidth: "1000px" }}>

      {/* Breadcrumbs */}
       <ModernBreadcrumbs 
        items={[
          {
            key: 'environments',
            title: trans("environments.title"),  
            onClick: () => history.push('/setting/environments')
          },
          {
            key: 'current',
            title: environment.environmentName || trans("environments.detail_environmentDetail")
          }
        ]}
      />

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
                  onClick={() => setIsContactModalVisible(true)}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: 500
                  }}
                >
                  {trans("environments.unlicensed_contactLowcoderTeam")}
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
                  {trans("environments.unlicensed_editEnvironment")}
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
                  {trans("environments.unlicensed_backToEnvironments")}
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
          {trans("environments.unlicensed_helpText")}
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