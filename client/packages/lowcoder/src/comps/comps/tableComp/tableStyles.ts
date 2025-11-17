import styled, { css } from "styled-components";
import { isValidColor, darkenColor, isTransparentColor } from "lowcoder-design";
import { PrimaryColor } from "constants/style";
import { defaultTheme } from "@lowcoder-ee/constants/themeConstants";
import { TableStyleType, TableRowStyleType, TableHeaderStyleType, TableToolbarStyleType } from "comps/controls/styleControlConstants";
import { getVerticalMargin } from "@lowcoder-ee/util/cssUtil";

export function genLinerGradient(color: string) {
  return isValidColor(color) ? `linear-gradient(${color}, ${color})` : color;
}

export const getStyle = (
  style: TableStyleType,
  rowStyle: TableRowStyleType,
  headerStyle: TableHeaderStyleType,
  toolbarStyle: TableToolbarStyleType,
) => {
  const background = genLinerGradient(style.background);
  const selectedRowBackground = genLinerGradient(rowStyle.selectedRowBackground);
  const hoverRowBackground = isTransparentColor(rowStyle.hoverRowBackground) ? null : genLinerGradient(rowStyle.hoverRowBackground);
  const alternateBackground = genLinerGradient(rowStyle.alternateBackground);

  return css`
    .ant-table-body {
      background: ${genLinerGradient(style.background)};
    }
    .ant-table-tbody {
      > tr:nth-of-type(2n + 1) {
        background: ${genLinerGradient(rowStyle.background)};
      }

      > tr:nth-of-type(2n) {
        background: ${alternateBackground};
      }

      // selected row
      > tr:nth-of-type(2n + 1).ant-table-row-selected {
        background: ${selectedRowBackground || rowStyle.background} !important;

        // > td.ant-table-cell-row-hover,
        &:hover {
          background: ${hoverRowBackground || selectedRowBackground || rowStyle.background} !important;
        }
      }

      > tr:nth-of-type(2n).ant-table-row-selected {
        background: ${selectedRowBackground || alternateBackground} !important;

        // > td.ant-table-cell-row-hover,
        &:hover {
          background: ${hoverRowBackground || selectedRowBackground || alternateBackground} !important;
        }
      }

      // hover row
      > tr:nth-of-type(2n + 1):hover {
        background: ${hoverRowBackground || rowStyle.background} !important;
        > td.ant-table-cell-row-hover {
          background: transparent;
        }
      }
      > tr:nth-of-type(2n):hover {
        background: ${hoverRowBackground || alternateBackground} !important;
        > td.ant-table-cell-row-hover {
          background: transparent;
        }
      }

      > tr.ant-table-expanded-row {
        background: ${background};
      }
    }
  `;
};

export const BackgroundWrapper = styled.div<{
  $style: TableStyleType;
  $tableAutoHeight: boolean;
  $showHorizontalScrollbar: boolean;
  $showVerticalScrollbar: boolean;
  $fixedToolbar: boolean;
}>`
  display: flex;
  flex-direction: column;
  background: ${(props) => props.$style.background} !important;
  border-radius: ${(props) => props.$style.radius} !important;
  padding: ${(props) => props.$style.padding} !important;
  margin: ${(props) => props.$style.margin} !important;
  border-style: ${(props) => props.$style.borderStyle} !important;
  border-width: ${(props) => `${props.$style.borderWidth} !important`};
  border-color: ${(props) => `${props.$style.border} !important`};
  height: calc(100% - ${(props) => props.$style.margin && getVerticalMargin(props.$style.margin.split(' '))});
  overflow: hidden;

  > div.table-scrollbar-wrapper {
    overflow: auto;
    ${(props) => props.$fixedToolbar && `height: auto`};

    ${(props) => (props.$showHorizontalScrollbar || props.$showVerticalScrollbar) && `
      .simplebar-content-wrapper {
        overflow: auto !important;
      }
    `}

    ${(props) => !props.$showHorizontalScrollbar && `
      div.simplebar-horizontal {
        visibility: hidden !important;
      }
    `}
    ${(props) => !props.$showVerticalScrollbar && `
      div.simplebar-vertical {
        visibility: hidden !important;
      }
    `}
  }
`;

