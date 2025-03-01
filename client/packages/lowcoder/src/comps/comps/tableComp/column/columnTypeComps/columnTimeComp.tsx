import {
  ColumnTypeCompBuilder,
  ColumnTypeViewFn,
} from "comps/comps/tableComp/column/columnTypeCompBuilder";
import { ColumnValueTooltip } from "comps/comps/tableComp/column/simpleColumnTypeComps";
import { StringControl } from "comps/controls/codeControl";
import { withDefault } from "comps/generators";
import { formatPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import {
  TIME_FORMAT,
  formatTimestamp,
  timestampToHumanReadable,
} from "util/dateTimeUtils";
import { DateEdit } from "./columnDateComp";
import { IconControl } from "comps/controls/iconControl";
import { hasIcon } from "comps/utils";

const childrenMap = {
  text: StringControl,
  format: withDefault(StringControl, TIME_FORMAT),
  inputFormat: withDefault(StringControl, TIME_FORMAT),
  prefixIcon: IconControl,
  suffixIcon: IconControl,
};

let inputFormat = TIME_FORMAT;

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string, string> = (props) =>
  props.text;

export const TimeComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      inputFormat = props.inputFormat;
      const value = props.changeValue ?? getBaseValue(props, dispatch);

      // Convert value to a number if it's a valid timestamp
      const timestamp = Number(value);
      const formattedValue = !isNaN(timestamp)
        ? formatTimestamp(timestamp)
        : timestampToHumanReadable(timestamp) ?? value;

      return (
        <>
          {hasIcon(props.prefixIcon) && <span>{props.prefixIcon}</span>}
          <span>{formattedValue}</span>
          {hasIcon(props.suffixIcon) && <span>{props.suffixIcon}</span>}
        </>
      );
    },
    (nodeValue) => {
      const timestamp = Number(nodeValue.text.value);
      return !isNaN(timestamp)
        ? timestampToHumanReadable(timestamp)
        : nodeValue.text.value;
    },
    getBaseValue
  )
    .setEditViewFn((props) => (
      <DateEdit
        value={props.value}
        onChange={props.onChange}
        onChangeEnd={props.onChangeEnd}
        showTime={true} // Ensures only time is shown
        inputFormat={inputFormat}
      />
    ))
    .setPropertyViewFn((children) => (
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
        {formatPropertyView({ children, placeholder: TIME_FORMAT })}
      </>
    ))
    .build();
})();
