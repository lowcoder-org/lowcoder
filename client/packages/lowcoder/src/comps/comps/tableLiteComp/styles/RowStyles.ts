import styled, { css } from "styled-components";
import { isTransparentColor } from "lowcoder-design";

export const RowStyleProvider = styled.div<{
  $rowStyle: any;
  $showHRowGridBorder: boolean;
}>`
  /* Hide the measure row to avoid the extra space */
  tr.ant-table-measure-row {
    visibility: collapse;
  }
  
  .ant-table-tbody > tr {
    background: ${(props) => props.$rowStyle.background};
  }
  
  .ant-table-tbody > tr:nth-of-type(2n):not(.ant-table-row-selected) {
    background: ${(props) => props.$rowStyle.alternateBackground} !important;
  }

  .ant-table-tbody > tr.ant-table-row-selected {
    background: ${(props) => props.$rowStyle.selectedRowBackground} !important;
  }

  ${(props) => !isTransparentColor(props.$rowStyle.hoverRowBackground) && css`
    .ant-table-tbody > tr:hover:not(.ant-table-row-selected) {
      background: ${props.$rowStyle.hoverRowBackground} !important;
    }
  `}

  /* Virtual mode row styles */
  .ant-table-tbody-virtual .ant-table-row {
    background: ${(props) => props.$rowStyle.background};

    &:nth-child(2n):not(.ant-table-row-selected) {
      background: ${(props) => props.$rowStyle.alternateBackground} !important;
    }

    &.ant-table-row-selected {
      background: ${(props) => props.$rowStyle.selectedRowBackground} !important;
    }
  }

  ${(props) => !isTransparentColor(props.$rowStyle.hoverRowBackground) && css`
    .ant-table-tbody-virtual .ant-table-row:hover:not(.ant-table-row-selected) {
      background: ${props.$rowStyle.hoverRowBackground} !important;
    }
  `}
  
  /* Horizontal grid borders */
  ${(props) => props.$showHRowGridBorder && `
    .ant-table-tbody > tr > td {
      border-bottom: ${props.$rowStyle.borderWidth} ${props.$rowStyle.borderStyle} ${props.$rowStyle.border};
    }

    .ant-table-tbody-virtual .ant-table-row > td.ant-table-cell {
      border-bottom: ${props.$rowStyle.borderWidth} ${props.$rowStyle.borderStyle} ${props.$rowStyle.border};
    }
  `}
  
  /* Custom row CSS */
  ${(props) => props.$rowStyle?.customCSS || ''}
`;
