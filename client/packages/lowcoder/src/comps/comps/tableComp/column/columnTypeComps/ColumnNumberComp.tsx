  import { Input } from "antd";
import { NumberControl, StringControl } from "comps/controls/codeControl";
import { BoolControl } from "comps/controls/boolControl";
import { trans } from "i18n";
import { ColumnTypeCompBuilder, ColumnTypeViewFn } from "../columnTypeCompBuilder";
import { ColumnValueTooltip } from "../simpleColumnTypeComps";

const childrenMap = {
  text: NumberControl,
  float: BoolControl,
  prefix: StringControl,
  suffix: StringControl,
};

let float = false;
const getBaseValue: ColumnTypeViewFn<typeof childrenMap, number, number> = (
  props
) => {
  return props.text
};

export const ColumnNumberComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      float = props.float;
      const value = !float ? Math.floor(props.changeValue ?? getBaseValue(props, dispatch)) : props.changeValue ?? getBaseValue(props, dispatch);
      return props.prefix + value + props.suffix;
    },
    (nodeValue) => nodeValue.text.value,
    getBaseValue,
  )
    .setEditViewFn((props) => {
      return (
      <Input
        type="number"
        step={float?"0.01": "1"}
        defaultValue={props.value}
        autoFocus
        bordered={false}
        onChange={(e) => {
          props.onChange(!float ? Math.floor(e.target.valueAsNumber) : e.target.valueAsNumber);
        }}
        onBlur={props.onChangeEnd}
        onPressEnter={props.onChangeEnd}
      />
    )})
    .setPropertyViewFn((children) => {
      return (
        <>
          {children.text.propertyView({
            label: trans("table.columnValue"),
            tooltip: ColumnValueTooltip,
          })}
          {children.prefix.propertyView({
            label: trans("table.prefix"),
            // tooltip: ColumnValueTooltip,
          })}
          {children.suffix.propertyView({
            label: trans("table.suffix"),
            // tooltip: ColumnValueTooltip,
          })}
          {children.float.propertyView({
            label: trans("table.float"),
            // tooltip: ColumnValueTooltip,
          })}
        </>
      );
    })
    .build();
})();
