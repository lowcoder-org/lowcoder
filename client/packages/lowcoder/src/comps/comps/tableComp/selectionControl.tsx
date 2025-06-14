import { TableRowSelection } from "antd/es/table/interface";
import { dropdownControl } from "comps/controls/dropdownControl";
import { stateComp } from "comps/generators";
import { trans } from "i18n";
import { changeChildAction, ConstructorToComp } from "lowcoder-core";
import { TableOnEventView } from "./tableTypes";
import { OB_ROW_ORI_INDEX, RecordType } from "comps/comps/tableComp/tableUtils";
import { ControlNodeCompBuilder } from "comps/generators/controlCompBuilder";

// double-click detection constants
const DOUBLE_CLICK_THRESHOLD = 300; // ms
let lastClickTime = 0;
let clickTimer: ReturnType<typeof setTimeout>;

const modeOptions = [
  {
    label: trans("selectionControl.single"),
    value: "single",
  },
  {
    label: trans("selectionControl.multiple"),
    value: "multiple",
  },
  {
    label: trans("selectionControl.close"),
    value: "close",
  },
] as const;

/**
 * Currently use index as key
 */
function getKey(record: RecordType) {
  return record[OB_ROW_ORI_INDEX];
}

export function getSelectedRowKeys(
  selection: ConstructorToComp<typeof SelectionControl>
): Array<string> {
  const mode = selection.children.mode.getView();
  switch (mode) {
    case "single":
      return [selection.children.selectedRowKey.getView()];
    case "multiple":
      return selection.children.selectedRowKeys.getView();
    default:
      return [];
  }
}

export const SelectionControl = (function () {
  const childrenMap = {
    mode: dropdownControl(modeOptions, "single"),
    selectedRowKey: stateComp<string>("0"),
    selectedRowKeys: stateComp<Array<string>>([]),
  };
  return new ControlNodeCompBuilder(childrenMap, (props, dispatch) => {
    const changeSelectedRowKey = (record: RecordType) => {
      const key = getKey(record);
      if (key !== props.selectedRowKey) {
        dispatch(changeChildAction("selectedRowKey", key, false));
      }
    };

    return (onEvent: TableOnEventView) => {
      const handleClick = (record: RecordType) => {
        return () => {
          const now = Date.now();
          clearTimeout(clickTimer);
          if (now - lastClickTime < DOUBLE_CLICK_THRESHOLD) {
            
            changeSelectedRowKey(record);
            onEvent("doubleClick");
            if (getKey(record) !== props.selectedRowKey) {
              onEvent("rowSelectChange");
            }
          } else {
            clickTimer = setTimeout(() => {
              changeSelectedRowKey(record);
              onEvent("rowClick");
              if (getKey(record) !== props.selectedRowKey) {
                onEvent("rowSelectChange");
              }
            }, DOUBLE_CLICK_THRESHOLD);
          }
          lastClickTime = now;
        };
      };

      if (props.mode === "single" || props.mode === "close") {
        return {
          rowKey: getKey,
          rowClassName: (record: RecordType, index: number, indent: number) => {
            if (props.mode === "close") {
              return "";
            }
            return getKey(record) === props.selectedRowKey ? "ant-table-row-selected" : "";
          },
          onRow: (record: RecordType, index: number | undefined) => ({
            onClick: handleClick(record),
          }),
        };
      }

      const result: TableRowSelection<any> = {
        type: "checkbox",
        selectedRowKeys: props.selectedRowKeys,
        preserveSelectedRowKeys: true,
        onChange: (selectedRowKeys) => {
          dispatch(changeChildAction("selectedRowKeys", selectedRowKeys as string[], false));
          onEvent("rowSelectChange");
        },
        onSelect: (record: RecordType) => {
          changeSelectedRowKey(record);
          onEvent("rowClick");
        },
      };
      return {
        rowKey: getKey,
        rowSelection: result,
        onRow: (record: RecordType) => ({
          onClick: handleClick(record),
        }),
      };
    };
  })
    .setPropertyViewFn((children) =>
      children.mode.propertyView({
        label: trans("selectionControl.mode"),
        radioButton: true,
      })
    )
    .build();
})();