import { default as Button } from "antd/es/button";
import { default as Pagination, PaginationProps } from "antd/es/pagination";
import { default as Popover } from "antd/es/popover";
import { ThemeDetail } from "api/commonSettingApi";
import { ColumnCompType } from "comps/comps/tableComp/column/tableColumnComp";
import { TableChildrenType, TableOnEventView } from "comps/comps/tableComp/tableTypes";
import { BoolControl } from "comps/controls/boolControl";
import { StringControl } from "comps/controls/codeControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { TableToolbarStyleType } from "comps/controls/styleControlConstants";
import { stateComp, withDefault } from "comps/generators";
import { genRandomKey } from "comps/utils/idGenerator";
import { ThemeContext } from "comps/utils/themeContext";
import { trans } from "i18n";
import _, { isNil } from "lodash";
import { changeChildAction, ConstructorToView, MultiBaseComp, RecordConstructorToComp, RecordConstructorToView } from "lowcoder-core";
import {
  AlignBottom,
  AlignClose,
  AlignTop,
  BluePlusIcon,
  CheckBox,
  CommonTextLabel,
  CustomSelect,
  DeleteIcon,
  DownloadIcon,
  FilterIcon,
  LinkButton,
  pageItemRender,
  RefreshIcon,
  TableColumnVisibilityIcon,
  SuspensionBox,
  TacoButton,
  TacoInput,
  ValueFromOption,
  Option,
  OptionItem,
  controlItem,
} from "lowcoder-design";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { JSONValue } from "util/jsonTypes";
import { ControlNodeCompBuilder } from "comps/generators/controlCompBuilder";
import { defaultTheme } from "@lowcoder-ee/constants/themeConstants";
import Table from "antd/es/table";
import { ColumnListComp, SummaryColumnListComp } from "./column/tableColumnListComp";
import { GreyTextColor } from "@lowcoder-ee/constants/style";
import { getSelectedRowKeys } from "./selectionControl";
import { CompNameContext, EditorContext } from "@lowcoder-ee/comps/editorState";
import { SummaryColumnComp } from "./column/tableSummaryColumnComp";

const SaveChangeButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// const getStyle = (
//   style: TableToolbarStyleType,
//   filtered: boolean,
//   theme: ThemeDetail,
//   position: TableSummaryType["position"],
//   fixedToolbar: boolean,
// ) => {
//   return css`
//     background-color: ${style.background};
//     // Implement horizontal scrollbar and vertical page number selection is not blocked
//     padding: 13px 12px;
//     position: sticky;
//     postion: -webkit-sticky;
//     left: 0px !important;
//     margin: ${style.margin} !important;
//     z-index: 999;

//     ${fixedToolbar && position === 'below' && `bottom: 0;`};
//     ${fixedToolbar && position === 'above' && `top: 0;` };

//     .toolbar-icons {
//       .refresh,
//       .download {
//         cursor: pointer;

//         * {
//           ${style.toolbarText !== defaultTheme.textDark ? `stroke: ${style.toolbarText}` : null};
//         }

//         &:hover * {
//           stroke: ${theme?.primary};
//         }
//       }

//       .filter {
//         cursor: pointer;

//         * {
//           ${filtered
//             ? `stroke: ${defaultTheme.primary}`
//             : style.toolbarText !== defaultTheme.textDark
//             ? `stroke: ${style.toolbarText}`
//             : null}
//         }

//         &:hover * {
//           stroke: ${theme?.primary};
//         }
//       }

//       .column-setting {
//         width: 20px;
//         cursor: pointer;

//         * {
//           ${style.toolbarText && style.toolbarText !== defaultTheme.textDark ? `fill: ${style.toolbarText}` : `fill: #8b8fa3`} 
//         }

//         &:hover * {
//           fill: ${theme?.primary};
//         }
//       }
//     }

//     .ant-pagination-prev,
//     .ant-pagination-next {
//       path {
//         ${style.toolbarText !== defaultTheme.textDark ? `fill: ${style.toolbarText}` : null};
//       }

//       svg:hover {
//         path {
//           fill: ${theme?.primary};
//         }
//       }
//     }

