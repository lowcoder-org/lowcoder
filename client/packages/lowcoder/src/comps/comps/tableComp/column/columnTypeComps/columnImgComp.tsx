import { default as Input } from "antd/es/input";
import {
  ColumnTypeCompBuilder,
  ColumnTypeViewFn,
} from "comps/comps/tableComp/column/columnTypeCompBuilder";
import { StringControl, NumberControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import { withDefault } from "comps/generators";
import { TacoImage } from "lowcoder-design";
import Tooltip from "antd/es/tooltip";

export const ColumnValueTooltip = trans("table.columnValueTooltip");

const childrenMap = {
  src: withDefault(StringControl, "{{currentCell}}"),
  size: withDefault(NumberControl, "50"),
  tooltip: StringControl,
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string, string> = (props) => props.src;

export const ImageComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = props.changeValue ?? getBaseValue(props, dispatch);
      return (
        <Tooltip title={props.tooltip}>
          <TacoImage style={{ pointerEvents: "auto" }} src={value} width={props.size} />;
        </Tooltip>
      );
    },
    (nodeValue) => nodeValue.src.value,
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
          {children.src.propertyView({
            label: trans("table.imageSrc"),
            tooltip: ColumnValueTooltip,
          })}
          {children.tooltip.propertyView({
            label: trans("table.columnTooltip"),
            tooltip: ColumnValueTooltip,
          })}
          {children.size.propertyView({
            label: trans("table.imageSize"),
          })}
        </>
      );
    })
    .build();
})();
