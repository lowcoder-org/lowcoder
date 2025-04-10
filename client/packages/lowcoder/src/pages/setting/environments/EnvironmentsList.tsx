import React, { useState } from "react";
import { Table, Typography, Alert, Input, Button, Space, Empty } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import { useEnvironments } from "./hooks/useEnvironments";
import { Environment } from "./types/environment.types";
import EnvironmentsTable from "./components/EnvironmentsTable";
import { buildEnvironmentId } from "@lowcoder-ee/constants/routesURL";

const { Title } = Typography;

/**
 * Environment Listing Page Component
 * Displays a basic table of environments
 */
const EnvironmentsList: React.FC = () => {
  // Use our custom hook to get environments data and states
  const { environments, loading, error, refresh } = useEnvironments();

  // State for search input
  const [searchText, setSearchText] = useState("");

  // Hook for navigation (using history instead of navigate)
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

  // Define table columns - updated to match the actual data structure
  const columns = [
    {
      title: "Name",
      dataIndex: "environmentName",
      key: "environmentName",
      render: (name: string) => name || "Unnamed Environment",
    },
    {
      title: "Domain",
      dataIndex: "environmentFrontendUrl",
      key: "environmentFrontendUrl",
      render: (url: string) => url || "No URL",
    },
    {
      title: "ID",
      dataIndex: "environmentId",
      key: "environmentId",
    },
    {
      title: "Stage",
      dataIndex: "environmentType",
      key: "environmentType",
    },
    {
      title: "Master",
      dataIndex: "isMaster",
      key: "isMaster",
      render: (isMaster: boolean) => (isMaster ? "Yes" : "No"),
    },
  ];

  // Handle row click to navigate to environment detail
  const handleRowClick = (record: Environment) => {
    history.push(buildEnvironmentId(record.environmentId));
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
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
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
      {!loading && environments.length === 0 && !error ? (
        <Empty
          description="No environments found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        /* Table component */
        <EnvironmentsTable
          environments={filteredEnvironments}
          loading={loading}
          onRowClick={handleRowClick}
        />
      )}
    </div>
  );
};

export default EnvironmentsList;
