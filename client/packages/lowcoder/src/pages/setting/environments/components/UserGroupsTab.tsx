// components/UserGroupsTab.tsx
import React from 'react';
import { Card, Button, Row, Col, Statistic, Divider, Alert } from 'antd';
import { TeamOutlined, UserOutlined, SyncOutlined } from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { Environment } from '../types/environment.types';
import { useEnvironmentUserGroups } from '../hooks/useEnvironmentUserGroups';
import  UserGroupsList  from './UserGroupsList';

interface UserGroupsTabProps {
  environment: Environment;
}

const UserGroupsTab: React.FC<UserGroupsTabProps> = ({ environment }) => {
  const {
    userGroups,
    loading: userGroupsLoading,
    error: userGroupsError,
    userGroupStats,
  } = useEnvironmentUserGroups(environment);

  return (
    <Card>
      {/* Header with refresh button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <Title level={5}>User Groups in this Environment</Title>
      </div>

      {/* User Group Statistics */}
      <Row gutter={16} style={{ marginBottom: "24px" }}>
        <Col span={8}>
          <Statistic
            title="Total User Groups"
            value={userGroupStats.total}
            prefix={<TeamOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Total Users"
            value={userGroupStats.totalUsers}
            prefix={<UserOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Admin Users"
            value={userGroupStats.adminUsers}
            prefix={<UserOutlined />}
          />
        </Col>
      </Row>

      <Divider style={{ margin: "16px 0" }} />

      {/* Show error if user group loading failed */}
      {userGroupsError && (
        <Alert
          message="Error loading user groups"
          description={userGroupsError}
          type="error"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Show warning if no API key or API service URL is configured */}
      {(!environment.environmentApikey ||
        !environment.environmentApiServiceUrl) &&
        !userGroupsError && (
          <Alert
            message="Configuration Issue"
            description={
              !environment.environmentApikey
                ? "An API key is required to fetch user groups for this environment."
                : "An API service URL is required to fetch user groups for this environment."
            }
            type="warning"
            showIcon
            style={{ marginBottom: "16px" }}
          />
        )}

      {/* User Groups List */}
      <UserGroupsList
        userGroups={userGroups}
        loading={userGroupsLoading && !userGroupsError}
        error={userGroupsError}
      />
    </Card>
  );
};

export default UserGroupsTab;