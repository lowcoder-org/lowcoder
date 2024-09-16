import { ThemeDetail } from "api/commonSettingApi";
import { ColumnComp } from "comps/comps/tableComp/column/tableColumnComp";
import { TableColumnLinkStyleType, TableColumnStyleType, TableSummaryRowStyleType } from "comps/controls/styleControlConstants";
import styled from "styled-components";
import { defaultTheme } from "@lowcoder-ee/constants/themeConstants";
import Table from "antd/es/table";
import { ReactNode } from "react";
import Tooltip from "antd/es/tooltip";

const TableSummaryRow = styled(Table.Summary.Row)<{
  $istoolbarPositionBelow: boolean;
}>`
  td:last-child {
    border-right: unset !important;
  }

  ${props => !props.$istoolbarPositionBelow && `
    &:last-child td {
      border-bottom: none !important;
    }
  `}
  
`;

const TableSummarCell = styled(Table.Summary.Cell)<{
  $style: TableSummaryRowStyleType;
  $defaultThemeDetail: ThemeDetail;
  $linkStyle?: TableColumnLinkStyleType;
  $tableSize?: string;
  $autoHeight?: boolean;
}>`
  background: ${(props) => props.$style.background} !important;
  border-color: ${(props) => props.$style.border} !important;
  // border-width: ${(props) => props.$style.borderWidth} !important;
  // border-style: ${(props) => props.$style.borderStyle} !important;
  border-radius: ${(props) => props.$style.radius};
  padding: 0 !important;

  > div {
    margin: ${(props) => props.$style.margin};
    color: ${(props) => props.$style.text};
    font-weight: ${(props) => props.$style.textWeight};
    font-family: ${(props) => props.$style.fontFamily};
    overflow: hidden; 
    ${(props) => props.$tableSize === 'small' && `
      padding: 1px 8px;
      font-size: ${props.$defaultThemeDetail.textSize == props.$style.textSize ? '14px !important' : props.$style.textSize + ' !important'};
      font-style:${props.$style.fontStyle} !important;
      min-height: 14px;
      line-height: 20px;
      ${!props.$autoHeight && `
        overflow-y: auto;
        max-height: 28px;
      `};
    `};
    ${(props) => props.$tableSize === 'middle' && `
      padding: 8px 8px;
      font-size: ${props.$defaultThemeDetail.textSize == props.$style.textSize ? '16px !important' : props.$style.textSize + ' !important'};
      font-style:${props.$style.fontStyle} !important;
      min-height: 24px;
      line-height: 24px;
      ${!props.$autoHeight && `
        overflow-y: auto;
        max-height: 48px;
      `};
    `};
    ${(props) => props.$tableSize === 'large' && `
      padding: 16px 16px;
      font-size: ${props.$defaultThemeDetail.textSize == props.$style.textSize ? '18px !important' : props.$style.textSize + ' !important'};
      font-style:${props.$style.fontStyle} !important;
      min-height: 48px;
      ${!props.$autoHeight && `
        overflow-y: auto;
        max-height: 96px;
      `};
    `};
    
    > .ant-badge > .ant-badge-status-text,
    > div > .markdown-body {
      color: ${(props) => props.$style.text};
    }

    > div > svg g {
      stroke: ${(props) => props.$style.text};
    }

    > a,
    > div  a {
      color: ${(props) => props.$linkStyle?.text};

      &:hover {
        color: ${(props) => props.$linkStyle?.hoverText};
      }

      &:active {
        color: ${(props) => props.$linkStyle?.activeText}};
      }
    }
  }
`;

const CellWrapper = ({
  children,
  tooltipTitle,
}: {
  children: ReactNode,
  tooltipTitle?: string,
}) => {
  if (tooltipTitle) {
    return (
      <Tooltip title={tooltipTitle} placement="topLeft">
        {children}
      </Tooltip>
    )
  }
  return (
    <>{children}</>
  )
};

function TableSummaryCellView(props: {
  index: number;
  key: string;
  children: any;
  align?: any;
  rowStyle: TableSummaryRowStyleType;
  columnStyle: TableColumnStyleType;
  linkStyle: TableColumnLinkStyleType;
  tableSize?: string;
  autoHeight?: boolean;
  cellColor: string;
  cellTooltip: string;
}) {
  const {
    children,
    rowStyle,
    columnStyle,
    tableSize,
    autoHeight,
    cellColor,
    cellTooltip,
    ...restProps
  } = props;

  const style = {
    background: cellColor || columnStyle.background || rowStyle.background,
    margin: columnStyle.margin || rowStyle.margin,
    text: columnStyle.text || rowStyle.text,
    border: columnStyle.border || rowStyle.border,
    borderWidth: rowStyle.borderWidth,
    borderStyle: rowStyle.borderStyle,
    radius: columnStyle.radius || rowStyle.radius,
    textSize: columnStyle.textSize || rowStyle.textSize,
    textWeight: rowStyle.textWeight || columnStyle.textWeight,
    fontFamily: rowStyle.fontFamily || columnStyle.fontFamily,
    fontStyle: rowStyle.fontStyle || columnStyle.fontStyle,
  }

  return (
    <TableSummarCell
      {...restProps}
      $style={style}
      $defaultThemeDetail={defaultTheme}
      $tableSize={tableSize}
      $autoHeight={autoHeight}
    >
      <CellWrapper tooltipTitle={cellTooltip}>
        <div>{children}</div>
      </CellWrapper>
    </TableSummarCell>
  );
}

export function TableSummary(props: {
  tableSize: string;
  expandableRows: boolean;
  summaryRows: number;
  columns: ColumnComp[];
  summaryRowStyle: TableSummaryRowStyleType;
  istoolbarPositionBelow: boolean;
}) {
  const {
    columns,
    summaryRows,
    summaryRowStyle,
    tableSize,
    expandableRows,
    istoolbarPositionBelow,
  } = props;
  let visibleColumns = columns.filter(col => !col.getView().hide);
  if (expandableRows) {
    visibleColumns.unshift(new ColumnComp({}));
  }
  
  if (!visibleColumns.length) return <></>;

  return (
    <Table.Summary>
      {Array.from(Array(summaryRows)).map((_, rowIndex) => (
        <TableSummaryRow key={rowIndex} $istoolbarPositionBelow={istoolbarPositionBelow}>
          {visibleColumns.map((column, index) => {
            const summaryColumn = column.children.summaryColumns.getView()[rowIndex].getView();
            return (
              <TableSummaryCellView
                index={index}
                key={`summary-${rowIndex}-${column.getView().dataIndex}-${index}`}
                tableSize={tableSize}
                rowStyle={summaryRowStyle}
                align={summaryColumn.align}
                cellColor={summaryColumn.cellColor}
                cellTooltip={summaryColumn.cellTooltip}
                columnStyle={{
                  background: summaryColumn.background,
                  margin: summaryColumn.margin,
                  text: summaryColumn.text,
                  border: summaryColumn.border,
                  radius: summaryColumn.radius,
                  textSize: summaryColumn.textSize,
                  textWeight: summaryColumn.textWeight,
                  fontStyle:summaryColumn.fontStyle,
                  fontFamily: summaryColumn.fontFamily,
                }}
                linkStyle={{
                  text: summaryColumn.linkColor,
                  hoverText: summaryColumn.linkHoverColor,
                  activeText: summaryColumn.linkActiveColor,
                }}
              >
                {summaryColumn.render({}, '').getView().view({})}
              </TableSummaryCellView>
            )
          })}
        </TableSummaryRow>
      ))}
    </Table.Summary>
  );
}
