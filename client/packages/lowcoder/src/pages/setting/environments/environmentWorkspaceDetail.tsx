// environmentWorkspaceDetail.tsx - Detail page for a workspace within an environment
import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import { ArrowIcon } from "lowcoder-design";
import styled from "styled-components";
import { trans } from "i18n";
import { HeaderBack } from "../permission/styledComponents";
import history from "util/history";
import { ENVIRONMENT_SETTING, buildEnvironmentId } from "constants/routesURL";
import { Tabs, Button, Table, Tag, Spin, Typography, Modal, Form, Select, Input, Divider, Switch } from "antd";
import { ManageTagWrapper } from "./styledComponents";

const { TabPane } = Tabs;
const { Title } = Typography;
const { Option } = Select;

const Wrapper = styled.div`
  padding: 32px 24px;
`;

const TabsWrapper = styled.div`
  margin-top: 24px;
`;

const SectionTitle = styled.div`
  margin-top: 24px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h4 {
    margin: 0;
  }
`;

const ActionButton = styled(Button)`
  margin-left: 8px;
`;

// Define interfaces for our data types
interface Environment {
  id: string;
  name: string;
  domain: string;
}

interface Workspace {
  id: string;
  name: string;
  owner: string;
  users: number;
  managed: boolean;
  deployedTo: string[];
}

interface App {
  id: string;
  name: string;
  icon: string;
  published: boolean;
  owner: string;
  managed: boolean;
  deployedTo: string[];
}

interface DataSource {
  id: string;
  name: string;
  type: string;
  managed: boolean;
  deployedTo: string[];
}

interface Query {
  id: string;
  name: string;
  dataSource: string;
  managed: boolean;
  deployedTo: string[];
}

interface DeployFormValues {
  targetEnvironment: string;
  copyConfig: boolean;
}

