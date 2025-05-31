import React, { useState, useEffect } from "react";
import { Alert, Empty, Spin, Card, Row, Col } from "antd";
import { SyncOutlined, CloudServerOutlined } from "@ant-design/icons";
import { AddIcon, Search, TacoButton } from "lowcoder-design";
import { useHistory } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectEnvironments, selectEnvironmentsLoading, selectEnvironmentsError } from "redux/selectors/enterpriseSelectors";
import { fetchEnvironments } from "redux/reduxActions/enterpriseActions";
import { Environment } from "./types/environment.types";
import EnvironmentsTable from "./components/EnvironmentsTable";
import CreateEnvironmentModal from "./components/CreateEnvironmentModal";
import StatsCard from "./components/StatsCard";
import { buildEnvironmentId } from "@lowcoder-ee/constants/routesURL";
import { createEnvironment } from "./services/environments.service";
import { getEnvironmentTagColor } from "./utils/environmentUtils";
import { trans } from "i18n";
import styled from "styled-components";

const EnvironmentsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 1000px;
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

const StatsWrapper = styled.div`
  margin-bottom: 20px;
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

  // Calculate environment type statistics
  const environmentStats = React.useMemo(() => {
    const stats = environments.reduce((acc, env) => {
      const type = env.environmentType?.toUpperCase() || 'TEST';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sort by common environment types first
    const typeOrder = ['PROD', 'PREPROD', 'TEST', 'DEV'];
    const sortedStats = Object.entries(stats).sort(([a], [b]) => {
      const aIndex = typeOrder.indexOf(a);
      const bIndex = typeOrder.indexOf(b);
      
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });

    return sortedStats;
  }, [environments]);

  // Get icon for environment type
  const getEnvironmentIcon = (type: string) => {
    return <CloudServerOutlined />;
  };

  // Filter environments based on search text
  const filteredEnvironments = environments.filter((env) => {
    const searchLower = searchText.toLowerCase();
    return (
      (env.environmentName || "").toLowerCase().includes(searchLower) ||
      (env.environmentFrontendUrl || "").toLowerCase().includes(searchLower) ||
      env.environmentId.toLowerCase().includes(searchLower) ||
      (env.environmentType || "").toLowerCase().includes(searchLower)
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
        <Title>{trans("environments.title")}</Title>
        <Search
          placeholder={trans("environments.search")}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: "192px", height: "32px", margin: "0 12px 0 0" }}
        />
        <RefreshBtn 
          buttonType="normal" 
          icon={<SyncOutlined spin={isLoading} />}
          onClick={handleRefresh}
        >
          {trans("environments.refresh")}
        </RefreshBtn>
        <AddBtn 
          buttonType="primary" 
          icon={<AddIcon />}
          onClick={() => setIsCreateModalVisible(true)}
        >
          {trans("environments.addEnvironment")}
        </AddBtn>
      </HeaderWrapper>

      <BodyWrapper>
        {/* Environment Statistics Cards */}
        <StatsWrapper>
          <Row gutter={[16, 16]}>
            {environmentStats.map(([type, count]) => (
              <Col xs={24} sm={12} md={8} lg={6} key={type}>
                <StatsCard
                  title={trans("environments.environmentsTypeLabel", { type })}
                  value={count}
                  icon={getEnvironmentIcon(type)}
                  color={getEnvironmentTagColor(type)}
                />
              </Col>
            ))}
          </Row>
        </StatsWrapper>

        {error && (
          <Alert
            message={trans("environments.errorLoadingEnvironments")}
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {!isLoading && !error && filteredEnvironments.length === 0 && searchText && (
          <Empty 
            description={trans("environments.noEnvironmentsFoundMatching", { searchText })}
            style={{ margin: "60px 0" }}
          />
        )}

        {!isLoading && !error && environments.length === 0 && !searchText && (
          <Empty 
            description={trans("environments.noEnvironmentsFound")}
            style={{ margin: "60px 0" }}
          />
        )}

        {(filteredEnvironments.length > 0 || isLoading) && (
          <EnvironmentsTable
            environments={filteredEnvironments}
            loading={isLoading}
            onRowClick={handleRowClick}
          />
        )}
      </BodyWrapper>

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