//     .ant-pagination {
//       color: ${style.toolbarText};
//     }

//     .ant-pagination-item-active {
//       border-color: ${style.border || theme?.primary};

//       a {
//         color: ${theme?.textDark};
//       }
//     }

//     .ant-pagination-item:not(.ant-pagination-item-active) a {
//       color: ${style.toolbarText};

//       &:hover {
//         color: ${theme?.primary};
//       }
//     }

//     .ant-select:not(.ant-select-disabled):hover .ant-select-selector,
//     .ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input)
//       .ant-select-selector,
//     .ant-pagination-options-quick-jumper input:hover,
//     .ant-pagination-options-quick-jumper input:focus {
//       border-color: ${style.border || theme?.primary};
//     }
//   `;
// };

// // overflow: auto;
// ${(props) => props.$style && getStyle(
//   props.$style,
//   props.$filtered,
//   props.$theme,
//   props.$position,
//   props.$fixedToolbar,
// )}
const SummaryWrapper = styled.div<{
  // $style: TableToolbarStyleType;
  // $filtered: boolean;
  // $theme: ThemeDetail;
  // $position: ToolbarRowType["position"];
  // $fixedToolbar: boolean;
}>`
`;

const SummaryWrapper2 = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: max-content;
  // height: 21px;
  width: 100%;
