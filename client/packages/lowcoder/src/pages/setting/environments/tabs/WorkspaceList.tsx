// tabs/WorkspaceList.tsx - Component for displaying workspaces within an environment
import React, { useState, useEffect } from "react";
import { Table, Button, Tag, Spin, Typography, Switch } from "antd";
import styled from "styled-components";
import { trans } from "i18n";
import { buildEnvironmentWorkspaceId } from "constants/routesURL";
import history from "util/history";
import { ManageTagWrapper, StyledSwitch } from "../styledComponents";

const { Title } = Typography;

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

// Define interface for workspace data
interface Workspace {
  id: string;
  name: string;
  owner: string;
  users: number;
  apps: number;
  managed: boolean;
  deployed: string[];
}

interface WorkspaceListProps {
  environmentId: string;
  expanded?: boolean;
}

const WorkspaceList: React.FC<WorkspaceListProps> = ({ environmentId, expanded = false }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeTab, setActiveTab] = useState<string>("overview"); // This would typically come from parent component

  useEffect(() => {
    // Mock API call to fetch workspaces
    setLoading(true);
    setTimeout(() => {
      // Mock data
      const mockWorkspaces: Workspace[] = [
        {
          id: "ws1",
          name: "Marketing",
          owner: "John Doe",
          users: 12,
          apps: 8,
          managed: true,
          deployed: ["env2", "env3"]
        },
        {
          id: "ws2",
          name: "Sales",
          owner: "Jane Smith",
          users: 15,
          apps: 10,
          managed: true,
          deployed: ["env2"]
        },
        {
          id: "ws3",
          name: "Engineering",
          owner: "Robert Johnson",
          users: 8,
          apps: 5,
          managed: false,
          deployed: []
        },
        {
          id: "ws4",
          name: "Human Resources",
          owner: "Emily Davis",
          users: 6,
          apps: 3,
          managed: false,
          deployed: []
        }
      ];
      setWorkspaces(mockWorkspaces);
      setLoading(false);
    }, 1000);
  }, [environmentId]);

  const toggleWorkspaceManaged = (workspaceId: string, currentState: boolean) => {
    // Mock API call to toggle workspace managed state
    console.log(`Toggle workspace ${workspaceId} managed state to ${!currentState}`);
    
    // Update local state for demo
    setWorkspaces(workspaces.map(ws => 
      ws.id === workspaceId ? { ...ws, managed: !currentState } : ws
    ));
  };

  const columns = [
    {
      title: trans("environmentSettings.workspaceName"),
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Workspace) => (
        <span>
          {text}
          {record.managed && (
            <ManageTagWrapper>
              <Tag color="blue">{trans("environmentSettings.managed")}</Tag>
            </ManageTagWrapper>
          )}
        </span>
      ),
    },
    {
      title: trans("environmentSettings.owner"),
      dataIndex: "owner",
      key: "owner",
    },
    {
      title: trans("environmentSettings.users"),
      dataIndex: "users",
      key: "users",
    },
    {
      title: trans("environmentSettings.apps"),
      dataIndex: "apps",
      key: "apps",
    },
    {
      title: trans("environmentSettings.manage"),
      key: "manage",
      render: (_: any, record: Workspace) => (
        <StyledSwitch
          checked={record.managed}
          onChange={() => toggleWorkspaceManaged(record.id, record.managed)}
        />
      ),
    },
    {
      title: trans("environmentSettings.actions"),
      key: "actions",
      render: (_: any, record: Workspace) => (
        <Button 
          type="primary" 
          size="small"
          onClick={() => history.push(buildEnvironmentWorkspaceId(environmentId, record.id))}
          disabled={!record.managed}
        >
          {trans("environmentSettings.viewDetails")}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <SectionTitle>
        <Title level={4}>
          {expanded 
            ? trans("environmentSettings.workspaces") 
            : trans("environmentSettings.recentWorkspaces")}
        </Title>
        {!expanded && (
          <Button 
            type="link"
            onClick={() => setActiveTab("workspaces")}
          >
            {trans("environmentSettings.viewAll")}
          </Button>
        )}
      </SectionTitle>
      
      <Spin spinning={loading}>
        <Table 
          dataSource={expanded ? workspaces : workspaces.slice(0, 3)}
          columns={columns}
          rowKey="id"
          pagination={expanded ? {} : false}
        />
      </Spin>
    </div>
  );
};

export default WorkspaceList;