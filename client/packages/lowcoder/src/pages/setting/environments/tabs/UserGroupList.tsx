// tabs/UserGroupList.tsx - Component for displaying user groups within an environment
import React, { useState, useEffect } from "react";
import { Table, Button, Tag, Spin, Typography } from "antd";
import styled from "styled-components";
import { trans } from "i18n";
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

// Define interface for user group data
interface UserGroup {
  id: string;
  name: string;
  users: number;
  managed: boolean;
  deployed: string[];
}

interface UserGroupListProps {
  environmentId: string;
  expanded?: boolean;
}

const UserGroupList: React.FC<UserGroupListProps> = ({ environmentId, expanded = false }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [activeTab, setActiveTab] = useState<string>("overview"); // This would typically come from parent component

  useEffect(() => {
    // Mock API call to fetch user groups
    setLoading(true);
    setTimeout(() => {
      // Mock data
      const mockUserGroups: UserGroup[] = [
        {
          id: "ug1",
          name: "Marketing Team",
          users: 12,
          managed: true,
          deployed: ["env2", "env3"]
        },
        {
          id: "ug2",
          name: "Sales Team",
          users: 15,
          managed: true,
          deployed: ["env2"]
        },
        {
          id: "ug3",
          name: "Engineering Team",
          users: 8,
          managed: false,
          deployed: []
        },
        {
          id: "ug4",
          name: "HR Team",
          users: 6,
          managed: false,
          deployed: []
        }
      ];
      setUserGroups(mockUserGroups);
      setLoading(false);
    }, 1000);
  }, [environmentId]);

  const toggleUserGroupManaged = (userGroupId: string, currentState: boolean) => {
    // Mock API call to toggle user group managed state
    console.log(`Toggle user group ${userGroupId} managed state to ${!currentState}`);
    
    // Update local state for demo
    setUserGroups(userGroups.map(ug => 
      ug.id === userGroupId ? { ...ug, managed: !currentState } : ug
    ));
  };

  const columns = [
    {
      title: trans("environmentSettings.userGroupName"),
      dataIndex: "name",
      key: "name",
      render: (text: string, record: UserGroup) => (
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
      title: trans("environmentSettings.users"),
      dataIndex: "users",
      key: "users",
    },
    {
      title: trans("environmentSettings.manage"),
      key: "manage",
      render: (_: any, record: UserGroup) => (
        <StyledSwitch
          checked={record.managed}
          onChange={() => toggleUserGroupManaged(record.id, record.managed)}
        />
      ),
    },
    {
      title: trans("environmentSettings.actions"),
      key: "actions",
      render: (_: any, record: UserGroup) => (
        <Button 
          type="primary" 
          size="small"
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
            ? trans("environmentSettings.userGroups") 
            : trans("environmentSettings.recentUserGroups")}
        </Title>
        {!expanded && (
          <Button 
            type="link"
            onClick={() => setActiveTab("userGroups")}
          >
            {trans("environmentSettings.viewAll")}
          </Button>
        )}
      </SectionTitle>
      
      <Spin spinning={loading}>
        <Table 
          dataSource={expanded ? userGroups : userGroups.slice(0, 3)}
          columns={columns}
          rowKey="id"
          pagination={expanded ? {} : false}
        />
      </Spin>
    </div>
  );
};

export default UserGroupList;