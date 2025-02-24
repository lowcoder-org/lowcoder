import {
  ColumnCompType,
  newCustomColumn,
  RawColumnType,
} from "comps/comps/tableComp/column/tableColumnComp";
import { hiddenPropertyView, loadingPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { changeValueAction, deferAction, MultiBaseComp, wrapChildAction } from "lowcoder-core";
import {
  BluePlusIcon,
  CheckBox,
  CloseEyeIcon,
  controlItem,
  CustomModal,
  Dropdown,
  labelCss,
  LinkButton,
  OpenEyeIcon,
  Option,
  OptionItem,
  RedButton,
  RefreshIcon,
  Section,
  sectionNames,
  TextLabel,
  ToolTipLabel,
} from "lowcoder-design";
import { tableDataDivClassName } from "pages/tutorials/tutorialsConstant";
import styled, { css } from "styled-components";
import { getSelectedRowKeys } from "./selectionControl";
import { TableChildrenType } from "./tableTypes";
import React, { useMemo, useState } from "react";
import { GreyTextColor } from "constants/style";
import { alignOptions } from "comps/controls/dropdownControl";
import { ColumnTypeCompMap } from "comps/comps/tableComp/column/columnTypeComp";
import Segmented from "antd/es/segmented";

const InsertDiv = styled.div`
  display: flex;
  justify-content: end;
  width: 100%;
  gap: 8px;
  align-items: center;
`;
const Graylabel = styled.span`
  ${labelCss};
  color: #8b8fa3;
`;

const StyledRefreshIcon = styled(RefreshIcon)`
  width: 16px;
  height: 16px;
  cursor: pointer;

  &:hover {
    g g {
      stroke: #4965f2;
    }
  }
`;

const eyeIconCss = css`
  height: 16px;
  width: 16px;
  display: inline-block;

  &:hover {
    cursor: pointer;
  }

  &:hover path {
    fill: #315efb;
  }
`;

const CloseEye = styled(CloseEyeIcon)`
  ${eyeIconCss}
`;
const OpenEye = styled(OpenEyeIcon)`
  ${eyeIconCss}
`;

const ColumnDropdown = styled(Dropdown)`
  width: 100px;

  &,
  > div {
    height: 22px;
  }

  .ant-segmented-item-label {
    height: 18px;
    min-height: 18px;
    line-height: 18px;
    padding: 0;
  }
`;

const ColumnBatchOptionWrapper = styled.div`
  display: flex;
  align-items: center;
  color: ${GreyTextColor}
  line-height: 16px;
  font-size: 13px;
`;

type ViewOptionType = "normal" | "summary";

const summaryRowOptions = [
  {
    label: "Row 1",
    value: 0,
  },
  {
    label: "Row 2",
    value: 1,
  },
  {
    label: "Row 3",
    value: 2,
  },
];

const columnViewOptions = [
  {
    label: "Normal",
    value: "normal",
  },
  {
    label: "Summary",
    value: "summary",
  },
];

const columnFilterOptions = [
  { label: trans("table.allColumn"), value: "all" },
  { label: trans("table.visibleColumn"), value: "visible" },
];
type ColumnFilterOptionValueType = typeof columnFilterOptions[number]["value"];

const columnBatchOptions = [
  {
    label: trans("prop.hide"),
    value: "hide",
  },
  {
    label: trans("table.editable"),
    value: "editable",
  },
  {
    label: trans("table.autoWidth"),
    value: "autoWidth",
  },
  {
    label: trans("table.sortable"),
    value: "sortable",
  },
  {
    label: trans("table.align"),
    value: "align",
  },
] as const;

type ColumnBatchOptionValueType = typeof columnBatchOptions[number]["value"];

function HideIcon(props: { hide: boolean; setHide: (hide: boolean) => void }) {
  const { hide, setHide } = props;
  const Eye = hide ? CloseEye : OpenEye;
  return (
    <Eye
      onClick={(e: any) => {
        setHide(!hide);
      }}
    />
  );
}

function columnBatchCheckBox<T extends keyof ColumnCompType["children"]>(
  childrenKey: T,
  convertValueFunc?: (checked: boolean) => RawColumnType[T]
) {
  const isChecked = (column: ColumnCompType) => {
    if (childrenKey === "autoWidth") {
      return column.children.autoWidth.getView() === "auto";
    } else {
      return column.children[childrenKey].getView();
    }
  };

  const convertValue = convertValueFunc ?? ((checked: boolean) => checked);

  return (column: Array<ColumnCompType> | ColumnCompType) => {
    const isBatch = Array.isArray(column);
    const columns = isBatch ? column : [column];
    const disabledStatus = columns.map((c) => {
      if (childrenKey !== "editable") {
        return false;
      }
      const columnType = c.children.render
        .getOriginalComp()
        .children.comp.children.compType.getView();
      return !ColumnTypeCompMap[columnType].canBeEditable();
    });
    let allChecked = true;
    let allNotChecked = true;
    columns.forEach((c, index) => {
      if (disabledStatus[index]) {
        if (!isBatch) {
          // The batch status is not affected by disabled
          allChecked = false;
        }
        return;
      }
      if (isChecked(c)) {
        allNotChecked = false;
      } else {
        allChecked = false;
      }
    });

    const onCheckChange = (checked: boolean) => {
      columns.forEach(
        (c, index) =>
          !disabledStatus[index] &&
          c.children[childrenKey].dispatch(
            deferAction(changeValueAction(convertValue(checked) as any, true))
          )
      );
    };

    if (childrenKey === "hide") {
      return <HideIcon hide={allChecked} setHide={(hide) => onCheckChange(hide)} />;
    }

    return (
      <CheckBox
        indeterminate={!allChecked && !allNotChecked}
        disabled={!isBatch && disabledStatus[0]}
        checked={allChecked}
        onChange={(e) => {
          onCheckChange(e.target.checked);
        }}
      />
    );
  };
}

const ColumnBatchView: Record<
  ColumnBatchOptionValueType,
  (column: ColumnCompType | Array<ColumnCompType>) => JSX.Element
> = {
  hide: columnBatchCheckBox("hide"),
  editable: columnBatchCheckBox("editable"),
  sortable: columnBatchCheckBox("sortable"),
  autoWidth: columnBatchCheckBox("autoWidth", (checked) => {
    return checked ? "auto" : "fixed";
  }),
  align: (column) => {
    const columns = Array.isArray(column) ? column : [column];
    const value = Array.isArray(column) ? undefined : column.children.align.getView();
    return (
      <ColumnDropdown
        options={alignOptions}
        value={value}
        radioButton={true}
        onChange={(value) => {
          columns.forEach((c) =>
            c.children.align.dispatch(deferAction(changeValueAction(value, true)))
          );
        }}
      />
    );
  },
};

function ColumnPropertyView<T extends MultiBaseComp<TableChildrenType>>(props: {
  comp: T;
  columnLabel: string;
}) {
  const [viewMode, setViewMode] = useState('normal');
  const [summaryRow, setSummaryRow] = useState(0);
  const { comp } = props;
  const selection = getSelectedRowKeys(comp.children.selection)[0] ?? "0";
  const [columnFilterType, setColumnFilterType] = useState<ColumnFilterOptionValueType>("all");
  const columns = comp.children.columns.getView();
  const rowExample = comp.children.dataRowExample.getView();
  const dynamicColumn = comp.children.dynamicColumn.getView();
  const data = comp.children.data.getView();
  const [columnBatchType, setColumnBatchType] = useState<ColumnBatchOptionValueType>("hide");
  const columnOptionItems = useMemo(
    () => columns.filter((c) => columnFilterType === "all" || !c.children.hide.getView()),
    [columnFilterType, columns]
  );
  const summaryRows = parseInt(comp.children.summaryRows.getView());

  const columnOptionToolbar = (
    <InsertDiv>
      <div style={{ display: "flex", alignItems: "center", marginRight: "auto" }}>
        <TextLabel label={props.columnLabel} />
        <Graylabel>{" (" + columns.length + ")"}</Graylabel>
      </div>
      {rowExample && (
        <ToolTipLabel title={trans("table.refreshButtonTooltip")}>
          <StyledRefreshIcon
            onClick={() => {
              // console.log("comp", comp);
              comp.dispatch(
                wrapChildAction(
                  "columns",
                  comp.children.columns.dataChangedAction({
                    rowExample,
                    doGeneColumn: true,
                    dynamicColumn: dynamicColumn,
                    data: data,
                  })
                )
              );
              // the function below is not working
              // comp.dispatch(comp.changeChildAction("dataRowExample", null));
            }}
          />
        </ToolTipLabel>
      )}
      <LinkButton
        icon={<BluePlusIcon />}
        text={trans("addItem")}
        onClick={() => {
          comp.children.columns.dispatch(comp.children.columns.pushAction(newCustomColumn()));
        }}
      />
    </InsertDiv>
  );

  return (
    <>
      <Option
        headerItem={
          <OptionItem
            title={
              <Dropdown
                border={true}
                style={{ width: "auto", marginLeft: "8px" }}
                value={columnFilterType}
                options={columnFilterOptions}
                label=""
                onChange={(value) => {
                  setColumnFilterType(value);
                }}
              />
            }
            config={{ dataIndex: "header" }}
            draggable={false}
            optionExtra={
              <ColumnBatchOptionWrapper>
                <Dropdown
                  border={true}
                  style={{ width: "auto" }}
                  value={columnBatchType}
                  options={columnBatchOptions}
                  label=""
                  onChange={(value) => {
                    setColumnBatchType(value);
                  }}
                />
                {ColumnBatchView[columnBatchType](columns)}
              </ColumnBatchOptionWrapper>
            }
          />
        }
        itemExtra={(column) => {
          return (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: "100%",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {ColumnBatchView[columnBatchType](column)}
            </div>
          );
        }}
        items={columnOptionItems}
        optionToolbar={columnOptionToolbar}
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
            <Segmented
              block
              options={columnViewOptions}
              value={viewMode}
              onChange={(k) => setViewMode(k as ViewOptionType)}
            />
            {viewMode === 'summary' && (
              <Segmented
                block
                options={summaryRowOptions.slice(0, summaryRows)}
                value={summaryRow}
                onChange={(k) => setSummaryRow(k)}
              />
            )}
            {column.propertyView(selection, viewMode, summaryRow)}
            {column.getView().isCustom && (
              <RedButton
                onClick={() => {
                  CustomModal.confirm({
                    title: trans("table.deleteColumn"),
                    content: trans("table.confirmDeleteColumn") + `${column.getView().title}?`,
                    onConfirm: () =>
                      comp.children.columns.dispatch(comp.children.columns.deleteAction(index)),
                    confirmBtnType: "delete",
                    okText: trans("delete"),
                  });
                }}
              >
                {trans("delete")}
              </RedButton>
            )}
          </>
        )}
        onAdd={() => {
          comp.children.columns.dispatch(comp.children.columns.pushAction(newCustomColumn()));
        }}
        onMove={(fromIndex, toIndex) => {
          const action = comp.children.columns.arrayMoveAction(fromIndex, toIndex);
          comp.children.columns.dispatch(action);
        }}
        dataIndex={(column) => column.getView().dataIndex}
        scrollable={true}
      />
    </>
  );
}

