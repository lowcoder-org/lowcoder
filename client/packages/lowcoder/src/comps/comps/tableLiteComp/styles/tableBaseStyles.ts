import { css } from "styled-components";
import { TableStyleType } from "comps/controls/styleControlConstants";
import { PrimaryColor } from "constants/style";

export const getTableBaseStyles = (
  style: TableStyleType
) => css`
  .ant-table-wrapper {
    border-top: unset;
    border-color: inherit;
  }

  .ant-table-row-expand-icon {
    color: ${PrimaryColor};
  }

  .ant-table .ant-table-cell-with-append .ant-table-row-expand-icon {
    margin: 0;
    top: 18px;
    left: 4px;
  }

  .ant-table.ant-table-small .ant-table-cell-with-append .ant-table-row-expand-icon {
    top: 10px;
  }

  .ant-table.ant-table-middle .ant-table-cell-with-append .ant-table-row-expand-icon {
    top: 14px;
    margin-right: 5px;
  }

  .ant-table {
    background: ${style.background};
    
    .ant-table-container {
      border-left: unset;
      border-top: none !important;
      border-inline-start: none !important;

      &::after {
        box-shadow: none !important;
      }

      .ant-table-content {
        overflow: unset !important;
      }

      .ant-table-tbody .ant-table-wrapper:only-child .ant-table {
        margin: 0;
      }

      table {
        border-top: unset;

        tbody > tr > td:last-child {
          border-right: unset !important;
        }

        .ant-empty-img-simple-g {
          fill: #fff;
        }
      }

      .ant-table-expanded-row-fixed:after {
        border-right: unset !important;
      }
    }
  }
`; 