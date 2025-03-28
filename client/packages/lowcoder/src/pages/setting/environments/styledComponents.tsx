// styledComponents.tsx - Styled components specific to the Environments module
import styled from "styled-components";
import { Tag, Switch } from "antd";

export const StyledTag = styled(Tag)`
  font-size: 12px;
  border-radius: 4px;
  padding: 2px 8px;
  margin-right: 0;
`;

export const ManageTagWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
`;

export const StyledSwitch = styled(Switch)`
  margin-right: 8px;
`;