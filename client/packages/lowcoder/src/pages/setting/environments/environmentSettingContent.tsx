// environmentSettingContent.tsx - Detail page for a single environment
import React, { useState } from "react";
import { ArrowIcon, BlurFinishInput } from "lowcoder-design";
import { useDispatch } from "react-redux";
// Replace with actual action when available
// import { updateEnvironmentAction } from "redux/reduxActions/environmentActions";
import styled from "styled-components";
import { trans } from "i18n";
import { useParams } from "react-router";
import { HeaderBack } from "../permission/styledComponents";
import history from "util/history";
import { ENVIRONMENT_SETTING } from "constants/routesURL";
import { Tabs, Button, Empty, Spin } from "antd";
import WorkspaceList from "./tabs/WorkspaceList";
import UserGroupList from "./tabs/UserGroupList";

const { TabPane } = Tabs;

const FieldWrapper = styled.div`
  margin-bottom: 32px;
  width: 408px;
  margin-top: 40px;
`;

const Wrapper = styled.div`
  padding: 32px 24px;
`;

const TabsWrapper = styled.div`
  margin-top: 24px;
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: #F5F5F6;
  border-radius: 8px;
  padding: 16px;
  width: 200px;
  
  .stat-title {
    font-size: 14px;
    color: #8B8FA3;
    margin-bottom: 8px;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: 500;
    color: #333;
  }
`;

// Mock interface for Environment data
interface Environment {
  id: string;
  name: string;
  domain: string;
  stage: string;
  isMaster: boolean;
  hasApiKey: boolean;
  createTime: number;
  stats?: {
    workspaces: number;
    userGroups: number;
    totalUsers: number;
    managedObjects: number;
  };
}

function EnvironmentSettingContent() {
  const environmentId = useParams<{ environmentId: string }>().environmentId;
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  
  // Mock environments data (replace with actual Redux selector when available)
  const mockEnvironments: Environment[] = [
    {
      id: "env1",
      name: "Development",
      domain: "lowcoder-dev.company.com",
      stage: "development",
      isMaster: true,
      hasApiKey: true,
      createTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
      stats: {
        workspaces: 12,
        userGroups: 8,
        totalUsers: 45,
        managedObjects: 35
      }
    },
    {
      id: "env2",
      name: "Testing",
      domain: "lowcoder-test.company.com",
      stage: "testing",
      isMaster: false,
      hasApiKey: true,
      createTime: Date.now() - 14 * 24 * 60 * 60 * 1000,
      stats: {
        workspaces: 8,
        userGroups: 6,
        totalUsers: 24,
        managedObjects: 19
      }
    },
    {
      id: "env3",
      name: "Production",
      domain: "lowcoder-prod.company.com", 
      stage: "production",
      isMaster: false,
      hasApiKey: false,
      createTime: Date.now() - 30 * 24 * 60 * 60 * 1000,
      stats: {
        workspaces: 4,
        userGroups: 3,
        totalUsers: 15,
        managedObjects: 8
      }
    },
  ];
  
  const environment = mockEnvironments.find(env => env.id === environmentId);
  
  if (!environment) {
    return null;
  }

  // Function to determine if we can fetch data from this environment
  const canFetchData = environment.hasApiKey;
  
  return (
    <Wrapper>
      <HeaderBack>
        <span onClick={() => history.push(ENVIRONMENT_SETTING)}>
          {trans("settings.environments")}
        </span>
        <ArrowIcon />
        <span>{environment.name}</span>
      </HeaderBack>
      
      <FieldWrapper>
        <BlurFinishInput
          inputStyle={{ height: "40px" }}
          label={trans("environmentSettings.nameLabel")}
          mustFill
          valueCheck={{
            rule: (val) => val.trim() !== "",
            message: trans("environmentSettings.nameCheckMsg"),
          }}
          defaultValue={environment.name}
          onFinish={(value) => {
            // Replace with actual action when available
            // dispatch(updateEnvironmentAction({ id: environment.id, name: value }));
            console.log("Update environment name", environment.id, value);
          }}
        />
      </FieldWrapper>
      
      <FieldWrapper>
        <BlurFinishInput
          inputStyle={{ height: "40px" }}
          label={trans("environmentSettings.domainLabel")}
          mustFill
          valueCheck={{
            rule: (val) => val.trim() !== "",
            message: trans("environmentSettings.domainCheckMsg"),
          }}
          defaultValue={environment.domain}
          onFinish={(value) => {
            // Replace with actual action when available
            // dispatch(updateEnvironmentAction({ id: environment.id, domain: value }));
            console.log("Update environment domain", environment.id, value);
          }}
        />
      </FieldWrapper>
      
      <FieldWrapper>
        <BlurFinishInput
          inputStyle={{ height: "40px" }}
          label={trans("environmentSettings.stageLabel")}
          mustFill
          valueCheck={{
            rule: (val) => val.trim() !== "",
            message: trans("environmentSettings.stageCheckMsg"),
          }}
          defaultValue={environment.stage}
          onFinish={(value) => {
            // Replace with actual action when available
            // dispatch(updateEnvironmentAction({ id: environment.id, stage: value }));
            console.log("Update environment stage", environment.id, value);
          }}
        />
      </FieldWrapper>

      <TabsWrapper>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={trans("environmentSettings.overviewTab")} key="overview">
            {canFetchData ? (
              <>
                <StatsContainer>
                  <StatCard>
                    <div className="stat-title">{trans("environmentSettings.workspacesCount")}</div>
                    <div className="stat-value">{environment.stats?.workspaces || 0}</div>
                  </StatCard>
                  <StatCard>
                    <div className="stat-title">{trans("environmentSettings.userGroupsCount")}</div>
                    <div className="stat-value">{environment.stats?.userGroups || 0}</div>
                  </StatCard>
                  <StatCard>
                    <div className="stat-title">{trans("environmentSettings.totalUsersCount")}</div>
                    <div className="stat-value">{environment.stats?.totalUsers || 0}</div>
                  </StatCard>
                  <StatCard>
                    <div className="stat-title">{trans("environmentSettings.managedObjectsCount")}</div>
                    <div className="stat-value">{environment.stats?.managedObjects || 0}</div>
                  </StatCard>
                </StatsContainer>
                
                <WorkspaceList environmentId={environmentId} />
                <UserGroupList environmentId={environmentId} />
              </>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    {trans("environmentSettings.noApiKeyConfigured")}
                    <br />
                    {trans("environmentSettings.configureApiKeyFirst")}
                  </span>
                }
              >
                <Button 
                  type="primary"
                  onClick={() => history.push(ENVIRONMENT_SETTING)}
                >
                  {trans("environmentSettings.goToEnvironmentsList")}
                </Button>
              </Empty>
            )}
          </TabPane>
          <TabPane tab={trans("environmentSettings.workspacesTab")} key="workspaces">
            {canFetchData ? (
              <WorkspaceList environmentId={environmentId} expanded={true} />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={trans("environmentSettings.noApiKeyConfigured")}
              />
            )}
          </TabPane>
          <TabPane tab={trans("environmentSettings.userGroupsTab")} key="userGroups">
            {canFetchData ? (
              <UserGroupList environmentId={environmentId} expanded={true} />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={trans("environmentSettings.noApiKeyConfigured")}
              />
            )}
          </TabPane>
        </Tabs>
      </TabsWrapper>
    </Wrapper>
  );
}

export default EnvironmentSettingContent;