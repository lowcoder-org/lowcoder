import {
  ColumnTypeCompBuilder,
  ColumnTypeViewFn,
} from "comps/comps/tableComp/column/columnTypeCompBuilder";
import { ColumnValueTooltip } from "comps/comps/tableComp/column/simpleColumnTypeComps";
import { StringControl } from "comps/controls/codeControl";
import { withDefault } from "comps/generators";
import { formatPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { DATE_TIME_FORMAT } from "util/dateTimeUtils";
import { DateEdit, formatDate } from "./columnDateComp";

const childrenMap = {
  text: StringControl,
  format: withDefault(StringControl, DATE_TIME_FORMAT),
  inputFormat: withDefault(StringControl, DATE_TIME_FORMAT),
};

let inputFormat = DATE_TIME_FORMAT;

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string, string> = (props) => props.text;

export const DateTimeComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      inputFormat = props.inputFormat;
      const value = props.changeValue ?? getBaseValue(props, dispatch);
      return formatDate(value, props.format);
    },
    (nodeValue) => formatDate(nodeValue.text.value, nodeValue.format.value),
    getBaseValue
  )
    .setEditViewFn((props) => (
      <DateEdit
        value={props.value}
        onChange={props.onChange}
        onChangeEnd={props.onChangeEnd}
        showTime={true}
        inputFormat={inputFormat}
      />
    ))
    .setPropertyViewFn((children) => (
      <>
        {children.text.propertyView({
          label: trans("table.columnValue"),
          tooltip: ColumnValueTooltip,
        })}
        {formatPropertyView({ children, placeholder: DATE_TIME_FORMAT })}
      </>
    ))
    .build();
})();
