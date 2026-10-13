import styled from "styled-components";
import SideBar from "./SideBar";
import { adminThemeVariables } from "lowcoder-design/src/components/adminThemeVariables";

export const AdminSidebar = styled(SideBar)`
  ${adminThemeVariables};
  background: var(--admin-sidebar, #f8f3fb);
  color: var(--admin-sidebar-text, #281a30);
  font-family: var(--admin-font);
  padding: 20px 14px;
  overflow-y: auto;
  flex-shrink: 0;
  border-right: 1px solid var(--admin-line);

  .sidebar-section:not(:last-child)::after {
    content: "";
    display: block;
    width: calc(100% - 24px);
    height: 1px;
    background: var(--admin-line);
    margin: 12px auto;
  }
`;

