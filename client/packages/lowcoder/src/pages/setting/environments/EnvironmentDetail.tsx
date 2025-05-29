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
        errorMessage={"Environment Not Found"}
        returnPath="/setting/environments"
        returnLabel="Return to Environments List"
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
      title: "Type",
      value: environment.environmentType || "Unknown",
      icon: <CloudServerOutlined />,
      color: getEnvironmentTagColor(environment.environmentType)
    },
    {
      title: "Status",
      value: environment.isLicensed ? "Licensed" : "Unlicensed",
      icon: environment.isLicensed ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
      color: environment.isLicensed ? "#52c41a" : "#ff4d4f"
    },
    {
      title: "API Key",
      value: environment.environmentApikey ? "Configured" : "Not Set",
      icon: <SafetyOutlined />,
      color: environment.environmentApikey ? "#1890ff" : "#faad14"
    },
    {
      title: "Master Env",
      value: environment.isMaster ? "Yes" : "No",
      icon: <UserOutlined />,
      color: environment.isMaster ? "#722ed1" : "#8c8c8c"
    }
  ];

  const tabItems = [
    {
      key: 'workspaces',
      label: (
        <span>
          <AppstoreOutlined /> Workspaces
        </span>
      ),
      children: <WorkspacesTab environment={environment} />
    },
    {
      key: 'userGroups',
      label: (
        <span>
          <UsergroupAddOutlined /> User Groups
        </span>
      ),
      children: <UserGroupsTab environment={environment} />
    }
  ];

  return (
    <Level1SettingPageContent style={{ minWidth: "1000px" }}>
      {/* Breadcrumbs */}
   

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
        title="Environment Overview"
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
          <Descriptions.Item label="Domain">
            {environment.environmentFrontendUrl ? (
              <a
                href={environment.environmentFrontendUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {environment.environmentFrontendUrl} <LinkOutlined />
              </a>
            ) : (
              "No domain set"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Environment ID">
            <code style={{ padding: '2px 6px', background: '#f5f5f5', borderRadius: '3px' }}>
              {environment.environmentId}
            </code>
          </Descriptions.Item>
          <Descriptions.Item label="License Status">
            {(() => {
              switch (environment.licenseStatus) {
                case 'checking':
                  return <Tag icon={<SyncOutlined spin />} color="blue" style={{ borderRadius: '4px' }}>Checking...</Tag>;
                case 'licensed':
                  return <Tag icon={<CheckCircleOutlined />} color="green" style={{ borderRadius: '4px' }}>Licensed</Tag>;
                case 'unlicensed':
                  return <Tag icon={<CloseCircleOutlined />} color="orange" style={{ borderRadius: '4px' }}>License Needed</Tag>;
                case 'error':
                  return <Tag icon={<ExclamationCircleOutlined />} color="orange" style={{ borderRadius: '4px' }}>Setup Required</Tag>;
                default:
                  return <Tag color="default" style={{ borderRadius: '4px' }}>Unknown</Tag>;
              }
            })()}
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {environment.createdAt ? new Date(environment.createdAt).toLocaleDateString() : "Unknown"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

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
      {/* Detailed License Information Card - only show for licensed environments with details */}
      {environment.isLicensed && environment.licenseDetails && (
        <Card
          title={
            <span>
              <CrownOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
              License Details
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
                bodyStyle={{ padding: '16px' }}
              >
                <Statistic
                  title="API Calls Remaining"
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
                    percent={100 - (environment.licenseDetails.apiCallsUsage || 0)}
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
                    {environment.licenseDetails.apiCallsUsage || 0}% used
                  </div>
                </div>
              </Card>
            </Col>

            {/* Total License Limit */}
            <Col xs={24} sm={12} md={8}>
              <Card
                size="small"
                style={{ height: '100%', textAlign: 'center' }}
                bodyStyle={{ padding: '16px' }}
              >
                <Statistic
                  title="Total API Calls Limit"
                  value={environment.licenseDetails.totalAPICallsLimit}
                  formatter={(value) => value?.toLocaleString()}
                  prefix={<ApiOutlined />}
                />
                <Tag 
                  color="blue" 
                  style={{ marginTop: '12px' }}
                >
                  {environment.licenseDetails.eeLicenses.length} License{environment.licenseDetails.eeLicenses.length !== 1 ? 's' : ''}
                </Tag>
              </Card>
            </Col>

            {/* Enterprise Edition Status */}
            <Col xs={24} sm={12} md={8}>
              <Card
                size="small"
                style={{ height: '100%', textAlign: 'center' }}
                bodyStyle={{ padding: '16px' }}
              >
                <Statistic
                  title="Enterprise Edition"
                  value={environment.licenseDetails.eeActive ? "Active" : "Inactive"}
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
              License Information
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
                    bodyStyle={{ padding: '12px' }}
                  >
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#262626' }}>
                        {license.customerName}
                      </strong>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>
                      ID: {license.customerId}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>
                      UUID: <span style={{ fontFamily: 'monospace' }}>{license.uuid.substring(0, 8)}...</span>
                    </div>
                    <Tag color="blue">
                      {license.apiCallsLimit.toLocaleString()} calls
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