// TODO: find a way to limit the calc function for max-height only to first Margin value
export const TableWrapper = styled.div.attrs<{
  className?: string;
  "data-testid"?: string;
}>((props) => ({
  className: props.className,
  "data-testid": props["data-testid"],
}))<{
  $style: TableStyleType;
  $headerStyle: TableHeaderStyleType;
  $toolbarStyle: TableToolbarStyleType;
  $rowStyle: TableRowStyleType;
  $toolbarPosition: "above" | "below" | "close";
  $fixedHeader: boolean;
  $fixedToolbar: boolean;
  $visibleResizables: boolean;
  $showHRowGridBorder?: boolean;
  $showRowGridBorder?: boolean;
  $isVirtual?: boolean;
  $showHorizontalScrollbar?: boolean;
  $showVerticalScrollbar?: boolean;
}>`
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
    margin-right:5px;
  }

  .ant-table {
    background: ${(props) =>props.$style.background};
    .ant-table-container {
      border-left: unset;
      border-top: none !important;
      border-inline-start: none !important;

      &::after {
        box-shadow: none !important;
      }

      .ant-table-content {
        overflow: unset !important
      }

      // A table expand row contains table
      .ant-table-tbody .ant-table-wrapper:only-child .ant-table {
        margin: 0;
      }

      table {
        border-top: unset;

        > .ant-table-thead {
          ${(props) =>
            props.$fixedHeader && `
              position: sticky;
              position: -webkit-sticky;
              // top: ${props.$fixedToolbar ? '47px' : '0'};
              top: 0;
              z-index: 2;
            `
          }
          > tr {
            background: ${(props) => props.$headerStyle.headerBackground};
          }
          > tr > th {
            background: transparent;
            border-color: ${(props) => props.$headerStyle.border};
            border-width: ${(props) => props.$headerStyle.borderWidth};
            color: ${(props) => props.$headerStyle.headerText};
            ${(props) => props.$showRowGridBorder
              ? `border-inline-end: ${props.$headerStyle.borderWidth} solid ${props.$headerStyle.border} !important;`
              : `border-inline-end: none !important;`
            }

            /* Proper styling for fixed header cells */
            &.ant-table-cell-fix-left, &.ant-table-cell-fix-right {
              z-index: 1;
              background: ${(props) => props.$headerStyle.headerBackground};
            }


          }


          > tr > th {

            > div {
              margin: ${(props) => props.$headerStyle.margin};

              &, .ant-table-column-title > div {
                font-size: ${(props) => props.$headerStyle.textSize};
                font-weight: ${(props) => props.$headerStyle.textWeight};
                font-family: ${(props) => props.$headerStyle.fontFamily};
                font-style: ${(props) => props.$headerStyle.fontStyle};
                color:${(props) => props.$headerStyle.headerText}
              }
            }

            &:last-child {
              border-inline-end: none !important;
            }
            &.ant-table-column-has-sorters:hover {
              background-color: ${(props) => darkenColor(props.$headerStyle.headerBackground, 0.05)};
            }

            > .ant-table-column-sorters > .ant-table-column-sorter {
              color: ${(props) => props.$headerStyle.headerText === defaultTheme.textDark ? "#bfbfbf" : props.$headerStyle.headerText};
            }

            &::before {
              background-color: ${(props) => props.$headerStyle.border};
              width: ${(props) => (props.$visibleResizables ? "1px" : "0px")} !important;
            }
          }
        }

        > thead > tr > th,
        > tbody > tr > td {
          border-color: ${(props) => props.$headerStyle.border};
          ${(props) => !props.$showHRowGridBorder && `border-bottom: 0px;`}
        }

        td {
          padding: 0px 0px;
          // ${(props) => props.$showHRowGridBorder ? 'border-bottom: 1px solid #D7D9E0 !important;': `border-bottom: 0px;`}

          /* Proper styling for Fixed columns in the table body */
          &.ant-table-cell-fix-left, &.ant-table-cell-fix-right {
            z-index: 1;
            background: inherit;
            background-color: ${(props) => props.$style.background};
            transition: background-color 0.3s;
          }

        }

        /* Fix for selected and hovered rows */

        

        thead > tr:first-child {
          th:last-child {
            border-right: unset;
          }
        }

        tbody > tr > td:last-child {
          border-right: unset !important;
        }

        .ant-empty-img-simple-g {
          fill: #fff;
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

      .ant-table-expanded-row-fixed:after {
        border-right: unset !important;
      }
    }
  }

  // ANTD Virtual Scrollbar Styling
  .ant-table-tbody-virtual-scrollbar-vertical {
    .ant-table-tbody-virtual-scrollbar-thumb {
      display: ${(props) => (props.$isVirtual && props.$showVerticalScrollbar) ? 'block' : 'none'} !important;
      background: rgba(0, 0, 0, 0.3) !important;
      border-radius: 3px !important;
      cursor: pointer !important;

      &:hover {
        background: rgba(0, 0, 0, 0.5) !important;
      }
    }
  }

  .ant-table-tbody-virtual-scrollbar-horizontal {
    .ant-table-tbody-virtual-scrollbar-thumb {
      display: ${(props) => (props.$isVirtual && props.$showHorizontalScrollbar) ? 'block' : 'none'} !important;
      background: rgba(0, 0, 0, 0.3) !important;
      border-radius: 3px !important;
      cursor: pointer !important;

      &:hover {
        background: rgba(0, 0, 0, 0.5) !important;
      }
    }
  }

  ${(props) =>
    props.$style && getStyle(props.$style, props.$rowStyle, props.$headerStyle, props.$toolbarStyle)}
`;
