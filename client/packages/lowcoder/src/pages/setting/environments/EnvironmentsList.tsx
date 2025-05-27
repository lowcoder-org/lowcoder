import React, { useState, useEffect } from "react";
import { Alert, Empty, Spin } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import { AddIcon, Search, TacoButton } from "lowcoder-design";
import { useHistory } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectEnvironments, selectEnvironmentsLoading, selectEnvironmentsError } from "redux/selectors/enterpriseSelectors";
import { fetchEnvironments } from "redux/reduxActions/enterpriseActions";
import { Environment } from "./types/environment.types";
import EnvironmentsTable from "./components/EnvironmentsTable";
import CreateEnvironmentModal from "./components/CreateEnvironmentModal";
import { buildEnvironmentId } from "@lowcoder-ee/constants/routesURL";
import { createEnvironment } from "./services/environments.service";
import styled from "styled-components";

const EnvironmentsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 92px;
  padding: 28px 36px;
  width: 100%;
`;

const Title = styled.div`
  font-weight: 500;
  font-size: 18px;
  color: #222222;
  line-height: 18px;
  flex-grow: 1;
`;

const AddBtn = styled(TacoButton)`
  min-width: 96px;
  width: fit-content;
  height: 32px;
`;

const RefreshBtn = styled(TacoButton)`
  width: fit-content;
  height: 32px;
  margin-right: 12px;
`;

const BodyWrapper = styled.div`
  width: 100%;
  flex-grow: 1;
  padding: 0 24px;
`;

/**
 * Environment Listing Page Component
 * Displays a table of environments
 */
const EnvironmentsList: React.FC = () => {
  // Use Redux state instead of context
  const dispatch = useDispatch();
  const environments = useSelector(selectEnvironments);
  const isLoading = useSelector(selectEnvironmentsLoading);
  const error = useSelector(selectEnvironmentsError);

  // State for search input
  const [searchText, setSearchText] = useState("");
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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
  }).sort((a, b) => {
    // Sort by license status: licensed environments first
    const aLicensed = a.isLicensed !== false; // licensed or unknown (default to licensed)
    const bLicensed = b.isLicensed !== false; // licensed or unknown (default to licensed)
    
    if (aLicensed && !bLicensed) return -1; // a licensed, b unlicensed - a comes first
    if (!aLicensed && bLicensed) return 1;  // a unlicensed, b licensed - b comes first
    
    // If both have same license status, sort by environment name
    return (a.environmentName || "").localeCompare(b.environmentName || "");
  });

  // Handle row click to navigate to environment detail
  const handleRowClick = (record: Environment) => {
    // Allow navigation to all environments including unlicensed ones
    history.push(buildEnvironmentId(record.environmentId));
  };

  // Handle refresh
  const handleRefresh = () => {
    dispatch(fetchEnvironments());
  };

  // Handle create environment
  const handleCreateEnvironment = async (environmentData: Partial<Environment>) => {
    setIsCreating(true);
    try {
      await createEnvironment(environmentData);
      dispatch(fetchEnvironments()); // Refresh the list after creation
    } catch (error) {
      console.error("Failed to create environment:", error);
      throw error; // Re-throw to let the modal handle the error display
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <EnvironmentsWrapper>
      <HeaderWrapper>
        <Title>Environments</Title>
        <Search
          placeholder="Search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: "192px", height: "32px", margin: "0 12px 0 0" }}
        />
        <RefreshBtn 
          buttonType="normal" 
          icon={<SyncOutlined spin={isLoading} />}
          onClick={handleRefresh}
          loading={isLoading}
        >
          Refresh
        </RefreshBtn>
        <AddBtn buttonType="primary" onClick={() => setIsCreateModalVisible(true)}>
          New Environment
        </AddBtn>
      </HeaderWrapper>

      <BodyWrapper>
        {/* Error handling */}
        {error && (
          <Alert
            message="Error loading environments"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: "16px" }}
          />
        )}

        {/* Loading, empty state or table */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : environments.length === 0 && !error ? (
          <Empty
            description="No environments found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '60px 0' }}
          />
        ) : filteredEnvironments.length === 0 ? (
          <Empty
            description="No environments match your search"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '60px 0' }}
          />
        ) : (
          /* Table component */
          <EnvironmentsTable
            environments={filteredEnvironments}
            loading={isLoading}
            onRowClick={handleRowClick}
          />
        )}

        {/* Results counter when searching */}
        {searchText && filteredEnvironments.length !== environments.length && (
          <div style={{ marginTop: 16, color: '#8c8c8c', textAlign: 'right' }}>
            Showing {filteredEnvironments.length} of {environments.length} environments
          </div>
        )}
      </BodyWrapper>

      {/* Create Environment Modal */}
      <CreateEnvironmentModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSave={handleCreateEnvironment}
        loading={isCreating}
      />
    </EnvironmentsWrapper>
  );
};

export default EnvironmentsList;