`;

const childrenMap = {
  showSummary: BoolControl,
  columns: SummaryColumnListComp,
};

type TableSummaryType = RecordConstructorToComp<typeof childrenMap>;
type TableSummaryView = RecordConstructorToView<typeof childrenMap>;

function ColumnPropertyView<T extends MultiBaseComp<TableSummaryType>>(props: {
  comp: T;
  columnLabel: string;
}) {
  const { comp } = props;
  const comp2 = useContext(EditorContext).getUICompByName(useContext(CompNameContext));
  // const selection = getSelectedRowKeys(comp.children.selection)[0] ?? "0";
  // const [columnFilterType, setColumnFilterType] = useState<ColumnFilterOptionValueType>("all");
  const columns: SummaryColumnListComp  = comp2?.children.comp.children.summary.children.columns;
  const columnsView = columns.getView();

  // const rowExample = comp.children.dataRowExample.getView();
  // const dynamicColumn = comp.children.dynamicColumn.getView();
  // const data = comp.children.data.getView();
  // const [columnBatchType, setColumnBatchType] = useState<ColumnBatchOptionValueType>("hide");
  // const columnOptionItems = useMemo(
  //   () => columns.filter((c) => columnFilterType === "all" || !c.children.hide.getView()),
  //   [columnFilterType, columns]
  // );

  // const columnOptionToolbar = (
  //   <InsertDiv>
  //     <div style={{ display: "flex", alignItems: "center", marginRight: "auto" }}>
  //       <TextLabel label={props.columnLabel} />
  //       <Graylabel>{" (" + columns.length + ")"}</Graylabel>
  //     </div>
  //     {rowExample && (
  //       <ToolTipLabel title={trans("table.refreshButtonTooltip")}>
  //         <StyledRefreshIcon
  //           onClick={() => {
  //             // console.log("comp", comp);
  //             comp.dispatch(
  //               wrapChildAction(
  //                 "columns",
  //                 comp.children.columns.dataChangedAction({
  //                   rowExample,
  //                   doGeneColumn: true,
  //                   dynamicColumn: dynamicColumn,
  //                   data: data,
  //                 })
  //               )
  //             );
  //             // the function below is not working
  //             // comp.dispatch(comp.changeChildAction("dataRowExample", null));
  //           }}
  //         />
  //       </ToolTipLabel>
  //     )}
  //     <LinkButton
  //       icon={<BluePlusIcon />}
  //       text={trans("addItem")}
  //       onClick={() => {
  //         comp.children.columns.dispatch(comp.children.columns.pushAction(newCustomColumn()));
  //       }}
  //     />
  //   </InsertDiv>
  // );

  return (
    <>
      <Option
        // headerItem={
        //   <OptionItem
        //     title={''}
        //     config={{ dataIndex: "header" }}
        //     draggable={false}
        //   />
        // }
        // itemExtra={(column) => {
        //   return (
        //     <div
        //       style={{
        //         display: "flex",
        //         alignItems: "center",
        //         height: "100%",
        //       }}
        //       onClick={(e) => e.stopPropagation()}
        //     >
        //       {ColumnBatchView[columnBatchType](column)}
        //     </div>
        //   );
        // }}
        items={columnsView}
        itemExtra={() => <></>}
        optionToolbar={<></>}
        itemTitle={(column) => {
          const columnView = column.getView();
          if (columnView.hide) {
            return <span style={{ color: GreyTextColor }}>{columnView.title}</span>;
          }
          return columnView.title;
        }}
        popoverTitle={(column) => {
          const columnView = column.getView();
          return columnView.isCustom ? trans("table.customColumn") : columnView.dataIndex;
        }}
        content={(column, index) => (
          <>
            {column.propertyView('')}
          </>
        )}
        onAdd={() => {
          // comp.children.columns.dispatch(comp.children.columns.pushAction(newCustomColumn()));
        }}
        onMove={(fromIndex, toIndex) => {
          // const action = comp.children.columns.arrayMoveAction(fromIndex, toIndex);
          // comp.children.columns.dispatch(action);
        }}
        dataIndex={(column) => column.getView().dataIndex}
        scrollable={true}
      />
    </>
  );
}

export function summaryPropertyView<T extends MultiBaseComp<TableSummaryType>>(comp: T) {
  const columnLabel = trans("table.columnNum");
  // const dynamicColumn = comp.children.dynamicColumn.getView();
  return [
    controlItem(
      { filterText: columnLabel },
      <ColumnPropertyView comp={comp} columnLabel={columnLabel} />
    ),
    /* comp.children.dynamicColumn.propertyView({ label: trans("table.dynamicColumn") }),
    dynamicColumn &&
      comp.children.dynamicColumnConfig.propertyView({
        label: trans("table.dynamicColumnConfig"),
        tooltip: trans("table.dynamicColumnConfigDesc"),
      }), */
  ];
}

export const TableSummaryComp = (function () {
  return new ControlNodeCompBuilder(childrenMap, (props) => {
    return props;
  })
  .setPropertyViewFn((children) => [
    children.showSummary.propertyView({ label: "Show Summary Row" }),
    // summaryPropertyView(),
  ])
  .build();
    // .setPropertyViewFn((children) => [
    //   children.showSummary.propertyView({ label: "Show summary row" }),
    //   children.showSummary.getView()
    // ])
})();


export function TableSummary(props: TableSummaryView) {
  const {
    showSummary,
    columns,
  } = props;
  // const [filterVisible, setFilterVisible] = useState(false);
  // const [settingVisible, setSettingVisible] = useState(false);
  // const visibleColumns = columns.filter((c) => !c.children.hide.getView());
  // const columnKeyNameTuple = useMemo(() => {
  //   return visibleColumns.map((column) => {
  //     const c = column.getView();
  //     return [c.dataIndex, c.title || c.dataIndex] as [string, string];
  //   });
  // }, [columns]);
  const theme = useContext(ThemeContext)?.theme;
  const visibleColumns = columns.filter(col => !col.getView().hide);
  
  if (!visibleColumns.length) return <></>;

  return (
    // <SummaryWrapper
    //   $style={props.$style}
    //   $theme={theme || defaultTheme}
    //   $filtered={toolbar.filter.filters.length > 0}
    //   $position={toolbar.position}
    //   $fixedToolbar={toolbar.fixedToolbar}
    // >
    //   <SummaryWrapper2>
        <Table.Summary>
          <Table.Summary.Row>
            {visibleColumns.map((column, index) => (
              <Table.Summary.Cell
                index={index}
                key={`summary-${column.getView().dataIndex}-${index}`}
              >
                {column.getView().render({}, '').getView().view({})}
                {/* {column.getView().value} */}
              </Table.Summary.Cell>
            ))}
          </Table.Summary.Row>
        </Table.Summary>
    //   </SummaryWrapper2>
    // </SummaryWrapper>
  );
}