function columnPropertyView<T extends MultiBaseComp<TableChildrenType>>(comp: T) {
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

export function compTablePropertyView<T extends MultiBaseComp<TableChildrenType> & { editorModeStatus: string }>(comp: T) {
  const editorModeStatus = comp.editorModeStatus;
  const dataLabel = trans("data");

  return (
    <>
      {["logic", "both"].includes(editorModeStatus) && (
        <Section name={trans("table.dataDesc")}>
          {controlItem(
            { filterText: dataLabel },
            <div className={tableDataDivClassName}>
              {comp.children.data.propertyView({
                label: dataLabel,
              })}
            </div>
          )}
        </Section>
      )}

      {["layout", "both"].includes(editorModeStatus) && (
        <Section name={trans("prop.columns")}>
          {columnPropertyView(comp)}
        </Section>
      )}

      {["logic", "both"].includes(editorModeStatus) && (
        <>
          <Section name={sectionNames.interaction}>
            {comp.children.onEvent.getPropertyView()}
            {hiddenPropertyView(comp.children)}
            {loadingPropertyView(comp.children)}
            {comp.children.selection.getPropertyView()}
            {comp.children.editModeClicks.propertyView({
              label: trans("table.editMode"),
              radioButton: true,
            })}
            {comp.children.searchText.propertyView({
              label: trans("table.searchText"),
              tooltip: trans("table.searchTextTooltip"),
              placeholder: "{{input1.value}}",
            })}
          </Section>

          <Section name={"Summary"}>
            {comp.children.showSummary.propertyView({
              label: trans("table.showSummary")
            })}
            {comp.children.showSummary.getView() &&
              comp.children.summaryRows.propertyView({
              label: trans("table.totalSummaryRows"),
              radioButton: true,
            })}
          </Section>

          <Section name={"Insert Rows"}>
            {comp.children.inlineAddNewRow.propertyView({
              label: trans("table.inlineAddNewRow")
            })}
          </Section>

          <Section name={trans("prop.toolbar")}>
            {comp.children.toolbar.getPropertyView()}
          </Section>
        </>
      )}

      {["layout", "both"].includes(editorModeStatus) && (
        <>
          <Section name={sectionNames.layout}>
            {comp.children.size.propertyView({
              label: trans("table.tableSize"),
              radioButton: true,
            })}
            {comp.children.autoHeight.getPropertyView()}
            {comp.children.showHorizontalScrollbar.propertyView({
              label: trans("prop.showHorizontalScrollbar"),
            })}
            {!comp.children.autoHeight.getView() && comp.children.showVerticalScrollbar.propertyView({
              label: trans("prop.showVerticalScrollbar"),
            })}
            {comp.children.fixedHeader.propertyView({
              label: trans("table.fixedHeader"),
              tooltip: trans("table.fixedHeaderTooltip")
            })}
            {comp.children.hideHeader.propertyView({
              label: trans("table.hideHeader"),
            })}
            {comp.children.hideToolbar.propertyView({
              label: trans("table.hideToolbar"),
            })}
            {comp.children.viewModeResizable.propertyView({
              label: trans("table.viewModeResizable"),
              tooltip: trans("table.viewModeResizableTooltip"),
            })}
            {comp.children.visibleResizables.propertyView({
              label: trans("table.visibleResizables"),
              tooltip: trans("table.visibleResizablesTooltip"),
            })}
          </Section>
          <Section name={trans("prop.pagination")}>
            {comp.children.pagination.getPropertyView()}
          </Section>
        </>
      )}

      {["logic", "both"].includes(editorModeStatus) && (
        <>
          <Section name={sectionNames.advanced}>
            {comp.children.expansion.getPropertyView()}
            {comp.children.dynamicColumn.propertyView({ label: trans("table.dynamicColumn") })}
            {comp.children.dynamicColumn.getView() &&
              comp.children.dynamicColumnConfig.propertyView({
                label: trans("table.dynamicColumnConfig"),
                tooltip: trans("table.dynamicColumnConfigDesc"),
            })}
          </Section>
        </>
      )}

      {["layout", "both"].includes(editorModeStatus) && (
        <><Section name={"Table Style"}>
            {comp.children.style.getPropertyView()} 
          </Section>
          <Section name={"Header Style"}>
            {comp.children.headerStyle.getPropertyView()}
          </Section>
          <Section name={"Toolbar Style"}>
            {comp.children.toolbarStyle.getPropertyView()}
          </Section>
          <Section name={"Row Style"}>
            {comp.children.showRowGridBorder.propertyView({
              label: trans("table.showVerticalRowGridBorder"),
            })}
            {comp.children.showHRowGridBorder.propertyView({
              label: trans("table.showHorizontalRowGridBorder"),
            })}
            {comp.children.rowStyle.getPropertyView()}
            {comp.children.rowAutoHeight.getPropertyView()}
            {comp.children.rowHeight.getPropertyView()}
            {comp.children.rowColor.getPropertyView()}
          </Section>
          <Section name={"Column Style"}>
            {comp.children.columnsStyle.getPropertyView()}
          </Section>
          <Section name={"Summary Row Style"}>
            {comp.children.summaryRowStyle.getPropertyView()}
          </Section>
        </>
      )}
    </>
  );
}
