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
    isLoading, 
    error, 
  } = useEnvironmentContext();

  console.log("Environments:", environments);

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

  return (
    <div className="environments-container" style={{ padding: "24px", flex:1 }}>
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
      {!isLoading && environments.length === 0 && !error ? (
        <Empty
          description="No environments found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        /* Table component */
        <EnvironmentsTable
          environments={filteredEnvironments}
          loading={isLoading}
          onRowClick={handleRowClick}
        />
      )}
    </div>
  );
};

export default EnvironmentsList;