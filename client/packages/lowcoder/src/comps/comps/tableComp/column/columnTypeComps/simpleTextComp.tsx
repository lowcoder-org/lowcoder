import { default as Input } from "antd/es/input";
import { StringOrNumberControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import { ColumnTypeCompBuilder, ColumnTypeViewFn } from "../columnTypeCompBuilder";
import { ColumnValueTooltip } from "../simpleColumnTypeComps";
import { IconControl } from "comps/controls/iconControl";
import { hasIcon } from "comps/utils";

const childrenMap = {
  text: StringOrNumberControl,
  prefixIcon: IconControl,
  suffixIcon: IconControl,
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string | number, string | number> = (
  props
) => props.text + "";

export const SimpleTextComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = props.changeValue ?? getBaseValue(props, dispatch);
      return <>{hasIcon(props.prefixIcon) && (
        <span>{props.prefixIcon}</span>
      )}
      <span>{value}</span>
      {hasIcon(props.suffixIcon) && (
        <span>{props.suffixIcon}</span>
      )} </>;
    },
    (nodeValue) => nodeValue.text.value,
    getBaseValue
  )
    .setEditViewFn((props) => (
      <Input
        defaultValue={props.value}
        autoFocus
        variant="borderless"
        onChange={(e) => {
          const value = e.target.value;
          props.onChange(value);
        }}
        onBlur={props.onChangeEnd}
        onPressEnter={props.onChangeEnd}
      />
    ))
    .setPropertyViewFn((children) => {
      return (
        <>
          {children.text.propertyView({
            label: trans("table.columnValue"),
            tooltip: ColumnValueTooltip,
          })}
          {children.prefixIcon.propertyView({
            label: trans("button.prefixIcon"),
          })}
          {children.suffixIcon.propertyView({
            label: trans("button.suffixIcon"),
          })}
        </>
      );
    })
    .build();
})();
