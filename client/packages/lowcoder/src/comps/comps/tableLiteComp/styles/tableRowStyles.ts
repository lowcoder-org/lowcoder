import { css } from "styled-components";
import { TableRowStyleType } from "comps/controls/styleControlConstants";
import { darkenColor } from "lowcoder-design";

export const getTableRowStyles = (
  rowStyle: TableRowStyleType
) => css`
  .ant-table {
    > .ant-table-container {
      .ant-table-body {
        background: ${rowStyle.background};
      }
      
      .ant-table-tbody {
        /* Regular row (odd rows - 1st, 3rd, 5th, etc.) */
        > tr:nth-of-type(2n + 1) {
          background: ${rowStyle.background};
          
          > td.ant-table-cell {
            background: transparent;
            border-color: ${rowStyle.border};
            border-width: ${rowStyle.borderWidth};
            border-style: ${rowStyle.borderStyle};
            border-radius: ${rowStyle.radius};
          }
        }

        /* Alternate row (even rows - 2nd, 4th, 6th, etc.) */
        > tr:nth-of-type(2n) {
          background: ${rowStyle.alternateBackground};
          
          > td.ant-table-cell {
            background: transparent;
            border-color: ${rowStyle.border};
            border-width: ${rowStyle.borderWidth};
            border-style: ${rowStyle.borderStyle};
            border-radius: ${rowStyle.radius};
          }
        }

        /* Selected row states */
        > tr:nth-of-type(2n + 1).ant-table-row-selected {
          background: ${rowStyle.selectedRowBackground} !important;
          
          > td.ant-table-cell {
            background: transparent !important;
          }

          &:hover {
            background: ${darkenColor(rowStyle.selectedRowBackground, 0.05)} !important;
          }
        }

        > tr:nth-of-type(2n).ant-table-row-selected {
          background: ${rowStyle.selectedRowBackground} !important;
          
          > td.ant-table-cell {
            background: transparent !important;
          }

          &:hover {
            background: ${darkenColor(rowStyle.selectedRowBackground, 0.05)} !important;
          }
        }

        /* Hover row states for non-selected rows */
        > tr:nth-of-type(2n + 1):hover:not(.ant-table-row-selected) {
          background: ${rowStyle.hoverRowBackground} !important;
          
          > td.ant-table-cell-row-hover {
            background: transparent;
          }
        }
        
        > tr:nth-of-type(2n):hover:not(.ant-table-row-selected) {
          background: ${rowStyle.hoverRowBackground} !important;
          
          > td.ant-table-cell-row-hover {
            background: transparent;
          }
        }

        /* Fixed column support for row backgrounds */
        tr td.ant-table-cell-fix-left,
        tr td.ant-table-cell-fix-right {
          z-index: 1;
          background: inherit;
          transition: background-color 0.3s;
        }

        /* Selected row fixed columns */
        tr.ant-table-row-selected td.ant-table-cell-fix-left,
        tr.ant-table-row-selected td.ant-table-cell-fix-right {
          background-color: ${rowStyle.selectedRowBackground} !important;
        }

        /* Hover row fixed columns */
        tr:hover:not(.ant-table-row-selected) td.ant-table-cell-fix-left,
        tr:hover:not(.ant-table-row-selected) td.ant-table-cell-fix-right {
          background-color: ${rowStyle.hoverRowBackground} !important;
        }

        /* Selected and hovered row fixed columns */
        tr.ant-table-row-selected:hover td.ant-table-cell-fix-left,
        tr.ant-table-row-selected:hover td.ant-table-cell-fix-right {
          background-color: ${darkenColor(rowStyle.selectedRowBackground, 0.05)} !important;
        }
      }
      
      /* Last cell border removal */
      table tbody > tr > td:last-child {
        border-right: unset !important;
      }
    }
  }
`; 