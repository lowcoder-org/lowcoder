import { ThemeDetail } from "api/commonSettingApi";
import { ColumnComp } from "comps/comps/tableComp/column/tableColumnComp";
import { TableColumnStyleType, TableSummaryRowStyleType } from "comps/controls/styleControlConstants";
import styled from "styled-components";
import { defaultTheme } from "@lowcoder-ee/constants/themeConstants";
import Table from "antd/es/table";

const TableSummaryRow = styled(Table.Summary.Row)`
  td:last-child {
    border-right: unset !important;
  }
`;

const TableSummarCell = styled(Table.Summary.Cell)<{
  $style: TableSummaryRowStyleType;
  $defaultThemeDetail: ThemeDetail;
  // $linkStyle?: TableColumnLinkStyleType;
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
  }
`;

function TableSummaryCellView(props: {
  index: number;
  key: string;
  children: any;
  rowStyle: TableSummaryRowStyleType;
  columnStyle: TableColumnStyleType;
  tableSize?: string;
  autoHeight?: boolean;
}) {
  const {
    children,
    rowStyle,
    columnStyle,
    tableSize,
    autoHeight,
    ...restProps
  } = props;

  const style = {
    background: columnStyle.background || rowStyle.background,
    margin: columnStyle.margin || rowStyle.margin,
    text: columnStyle.text || rowStyle.text,
    border: columnStyle.border || rowStyle.border,
    borderWidth: rowStyle.borderWidth,
    borderStyle: rowStyle.borderStyle,
    radius: columnStyle.radius || rowStyle.radius,
    // borderWidth: columnStyle.borderWidth || rowStyle.borderWidth,
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
      {children}
    </TableSummarCell>
  );
}

export function TableSummary(props: {
  tableSize: string;
  columns: ColumnComp[];
  summaryRowStyle: TableSummaryRowStyleType;
}) {
  const {
    columns,
    summaryRowStyle,
    tableSize,
  } = props;
  const visibleColumns = columns.filter(col => !col.getView().hide);
  
  if (!visibleColumns.length) return <></>;

  return (
    <Table.Summary>
      <TableSummaryRow>
        {visibleColumns.map((column, index) => {
          const summaryColumn = column.children.summary.getView();
          return (
            <TableSummaryCellView
              index={index}
              key={`summary-${column.getView().dataIndex}-${index}`}
              tableSize={tableSize}
              rowStyle={summaryRowStyle}
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
                // borderWidth: summaryColumn.borderWidth,
              }}
            >
              {summaryColumn.render({}, '').getView().view({})}
            </TableSummaryCellView>
          )
        })}
      </TableSummaryRow>
    </Table.Summary>
  );
}
