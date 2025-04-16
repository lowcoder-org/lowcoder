import React, { useState } from "react";
import { Typography, Alert, Input, Button, Space, Empty } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import { useEnvironmentContext } from "./context/EnvironmentContext";
import { Environment } from "./types/environment.types";
import EnvironmentsTable from "./components/EnvironmentsTable";
import { buildEnvironmentId } from "@lowcoder-ee/constants/routesURL";
import EditEnvironmentModal from "./components/EditEnvironmentModal";

const { Title } = Typography;

/**
 * Environment Listing Page Component
 * Displays a table of environments
 */
const EnvironmentsList: React.FC = () => {
  // Use the shared context instead of a local hook
  const { 
    environments, 
    isLoadingEnvironments, 
    error, 
    refreshEnvironments,
    updateEnvironmentData 
  } = useEnvironmentContext();

  // State for edit modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);


  // State for search input
  const [searchText, setSearchText] = useState("");

  // Hook for navigation
  const history = useHistory();

  // Filter environments based on search text
  const filteredEnvironments = environments.filter((env) => {
    const searchLower = searchText.toLowerCase();
    return (
      (env.environmentName || "").toLowerCase().includes(searchLower) ||
      (env.environmentFrontendUrl || "").toLowerCase().includes(searchLower) ||
      env.environmentId.toLowerCase().includes(searchLower) ||
      env.environmentType.toLowerCase().includes(searchLower)
    );
  });

  // Handle row click to navigate to environment detail
  const handleRowClick = (record: Environment) => {
    history.push(buildEnvironmentId(record.environmentId));
  };


  // Handle edit button click
  const handleEditClick = (environment: Environment) => {
    setSelectedEnvironment(environment);
    setIsEditModalVisible(true);
  };
  
  // Handle modal close
  const handleCloseModal = () => {
    setIsEditModalVisible(false);
    setSelectedEnvironment(null);
  };
  
  // Handle save environment
  const handleSaveEnvironment = async (environmentId: string, data: Partial<Environment>) => {
    setIsUpdating(true);
    try {
      // Use the context function to update the environment
      // This will automatically update both the environments list and the detail view
      await updateEnvironmentData(environmentId, data);
    } catch (error) {
      console.error('Failed to update environment:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="environments-container" style={{ padding: "24px" }}>
      {/* Header section with title and controls */}
      <div
        className="environments-header"
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={3}>Environments</Title>
        <Space>
          <Input
            placeholder="Search environments"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => refreshEnvironments()} 
            loading={isLoadingEnvironments}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {/* Error handling */}
      {error && (
        <Alert
          message="Error loading environments"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: "24px" }}
        />
      )}

      {/* Empty state handling */}
      {!isLoadingEnvironments && environments.length === 0 && !error ? (
        <Empty
          description="No environments found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        /* Table component */
        <EnvironmentsTable
          environments={filteredEnvironments}
          loading={isLoadingEnvironments}
          onRowClick={handleRowClick}
          onEditClick={handleEditClick}
        />
      )}

      {/* Edit Environment Modal */}
      <EditEnvironmentModal
        visible={isEditModalVisible}
        environment={selectedEnvironment}
        onClose={handleCloseModal}
        onSave={handleSaveEnvironment}
        loading={isUpdating}
      />
    </div>
  );
};

export default EnvironmentsList;