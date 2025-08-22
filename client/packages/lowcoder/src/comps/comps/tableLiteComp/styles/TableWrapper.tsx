import styled from "styled-components";
import {
  TableStyleType,
  TableHeaderStyleType,
  TableRowStyleType,
  TableToolbarStyleType,
} from "comps/controls/styleControlConstants";

import { getTableBaseStyles } from "./tableBaseStyles";
import { getTableHeaderStyles } from "./tableHeaderStyles";
import { getTableRowStyles } from "./tableRowStyles";
import { getTableToolbarStyles } from "./tableToolbarStyles";

interface TableWrapperProps {
  $style: TableStyleType;
  $headerStyle: TableHeaderStyleType;
  $rowStyle: TableRowStyleType;
  $toolbarStyle: TableToolbarStyleType;
  $visibleResizables: boolean;
  $showHRowGridBorder?: boolean;
}

export const TableWrapper = styled.div<TableWrapperProps>`
  /* Base table styles */
  ${(props) => getTableBaseStyles(props.$style)}

  /* Header styles */
  ${(props) => getTableHeaderStyles(props.$headerStyle, props.$visibleResizables)}

  /* Row styles */
  ${(props) => getTableRowStyles(props.$rowStyle)}

  /* Toolbar styles */
  ${(props) => getTableToolbarStyles(props.$toolbarStyle)}

  /* Additional table specific styles */
  ${(props) => !props.$showHRowGridBorder && `
    .ant-table thead > tr > th,
    .ant-table tbody > tr > td {
      border-bottom: 0px;
    }
  `}
`; 