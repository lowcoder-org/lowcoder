import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import type { FC } from "react";
import styled from "styled-components";

const LoaderRoot = styled.div`
  align-items: center;
  color: #6b7280;
  display: flex;
  font-size: 14px;
  gap: 12px;
  line-height: 20px;
  min-height: 28px;
`;

const LoaderIcon = styled(LoadingOutlined)`
  color: #1677ff;
  font-size: 18px;
`;

export const AssistantMessageLoader: FC = () => (
  <LoaderRoot aria-live="polite">
    <Spin indicator={<LoaderIcon spin />} size="small" />
    <span>Working on it...</span>
  </LoaderRoot>
);
