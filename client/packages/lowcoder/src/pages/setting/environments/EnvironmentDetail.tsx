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
} from "@ant-design/icons";

import { useSingleEnvironmentContext } from "./context/SingleEnvironmentContext";
import EditEnvironmentModal from "./components/EditEnvironmentModal";
import UnlicensedEnvironmentView from "./components/UnlicensedEnvironmentView";
import { Environment } from "./types/environment.types";
import history from "@lowcoder-ee/util/history";
import WorkspacesTab from "./components/WorkspacesTab";
import UserGroupsTab from "./components/UserGroupsTab";
import EnvironmentHeader from "./components/EnvironmentHeader";
import ModernBreadcrumbs from "./components/ModernBreadcrumbs";
import { getEnvironmentTagColor } from "./utils/environmentUtils";
import ErrorComponent from './components/ErrorComponent';
const { TabPane } = Tabs;

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

  const breadcrumbItems = [
    {
      key: 'environments',
      title: (
        <span>
          <HomeOutlined /> Environments
        </span>
      ),
      onClick: () => history.push("/setting/environments")
    },
    {
      key: 'currentEnvironment',
      title: environment.environmentName
    }
  ];

  return (
    <div
      className="environment-detail-container"
      style={{ padding: "24px", flex: 1, minWidth: "1000px" }}
    >
      {/* Environment Header Component */}
      <EnvironmentHeader 
        environment={environment} 
        onEditClick={handleEditClick} 
      />

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
          <Descriptions.Item label="Environment Type">
            <Tag
              color={getEnvironmentTagColor(environment.environmentType)}
              style={{ borderRadius: '4px' }}
            >
              {environment.environmentType}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="License Status">
            {(() => {
              switch (environment.licenseStatus) {
                case 'checking':
                  return <Tag icon={<SyncOutlined spin />} color="blue" style={{ borderRadius: '4px' }}>Checking...</Tag>;
                case 'licensed':
                  return <Tag icon={<CheckCircleOutlined />} color="green" style={{ borderRadius: '4px' }}>Licensed</Tag>;
                case 'unlicensed':
                  return <Tag icon={<CloseCircleOutlined />} color="red" style={{ borderRadius: '4px' }}>Not Licensed</Tag>;
                case 'error':
                  return <Tag icon={<ExclamationCircleOutlined />} color="orange" style={{ borderRadius: '4px' }}>License Error</Tag>;
                default:
                  return <Tag color="default" style={{ borderRadius: '4px' }}>Unknown</Tag>;
              }
            })()}
          </Descriptions.Item>
          <Descriptions.Item label="API Key Status">
            {environment.environmentApikey ? (
              <Tag color="green" style={{ borderRadius: '4px' }}>Configured</Tag>
            ) : (
              <Tag color="red" style={{ borderRadius: '4px' }}>Not Configured</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Master Environment">
            {environment.isMaster ? "Yes" : "No"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Modern Breadcrumbs navigation */}
      <ModernBreadcrumbs items={breadcrumbItems} />
      
      {/* Tabs for Workspaces and User Groups */}
      <Tabs 
        defaultActiveKey="workspaces"
        activeKey={activeTab}
        onChange={setActiveTab}
        className="modern-tabs"
        type="line"
      >
        <TabPane 
          tab={
            <span>
              <AppstoreOutlined /> Workspaces
            </span>
          } 
          key="workspaces"
        >
          <WorkspacesTab environment={environment} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <UsergroupAddOutlined /> User Groups
            </span>
          }
          key="userGroups"
        >
          <UserGroupsTab environment={environment} />
        </TabPane>
      </Tabs>

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
    </div>
  );
};

export default EnvironmentDetail;