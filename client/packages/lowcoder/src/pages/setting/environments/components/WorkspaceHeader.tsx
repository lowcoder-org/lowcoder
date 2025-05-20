import React, { useState } from "react";
import {
  Typography,
  Switch,
  Button,
  Tag,
  Tooltip,
  Row,
  Col,
  Statistic,
  Avatar,
  Space,
  Divider,
  Card,
  Dropdown,
  Menu
} from "antd";
import {
  CloudUploadOutlined,
  SettingOutlined,
  TeamOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  CodeOutlined,
  CloudServerOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  StarOutlined,
  StarFilled
} from "@ant-design/icons";
import { Environment } from "../types/environment.types";
import { Workspace } from "../types/workspace.types";
import styled from "styled-components";

const { Title, Text } = Typography;

// Styled components for custom design
const HeaderWrapper = styled.div`
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  margin-bottom: 24px;
`;

const GradientBanner = styled.div<{ avatarColor: string }>`
  background: linear-gradient(135deg, ${props => props.avatarColor} 0%, #feb47b 100%);
  height: 140px;
  position: relative;
  overflow: hidden;
  transition: background 1s ease-in-out;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: repeating-linear-gradient(
      45deg,
      rgba(255,255,255,0.1),
      rgba(255,255,255,0.1) 1px,
      transparent 1px,
      transparent 10px
    );
    animation: moveBackground 30s linear infinite;
  }

  @keyframes moveBackground {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(100px, 100px);
    }
  }

  &:hover {
    background: linear-gradient(135deg, #feb47b 0%, ${props => props.avatarColor} 100%);
    transition: background 1s ease-in-out;
  }
`;

const ContentContainer = styled.div`
  background-color: white;
  padding: 24px;
  position: relative;
  transition: transform 0.3s ease-in-out;

  &:hover {
    transform: translateY(-5px);
  }
`;

const AvatarContainer = styled.div`
  position: absolute;
  top: -50px;
  left: 24px;
  background: white;
  padding: 4px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const StatusBadge = styled(Tag)<{ $active?: boolean }>`
  position: absolute;
  top: 12px;
  right: 12px;
  font-weight: 600;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  background: ${props => props.$active ? 'linear-gradient(135deg, #52c41a, #389e0d)' : '#f0f0f0'};
  color: ${props => props.$active ? 'white' : '#666'};
`;

const StatCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
`;

const ActionButton = styled(Button)`
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 38px;
`;

const FavoriteButton = styled(Button)`
  position: absolute;
  top: 12px;
  right: 80px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

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
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Format date for last updated
  const formatDate = (date:  number | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  

  

  return (
    <HeaderWrapper>
      <GradientBanner avatarColor={getAvatarColor(workspace.name)}>
        <StatusBadge $active={workspace.managed}>
          {workspace.managed ? "Managed" : "Unmanaged"}
        </StatusBadge>
       
      </GradientBanner>
      
      <ContentContainer>
        <AvatarContainer>
          <Avatar 
            size={80} 
            style={{ backgroundColor: getAvatarColor(workspace.name) }}
          >
            {workspace.name.charAt(0).toUpperCase()}
          </Avatar>
        </AvatarContainer>
        
        <Row>
          <Col xs={24} md={14} style={{ paddingLeft: '90px', marginBottom: '20px' }}>
            <Title level={3} style={{ margin: "0 0 8px 0" }}>
              {workspace.name}
            </Title>
            <Space size={16} wrap>
              <Text type="secondary">ID: {workspace.id}</Text>
              <Text type="secondary">
                <ClockCircleOutlined style={{ marginRight: 4 }} /> 
                created on {formatDate(workspace.creationDate)}
              </Text>
              <Tag color="blue">
                <CloudServerOutlined /> {environment.environmentName}
              </Tag>
            </Space>
          </Col>
          
          <Col xs={24} md={10}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Text style={{ marginRight: "8px" }}>Managed:</Text>
                <Switch
                  checked={!!workspace.managed}
                  onChange={onToggleManagedStatus}
                  loading={isToggling}
                  style={{ marginRight: 16 }}
                />
              </div>
              <Tooltip
                title={
                  !workspace.managed
                    ? "Workspace must be managed before it can be deployed"
                    : "Deploy this workspace to another environment"
                }
              >
                <ActionButton
                  type="primary"
                  icon={<CloudUploadOutlined />}
                  onClick={onDeploy}
                  disabled={!workspace.managed}
                >
                  Deploy
                </ActionButton>
              </Tooltip>
            </div>
          </Col>
        </Row>

        
        
      </ContentContainer>
    </HeaderWrapper>
  );
};

export default WorkspaceHeader; 