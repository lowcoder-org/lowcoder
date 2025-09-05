import React, { useMemo } from "react";
import styled from "styled-components";
import Skeleton from "antd/es/skeleton";
import { SkeletonButtonProps } from "antd/es/skeleton/Button";
import { defaultTheme } from "@lowcoder-ee/constants/themeConstants";
import { OB_ROW_ORI_INDEX } from "../tableUtils";
import { TableColumnLinkStyleType, TableColumnStyleType, ThemeDetail } from "comps/controls/styleControlConstants";
import { RowColorViewType, RowHeightViewType } from "../tableTypes";
import { CellColorViewType } from "../column/tableColumnComp";

interface TableTdProps {
  $background: string;
  $style: TableColumnStyleType & { rowHeight?: string };
  $defaultThemeDetail: ThemeDetail;
  $linkStyle?: TableColumnLinkStyleType;
  $tableSize?: string;
  $autoHeight?: boolean;
  $customAlign?: 'left' | 'center' | 'right';
}

const TableTd = styled.td<TableTdProps>`
  .ant-table-row-expand-icon,
  .ant-table-row-indent {
    display: initial;
  }
  &.ant-table-row-expand-icon-cell {
    background: ${(props) => props.$background};
    border-color: ${(props) => props.$style.border};
  }
  background: ${(props) => props.$background} !important;
  border-color: ${(props) => props.$style.border} !important;
  border-radius: ${(props) => props.$style.radius};
  padding: 0 !important;
  text-align: ${(props) => props.$customAlign || 'left'} !important;

  > div {
    margin: ${(props) => props.$style.margin};
    color: ${(props) => props.$style.text};
    font-weight: ${(props) => props.$style.textWeight};
    font-family: ${(props) => props.$style.fontFamily};
    overflow: hidden; 
    display: flex;
    justify-content: ${(props) => props.$customAlign === 'center' ? 'center' : props.$customAlign === 'right' ? 'flex-end' : 'flex-start'};
    align-items: center;
    text-align: ${(props) => props.$customAlign || 'left'};
    box-sizing: border-box;
    ${(props) => props.$tableSize === 'small' && `
      padding: 1px 8px;
      font-size: ${props.$defaultThemeDetail.textSize == props.$style.textSize ? '14px !important' : props.$style.textSize + ' !important'};
      font-style:${props.$style.fontStyle} !important;
      min-height: ${props.$style.rowHeight || '14px'};
      line-height: 20px;
      ${!props.$autoHeight && `
        overflow-y: auto;
        max-height: ${props.$style.rowHeight || '28px'};
      `};
    `};
    ${(props) => props.$tableSize === 'middle' && `
      padding: 8px 8px;
      font-size: ${props.$defaultThemeDetail.textSize == props.$style.textSize ? '16px !important' : props.$style.textSize + ' !important'};
      font-style:${props.$style.fontStyle} !important;
      min-height: ${props.$style.rowHeight || '24px'};
      line-height: 24px;
      ${!props.$autoHeight && `
        overflow-y: auto;
        max-height: ${props.$style.rowHeight || '48px'};
      `};
    `};
    ${(props) => props.$tableSize === 'large' && `
      padding: 16px 16px;
      font-size: ${props.$defaultThemeDetail.textSize == props.$style.textSize ? '18px !important' : props.$style.textSize + ' !important'};
      font-style:${props.$style.fontStyle} !important;
      min-height: ${props.$style.rowHeight || '48px'};
      ${!props.$autoHeight && `
        overflow-y: auto;
        max-height: ${props.$style.rowHeight || '96px'};
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
        color: ${(props) => props.$linkStyle?.activeText};
      }
    }
  }
`;

const TableTdLoading = styled(Skeleton.Button)<SkeletonButtonProps & { $tableSize?: string }>`
  width: 90% !important;
  display: table !important;

  .ant-skeleton-button {
    min-width: auto !important;
    display: block !important;
    ${(props) => props.$tableSize === 'small' && `
      height: 20px !important;
    `}
    ${(props) => props.$tableSize === 'middle' && `
      height: 24px !important;
    `}
    ${(props) => props.$tableSize === 'large' && `
      height: 28px !important;
    `}
  }
`;

const TableCellView = React.memo((props: {
  record: any;
  title: string;
  rowColorFn: RowColorViewType;
  rowHeightFn: RowHeightViewType;
  cellColorFn: CellColorViewType;
  rowIndex: number;
  children: any;
  columnsStyle: TableColumnStyleType;
  columnStyle: TableColumnStyleType;
  linkStyle: TableColumnLinkStyleType;
  tableSize?: string;
  autoHeight?: boolean;
  loading?: boolean;
  customAlign?: 'left' | 'center' | 'right';
}) => {
  const {
    record,
    title,
    rowIndex,
    rowColorFn,
    rowHeightFn,
    cellColorFn,
    children,
    columnsStyle,
    columnStyle,
    linkStyle,
    tableSize,
    autoHeight,
    loading,
    customAlign,
    ...restProps
  } = props;

  const style = useMemo(() => {
    if (!record) return null;
    const rowColor = rowColorFn({
      currentRow: record,
      currentIndex: rowIndex,
      currentOriginalIndex: record[OB_ROW_ORI_INDEX],
      columnTitle: title,
    });
    const rowHeight = rowHeightFn({
      currentRow: record,
      currentIndex: rowIndex,
      currentOriginalIndex: record[OB_ROW_ORI_INDEX],
      columnTitle: title,
    });
    const cellColor = cellColorFn({
      currentCell: record[title],
      currentRow: record,
    });

    return {
      background: cellColor || rowColor || columnStyle.background || columnsStyle.background,
      margin: columnStyle.margin || columnsStyle.margin,
      text: columnStyle.text || columnsStyle.text,
      border: columnStyle.border || columnsStyle.border,
      radius: columnStyle.radius || columnsStyle.radius,
      textSize: columnStyle.textSize || columnsStyle.textSize,
      textWeight: columnsStyle.textWeight || columnStyle.textWeight,
      fontFamily: columnsStyle.fontFamily || columnStyle.fontFamily,
      fontStyle: columnsStyle.fontStyle || columnStyle.fontStyle,
      rowHeight: rowHeight,
    } as TableColumnStyleType & { rowHeight?: string };
  }, [record, rowIndex, title, rowColorFn, rowHeightFn, cellColorFn, columnStyle, columnsStyle]);

  if (!record) {
    return <td {...restProps}>{children}</td> as any;
  }

  const { background } = style!;

  return (
    <TableTd
      {...restProps}
      $background={background}
      $style={style!}
      $defaultThemeDetail={defaultTheme}
      $linkStyle={linkStyle}
      $tableSize={tableSize}
      $autoHeight={autoHeight}
      $customAlign={customAlign}
    >
      {loading ? <TableTdLoading block active $tableSize={tableSize} /> : children}
    </TableTd>
  );
});

export default TableCellView; 