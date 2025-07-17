import React, { useState } from "react";
import {
  Typography,
  Switch,
  Button,
  Tag,
  Tooltip,
  Row,
  Col,
  Avatar,
  Space,
} from "antd";
import {
  CloudUploadOutlined,
  TeamOutlined,
  CloudServerOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { Environment } from "../types/environment.types";
import { Workspace } from "../types/workspace.types";

const { Title, Text } = Typography;

interface WorkspaceHeaderProps {
  workspace: Workspace;
  environment: Environment;
  isToggling: boolean;
  onToggleManagedStatus: (checked: boolean) => Promise<void>;
  onDeploy: () => void;
}

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  workspace,
  environment,
  isToggling,
  onToggleManagedStatus,
  onDeploy
}) => {
  
  // Generate a consistent color for the workspace avatar
  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 45%, 55%)`;
  };

  // Format date for last updated
  const formatDate = (date: number | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div
      className="workspace-header"
      style={{
        marginBottom: "24px",
        background: '#fff',
        padding: '20px 24px',
        borderRadius: '8px',
        border: '1px solid #f0f0f0',
      }}
    >
      <Row justify="space-between" align="middle" gutter={[16, 16]}>
        <Col xs={24} sm={18}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Avatar 
              size={64} 
              style={{ 
                backgroundColor: getAvatarColor(workspace.name),
                border: '2px solid #f0f0f0',
                fontSize: '24px',
                fontWeight: '500'
              }}
            >
              {workspace.name.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Title level={3} style={{ margin: '0 0 8px 0', color: '#222222', fontWeight: '500' }}>
                {workspace.name}
              </Title>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <Text style={{ 
                  color: '#8b8fa3', 
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}>
                  ID: {workspace.id}
                </Text>
                <Text style={{ color: '#8b8fa3', fontSize: '14px' }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} /> 
                  {formatDate(workspace.creationDate)}
                </Text>
                <Tag color="blue" style={{ borderRadius: '4px', fontSize: '12px' }}>
                  <CloudServerOutlined style={{ marginRight: 4 }} />
                  {environment.environmentName}
                </Tag>
                <Tag 
                  color={workspace.managed ? 'green' : 'orange'} 
                  style={{ borderRadius: '4px', fontSize: '12px' }}
                >
                  {workspace.managed ? 'Managed' : 'Unmanaged'}
                </Tag>
              </div>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={6} style={{ textAlign: 'right' }}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", flexWrap: "wrap", alignItems: 'center' }}>
            <div style={{ display: "flex", alignItems: "center", marginRight: '12px' }}>
              <Text style={{ marginRight: "8px", color: '#8b8fa3', fontSize: '14px' }}>Managed:</Text>
              <Switch
                checked={!!workspace.managed}
                onChange={onToggleManagedStatus}
                loading={isToggling}
                size="small"
              />
            </div>
            <Tooltip
              title={
                !workspace.managed
                  ? "Workspace must be managed before it can be deployed"
                  : "Deploy this workspace to another environment"
              }
            >
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                onClick={onDeploy}
                disabled={!workspace.managed}
                style={{
                  fontWeight: '500',
                  borderRadius: '4px'
                }}
              >
                Deploy
              </Button>
            </Tooltip>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default WorkspaceHeader; 