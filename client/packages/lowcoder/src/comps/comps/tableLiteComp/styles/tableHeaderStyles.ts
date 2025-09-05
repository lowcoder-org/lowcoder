import { css } from "styled-components";
import { darkenColor } from "lowcoder-design";
import { TableHeaderStyleType } from "comps/controls/styleControlConstants";
import { defaultTheme } from "@lowcoder-ee/constants/themeConstants";

export const getTableHeaderStyles = (
  headerStyle: TableHeaderStyleType,
  visibleResizables: boolean
) => css`
  .ant-table {
    > .ant-table-container {
      table {
        > .ant-table-thead {
          > tr {
            background: ${headerStyle.headerBackground}; 
          }
          > tr > th {
            background: transparent;
            border-color: ${headerStyle.border};
            border-width: ${headerStyle.borderWidth};
            color: ${headerStyle.headerText};
            
            /* Proper styling for fixed header cells */
            &.ant-table-cell-fix-left, &.ant-table-cell-fix-right {
              z-index: 1; 
              background: ${headerStyle.headerBackground};
            }
            
            > div {
              margin: ${headerStyle.margin};

              &, .ant-table-column-title > div {
                font-size: ${headerStyle.textSize};
                font-weight: ${headerStyle.textWeight};
                font-family: ${headerStyle.fontFamily};
                font-style: ${headerStyle.fontStyle};
                color: ${headerStyle.headerText};
              }
            }

            &:last-child {
              border-inline-end: none !important;
            }
            
            &.ant-table-column-has-sorters:hover {
              background-color: ${darkenColor(headerStyle.headerBackground, 0.05)};
            }
  
            > .ant-table-column-sorters > .ant-table-column-sorter {
              color: ${headerStyle.headerText === defaultTheme.textDark ? "#bfbfbf" : headerStyle.headerText};
            }

            &::before {
              background-color: ${headerStyle.border};
              width: ${visibleResizables ? "1px" : "0px"} !important;
            }
          }
        }

        > thead > tr > th,
        > tbody > tr > td {
          border-color: ${headerStyle.border};
        }

        thead > tr:first-child {
          th:last-child {
            border-right: unset;
          }
        }

        > thead > tr:first-child {
          th:first-child {
            border-top-left-radius: 0px;
          }

          th:last-child {
            border-top-right-radius: 0px;
          }
        }
      }
    }
  }
`; 