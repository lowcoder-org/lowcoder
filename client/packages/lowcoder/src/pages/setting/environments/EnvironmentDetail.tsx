import React, {useState, useEffect} from "react";
import {
  Spin,
  Typography,
  Card,
  Tabs,
  Alert,
  Descriptions,
  Menu,
  Button,
  Tag,
  Result,
  Row,
  Col,
  Statistic,
  Progress,
} from "antd";
import {
  LinkOutlined,
  HomeOutlined,
  AppstoreOutlined,
  UsergroupAddOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  CloudServerOutlined,
  UserOutlined,
  SafetyOutlined,
  CrownOutlined,
  ApiOutlined,
} from "@ant-design/icons";

import { useSingleEnvironmentContext } from "./context/SingleEnvironmentContext";
import EditEnvironmentModal from "./components/EditEnvironmentModal";
import UnlicensedEnvironmentView from "./components/UnlicensedEnvironmentView";
import { Environment } from "./types/environment.types";
import history from "@lowcoder-ee/util/history";
import WorkspacesTab from "./components/WorkspacesTab";
import UserGroupsTab from "./components/UserGroupsTab";
import EnvironmentHeader from "./components/EnvironmentHeader";
import StatsCard from "./components/StatsCard";
import ModernBreadcrumbs from "./components/ModernBreadcrumbs";
import { getEnvironmentTagColor } from "./utils/environmentUtils";
import { formatAPICalls, getAPICallsStatusColor } from "./services/license.service";
import ErrorComponent from './components/ErrorComponent';
import { Level1SettingPageContent } from "../styled";
import { trans } from "i18n";

/**
 * Environment Detail Page Component
 * Shows detailed information about a specific environment
 */