function EnvironmentWorkspaceDetail() {
  const { environmentId, workspaceId } = useParams<{ environmentId: string; workspaceId: string }>();
  const [activeTab, setActiveTab] = useState<string>("apps");
  const [loading, setLoading] = useState<boolean>(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [isDeployModalVisible, setIsDeployModalVisible] = useState<boolean>(false);
  const [deployType, setDeployType] = useState<string>("");
  const [deployForm] = Form.useForm<DeployFormValues>();
  
  // Mock environments data
  const environments: Environment[] = [
    { id: "env1", name: "Development", domain: "lowcoder-dev.company.com" },
    { id: "env2", name: "Testing", domain: "lowcoder-test.company.com" },
    { id: "env3", name: "Production", domain: "lowcoder-prod.company.com" },
  ];
  
  // Get environment name from the mock data
  const environment = environments.find(env => env.id === environmentId);
  
  useEffect(() => {
    // Mock API call to fetch workspace data
    setLoading(true);
    setTimeout(() => {
      // Mock workspace data
      const mockWorkspace: Workspace = {
        id: workspaceId || "",
        name: "Marketing Workspace",
        owner: "John Doe",
        users: 12,
        managed: true,
        deployedTo: ["env2"]
      };
      
      // Mock apps data
      const mockApps: App[] = [
        { 
          id: "app1", 
          name: "Campaign Dashboard", 
          icon: "📊", 
          published: true, 
          owner: "Alice Cooper",
          managed: true,
          deployedTo: ["env2"]
        },
        { 
          id: "app2", 
          name: "Social Media Tracker", 
          icon: "🔍", 
          published: true, 
          owner: "Bob Marley",
          managed: true,
          deployedTo: []
        },
        { 
          id: "app3", 
          name: "Content Calendar", 
          icon: "📅", 
          published: false, 
          owner: "Charlie Brown",
          managed: false,
          deployedTo: []
        }
      ];
      
      // Mock data sources
      const mockDataSources: DataSource[] = [
        { 
          id: "ds1", 
          name: "Marketing Database", 
          type: "PostgreSQL", 
          managed: true,
          deployedTo: ["env2"]
        },
        { 
          id: "ds2", 
          name: "Analytics API", 
          type: "REST API", 
          managed: true,
          deployedTo: []
        }
      ];
      
      // Mock queries
      const mockQueries: Query[] = [
        { 
          id: "q1", 
          name: "Campaign Performance", 
          dataSource: "Marketing Database",
          managed: true,
          deployedTo: ["env2"]
        },
        { 
          id: "q2", 
          name: "User Engagement", 
          dataSource: "Analytics API",
          managed: false,
          deployedTo: []
        }
      ];
      
      setWorkspace(mockWorkspace);
      setApps(mockApps);
      setDataSources(mockDataSources);
      setQueries(mockQueries);
      setLoading(false);
    }, 1000);
  }, [environmentId, workspaceId]);
  
  if (!environment || !workspace) {
    return <Spin spinning={true} />;
  }
  
  const handleDeployModalOpen = (type: string, item: App | DataSource | Query | null = null) => {
    setDeployType(type);
    setIsDeployModalVisible(true);
    if (item) {
      deployForm.setFieldsValue({
        targetEnvironment: '',
        copyConfig: true
      });
    }
  };
  
  const handleDeployModalClose = () => {
    setIsDeployModalVisible(false);
    deployForm.resetFields();
  };
  
  const handleDeploy = () => {
    deployForm.submit();
    deployForm.validateFields().then((values: DeployFormValues) => {
      console.log(`Deploy ${deployType} to ${values.targetEnvironment} environment`);
      console.log('Form values:', values);
      handleDeployModalClose();
      
      // Mock deployment success - update UI
      if (deployType === 'workspace' && workspace) {
        setWorkspace({
          ...workspace,
          deployedTo: [...workspace.deployedTo, values.targetEnvironment]
        });
      } else if (deployType === 'app') {
        // In a real implementation, you would need to know which app is being deployed
        // This is just a simple mock
        setApps(apps.map((app, index) => 
          index === 0 ? {
            ...app,
            deployedTo: [...app.deployedTo, values.targetEnvironment]
          } : app
        ));
      }
    });
  };
  
  return (
    <Wrapper>
      <HeaderBack>
        <span onClick={() => history.push(ENVIRONMENT_SETTING)}>
          {trans("settings.environments")}
        </span>
        <ArrowIcon />
        <span onClick={() => history.push(buildEnvironmentId(environmentId))}>
          {environment.name}
        </span>
        <ArrowIcon />
        <span>{workspace.name}</span>
      </HeaderBack>
      
      <SectionTitle>
        <Title level={3}>{workspace.name}</Title>
        <div>
          <Button 
            type={workspace.managed ? "default" : "primary"}
            onClick={() => {
              // Toggle workspace management status
              setWorkspace({ ...workspace, managed: !workspace.managed });
            }}
          >
            {workspace.managed 
              ? trans("environmentSettings.unmanage") 
              : trans("environmentSettings.manage")}
          </Button>
          
          {workspace.managed && (
            <ActionButton 
              type="primary"
              onClick={() => handleDeployModalOpen('workspace')}
            >
              {trans("environmentSettings.deployWorkspace")}
            </ActionButton>
          )}
        </div>
      </SectionTitle>
      
      <TabsWrapper>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={trans("environmentSettings.appsTab")} key="apps">
            <SectionTitle>
              <Title level={4}>{trans("environmentSettings.applicationsList")}</Title>
            </SectionTitle>
            
            <Table
              loading={loading}
              dataSource={apps}
              rowKey="id"
              columns={[
                {
                  title: trans("environmentSettings.appIcon"),
                  dataIndex: "icon",
                  key: "icon",
                  width: 70,
                  render: (icon: string) => <div style={{ fontSize: '24px' }}>{icon}</div>
                },
                {
                  title: trans("environmentSettings.appName"),
                  dataIndex: "name",
                  key: "name",
                  render: (text: string, record: App) => (
                    <span>
                      {text}
                      {record.managed && (
                        <ManageTagWrapper>
                          <Tag color="blue">{trans("environmentSettings.managed")}</Tag>
                        </ManageTagWrapper>
                      )}
                    </span>
                  )
                },
                {
                  title: trans("environmentSettings.published"),
                  dataIndex: "published",
                  key: "published",
                  render: (published: boolean) => (
                    published ? (
                      <Tag color="green">{trans("environmentSettings.yes")}</Tag>
                    ) : (
                      <Tag color="red">{trans("environmentSettings.no")}</Tag>
                    )
                  )
                },
                {
                  title: trans("environmentSettings.owner"),
                  dataIndex: "owner",
                  key: "owner"
                },
                {
                  title: trans("environmentSettings.deployedTo"),
                  dataIndex: "deployedTo",
                  key: "deployedTo",
                  render: (deployedTo: string[]) => (
                    <>
                      {deployedTo.map(envId => {
                        const env = environments.find(e => e.id === envId);
                        return env ? (
                          <Tag key={envId} color="blue">{env.name}</Tag>
                        ) : null;
                      })}
                    </>
                  )
                },
                {
                  title: trans("environmentSettings.actions"),
                  key: "actions",
                  render: (_: any, record: App) => (
                    <Button
                      type="primary"
                      size="small"
                      disabled={!record.managed}
                      onClick={() => handleDeployModalOpen('app', record)}
                    >
                      {trans("environmentSettings.deploy")}
                    </Button>
                  )
                }
              ]}
            />
          </TabPane>
          
          <TabPane tab={trans("environmentSettings.dataSourcesTab")} key="dataSources">
            <SectionTitle>
              <Title level={4}>{trans("environmentSettings.dataSourcesList")}</Title>
            </SectionTitle>
            
            <Table
              loading={loading}
              dataSource={dataSources}
              rowKey="id"
              columns={[
                {
                  title: trans("environmentSettings.dataSourceName"),
                  dataIndex: "name",
                  key: "name",
                  render: (text: string, record: DataSource) => (
                    <span>
                      {text}
                      {record.managed && (
                        <ManageTagWrapper>
                          <Tag color="blue">{trans("environmentSettings.managed")}</Tag>
                        </ManageTagWrapper>
                      )}
                    </span>
                  )
                },
                {
                  title: trans("environmentSettings.dataSourceType"),
                  dataIndex: "type",
                  key: "type"
                },
                {
                  title: trans("environmentSettings.deployedTo"),
                  dataIndex: "deployedTo",
                  key: "deployedTo",
                  render: (deployedTo: string[]) => (
                    <>
                      {deployedTo.map(envId => {
                        const env = environments.find(e => e.id === envId);
                        return env ? (
                          <Tag key={envId} color="blue">{env.name}</Tag>
                        ) : null;
                      })}
                    </>
                  )
                },
                {
                  title: trans("environmentSettings.actions"),
                  key: "actions",
                  render: (_: any, record: DataSource) => (
                    <Button
                      type="primary"
                      size="small"
                      disabled={!record.managed}
                      onClick={() => handleDeployModalOpen('dataSource', record)}
                    >
                      {trans("environmentSettings.deploy")}
                    </Button>
                  )
                }
              ]}
            />
          </TabPane>
          
          <TabPane tab={trans("environmentSettings.queriesTab")} key="queries">
            <SectionTitle>
              <Title level={4}>{trans("environmentSettings.queriesList")}</Title>
            </SectionTitle>
            
            <Table
              loading={loading}
              dataSource={queries}
              rowKey="id"
              columns={[
                {
                  title: trans("environmentSettings.queryName"),
                  dataIndex: "name",
                  key: "name",
                  render: (text: string, record: Query) => (
                    <span>
                      {text}
                      {record.managed && (
                        <ManageTagWrapper>
                          <Tag color="blue">{trans("environmentSettings.managed")}</Tag>
                        </ManageTagWrapper>
                      )}
                    </span>
                  )
                },
                {
                  title: trans("environmentSettings.dataSource"),
                  dataIndex: "dataSource",
                  key: "dataSource"
                },
                {
                  title: trans("environmentSettings.deployedTo"),
                  dataIndex: "deployedTo",
                  key: "deployedTo",
                  render: (deployedTo: string[]) => (
                    <>
                      {deployedTo.map(envId => {
                        const env = environments.find(e => e.id === envId);
                        return env ? (
                          <Tag key={envId} color="blue">{env.name}</Tag>
                        ) : null;
                      })}
                    </>
                  )
                },
                {
                  title: trans("environmentSettings.actions"),
                  key: "actions",
                  render: (_: any, record: Query) => (
                    <Button
                      type="primary"
                      size="small"
                      disabled={!record.managed}
                      onClick={() => handleDeployModalOpen('query', record)}
                    >
                      {trans("environmentSettings.deploy")}
                    </Button>
                  )
                }
              ]}
            />
          </TabPane>
        </Tabs>
      </TabsWrapper>
      
      {/* Deploy Modal */}
      <Modal
        title={trans(`environmentSettings.deploy${deployType.charAt(0).toUpperCase() + deployType.slice(1)}Title`)}
        open={isDeployModalVisible}
        onCancel={handleDeployModalClose}
        onOk={handleDeploy}
        okText={trans("environmentSettings.deployButton")}
      >
        <Form layout="vertical" form={deployForm}>
          <Form.Item
            name="targetEnvironment"
            label={trans("environmentSettings.selectTargetEnvironment")}
            rules={[
              {
                required: true,
                message: trans("environmentSettings.targetEnvironmentRequired"),
              },
            ]}
          >
            <Select placeholder={trans("environmentSettings.selectEnvironment")}>
              {environments
                .filter(env => env.id !== environmentId) // Don't show current environment
                .map(env => (
                  <Option key={env.id} value={env.id}>{env.name} ({env.domain})</Option>
                ))
              }
            </Select>
          </Form.Item>
          
          <Divider />
          
          <Form.Item
            name="copyConfig"
            label={trans("environmentSettings.deploymentOptions")}
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
          <span>{trans("environmentSettings.copyConfigurationExplanation")}</span>
        </Form>
      </Modal>
    </Wrapper>
  );
}

export default EnvironmentWorkspaceDetail;