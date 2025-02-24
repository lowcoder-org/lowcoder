import LoadingOutlined from "@ant-design/icons/LoadingOutlined";
import { default as Spin } from "antd/es/spin";
import { GreyTextColor } from "constants/style";
import styled from "styled-components";

export const LoadingPlaceholder = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${GreyTextColor};
`;

export function ModuleLoading() {
  return (
    <LoadingPlaceholder>
      <Spin indicator={<LoadingOutlined style={{ fontSize: 15 }} spin />} />
    </LoadingPlaceholder>
  );
}