const EnvironmentDetail: React.FC = () => {
  // Use the SingleEnvironmentContext instead of EnvironmentContext
  const {
    environment,
    isLoading,
    error,
    updateEnvironmentData
  } = useSingleEnvironmentContext();  
  
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('workspaces');
  
  // Handle edit menu item click
  const handleEditClick = () => {
    setIsEditModalVisible(true);
  };
  
  // Handle modal close
  const handleCloseModal = () => {
    setIsEditModalVisible(false);
  };
  
  // Handle save environment
  const handleSaveEnvironment = async (data: Partial<Environment>) => {
    if (!environment) return;
    
    setIsUpdating(true);
    try {
      // Close the modal first, before the update completes
      handleCloseModal();
      
      // Then update the environment data
      await updateEnvironmentData(data);
    } catch (error) {
      console.error('Failed to update environment:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
 
  
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !environment) {
    return (
      <ErrorComponent 
        errorMessage={trans("environments.detail_environmentNotFound")}
        returnPath="/setting/environments"
        returnLabel={trans("environments.detail_returnToEnvironmentsList")}
      />
    );
  }

  // Check if environment is not licensed and show modern UI
  if (environment.isLicensed === false) {
    return (
      <>
        <UnlicensedEnvironmentView 
          environment={environment}
          onEditClick={handleEditClick}
        />
        
        {/* Edit Environment Modal */}
        {environment && (
          <EditEnvironmentModal
            visible={isEditModalVisible}
            environment={environment}
            onClose={handleCloseModal}
            onSave={handleSaveEnvironment}
            loading={isUpdating}
          />
        )}
      </>
    );
  }

  // Stats data for the cards
  const statsData = [
    {
      title: trans("environments.detail_type"),
      value: environment.environmentType || trans("environments.detail_unknown"),
      icon: <CloudServerOutlined />,
      color: getEnvironmentTagColor(environment.environmentType)
    },
    {
      title: trans("environments.detail_status"),
      value: environment.isLicensed ? trans("environments.detail_licensed") : trans("environments.detail_unlicensed"),
      icon: environment.isLicensed ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
      color: environment.isLicensed ? "#52c41a" : "#ff4d4f"
    },
    {
      title: trans("environments.detail_apiKey"),
      value: environment.environmentApikey ? trans("environments.detail_configured") : trans("environments.detail_notSet"),
      icon: <SafetyOutlined />,
      color: environment.environmentApikey ? "#1890ff" : "#faad14"
    },
    {
      title: trans("environments.detail_masterEnv"),
      value: environment.isMaster ? trans("environments.yes") : trans("environments.no"),
      icon: <UserOutlined />,
      color: environment.isMaster ? "#722ed1" : "#8c8c8c"
    }
  ];

  const tabItems = [
    {
      key: 'workspaces',
      label: (
        <span>
          <AppstoreOutlined /> {trans("environments.detail_workspaces")}
        </span>
      ),
      children: <WorkspacesTab environment={environment} />
    },
    {
      key: 'userGroups',
      label: (
        <span>
          <UsergroupAddOutlined /> {trans("environments.detail_userGroups")}
        </span>
      ),
      children: <UserGroupsTab environment={environment} />
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
        onEditClick={handleEditClick} 
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

      {/* Basic Environment Information Card */}
      <Card
        title={trans("environments.detail_environmentOverview")}
        style={{ 
          marginBottom: "24px", 
          borderRadius: '4px', 
          border: '1px solid #f0f0f0'
        }}
        className="environment-overview-card"
      >
        <Descriptions
          bordered
          layout="vertical"
          column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
          size="small"
        >
          <Descriptions.Item label={trans("environments.domain")}>
            {environment.environmentFrontendUrl ? (
              <a
                href={environment.environmentFrontendUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {environment.environmentFrontendUrl} <LinkOutlined />
              </a>
            ) : (
              trans("environments.detail_noDomainSet")
            )}
          </Descriptions.Item>
          <Descriptions.Item label={trans("environments.detail_environmentId")}>
            <code style={{ padding: '2px 6px', background: '#f5f5f5', borderRadius: '3px' }}>
              {environment.environmentId}
            </code>
          </Descriptions.Item>
          <Descriptions.Item label={trans("environments.detail_licenseStatus")}>
            {(() => {
              switch (environment.licenseStatus) {
                case 'checking':
                  return <Tag icon={<SyncOutlined spin />} color="blue" style={{ borderRadius: '4px' }}>{trans("environments.licenseStatus_checking")}</Tag>;
                case 'licensed':
                  return <Tag icon={<CheckCircleOutlined />} color="green" style={{ borderRadius: '4px' }}>{trans("environments.licenseStatus_licensed")}</Tag>;
                case 'unlicensed':
                  return <Tag icon={<CloseCircleOutlined />} color="orange" style={{ borderRadius: '4px' }}>{trans("environments.detail_licenseNeeded")}</Tag>;
                case 'error':
                  return <Tag icon={<ExclamationCircleOutlined />} color="orange" style={{ borderRadius: '4px' }}>{trans("environments.detail_setupRequired")}</Tag>;
                default:
                  return <Tag color="default" style={{ borderRadius: '4px' }}>{trans("environments.detail_unknown")}</Tag>;
              }
            })()}
          </Descriptions.Item>
          <Descriptions.Item label={trans("environments.detail_created")}>
            {environment.createdAt ? new Date(environment.createdAt).toLocaleDateString() : trans("environments.detail_unknown")}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      
      {/* Detailed License Information Card - only show for licensed environments with details */}
      {environment.isLicensed && environment.licenseDetails && (
        <Card
          title={
            <span>
              <CrownOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
              {trans("environments.detail_licenseDetails")}
            </span>
          }
          style={{ 
            marginBottom: "24px", 
            borderRadius: '4px', 
            border: '1px solid #f0f0f0'
          }}
          className="license-details-card"
        >
          <Row gutter={[24, 16]}>
            {/* API Calls Status */}
            <Col xs={24} sm={12} md={8}>
              <Card
                size="small"
                style={{ height: '100%', textAlign: 'center' }}
                styles={{ body: { padding: '16px' } }}
              >
                <Statistic
                  title={trans("environments.detail_apiCallsRemaining")}
                  value={environment.licenseDetails.remainingAPICalls}
                  formatter={(value) => (
                    <span style={{ 
                      color: getAPICallsStatusColor(
                        environment.licenseDetails?.remainingAPICalls || 0,
                        environment.licenseDetails?.totalAPICallsLimit || 0
                      )
                    }}>
                      {value?.toLocaleString()}
                    </span>
                  )}
                  prefix={<ApiOutlined />}
                />
                <div style={{ marginTop: '12px' }}>
                  <Progress
                    percent={environment.licenseDetails.apiCallsUsage || 0}
                    strokeColor={getAPICallsStatusColor(
                      environment.licenseDetails.remainingAPICalls,
                      environment.licenseDetails.totalAPICallsLimit || 0
                    )}
                    size="small"
                    showInfo={false}
                  />
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#8c8c8c', 
                    marginTop: '4px' 
                  }}>
                    {trans("environments.percentUsed", { percent: environment.licenseDetails.apiCallsUsage || 0 })}
                  </div>
                </div>
              </Card>
            </Col>

            {/* Total License Limit */}
            <Col xs={24} sm={12} md={8}>
              <Card
                size="small"
                style={{ height: '100%', textAlign: 'center' }}
                styles={{ body: { padding: '16px' } }}
              >
                <Statistic
                  title={trans("environments.detail_totalApiCallsLimit")}
                  value={environment.licenseDetails.totalAPICallsLimit}
                  formatter={(value) => value?.toLocaleString()}
                  prefix={<ApiOutlined />}
                />
                <Tag 
                  color="blue" 
                  style={{ marginTop: '12px' }}
                >
                  {environment.licenseDetails.eeLicenses.length} {environment.licenseDetails.eeLicenses.length !== 1 ? trans("environments.detail_licenses") : trans("environments.detail_license")}
                </Tag>
              </Card>
            </Col>

            {/* Enterprise Edition Status */}
            <Col xs={24} sm={12} md={8}>
              <Card
                size="small"
                style={{ height: '100%', textAlign: 'center' }}
                styles={{ body: { padding: '16px' } }}
              >
                <Statistic
                  title={trans("environments.detail_enterpriseEdition")}
                  value={environment.licenseDetails.eeActive ? trans("environments.detail_active") : trans("environments.detail_inactive")}
                  formatter={(value) => (
                    <Tag 
                      color={environment.licenseDetails?.eeActive ? "green" : "red"}
                      icon={environment.licenseDetails?.eeActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    >
                      {value}
                    </Tag>
                  )}
                />
              </Card>
            </Col>
          </Row>

          {/* License Details */}
          <div style={{ marginTop: '24px' }}>
            <Typography.Title level={5} style={{ marginBottom: '16px' }}>
              <UserOutlined style={{ marginRight: '8px' }} />
              {trans("environments.detail_licenseInformation")}
            </Typography.Title>
            
            <Row gutter={[16, 16]}>
              {environment.licenseDetails.eeLicenses.map((license, index) => (
                <Col xs={24} sm={12} md={8} key={license.uuid}>
                  <Card
                    size="small"
                    style={{ 
                      border: '1px solid #f0f0f0',
                      borderRadius: '6px'
                    }}
                    styles={{ body: { padding: '12px' } }}
                  >
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#262626' }}>
                        {license.customerName}
                      </strong>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>
                      {trans("environments.id")}: {license.customerId}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>
                      UUID: <span style={{ fontFamily: 'monospace' }}>{license.uuid.substring(0, 8)}...</span>
                    </div>
                    <Tag color="blue">
                      {license.apiCallsLimit.toLocaleString()} {trans("environments.detail_calls")}
                    </Tag>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </Card>
      )}

      
      {/* Tabs for Workspaces and User Groups */}
      <Tabs 
        defaultActiveKey="workspaces"
        activeKey={activeTab}
        onChange={setActiveTab}
        className="modern-tabs"
        type="line"
        items={tabItems}
      />

      {/* Edit Environment Modal */}
      {environment && (
        <EditEnvironmentModal
          visible={isEditModalVisible}
          environment={environment}
          onClose={handleCloseModal}
          onSave={handleSaveEnvironment}
          loading={isUpdating}
        />
      )}
    </Level1SettingPageContent>
  );
};

export default EnvironmentDetail;