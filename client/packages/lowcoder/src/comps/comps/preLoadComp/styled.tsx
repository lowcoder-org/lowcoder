import styled from "styled-components";
import { default as Dropdown } from "antd/es/dropdown";

export const CustomDropdown = styled(Dropdown)`
  .ant-dropdown-menu-item-icon {
    width: 14px !important;
    height: 14px !important; 
    max-width: 14px !important;
  }
`;

export const AddJSLibraryButton = styled.div`
  cursor: pointer;
  margin-right: 16px;

  g g {
    stroke: #8b8fa3;
  }

  &:hover {
    g g {
      stroke: #222222;
    }
  }
`;

export const JSLibraryWrapper = styled.div`
  position: relative;
`; 