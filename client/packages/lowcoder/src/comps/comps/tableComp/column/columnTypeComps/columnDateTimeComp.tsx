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
import React, { useCallback, useEffect, useRef } from "react";

const childrenMap = {
  text: StringControl,
  format: withDefault(StringControl, DATE_TIME_FORMAT),
  inputFormat: withDefault(StringControl, DATE_TIME_FORMAT),
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string, string> = (props) => props.text;

// Memoized DateTimeEdit component
const DateTimeEdit = React.memo((props: {
  value: string;
  onChange: (value: string) => void;
  onChangeEnd: () => void;
  inputFormat: string;
}) => {
  const mountedRef = useRef(true);

  // Memoize event handlers
  const handleChange = useCallback((value: string) => {
    if (!mountedRef.current) return;
    props.onChange(value);
  }, [props.onChange]);

  const handleChangeEnd = useCallback(() => {
    if (!mountedRef.current) return;
    props.onChangeEnd();
  }, [props.onChangeEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <DateEdit
      value={props.value}
      onChange={handleChange}
      onChangeEnd={handleChangeEnd}
      showTime={true}
      inputFormat={props.inputFormat}
    />
  );
});

DateTimeEdit.displayName = 'DateTimeEdit';

export const DateTimeComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = props.changeValue ?? getBaseValue(props, dispatch);
      return formatDate(value, props.format);
    },
    (nodeValue) => formatDate(nodeValue.text.value, nodeValue.format.value),
    getBaseValue
  )
    .setEditViewFn((props) => (
      <DateTimeEdit
        value={props.value}
        onChange={props.onChange}
        onChangeEnd={props.onChangeEnd}
        inputFormat={props.otherProps?.inputFormat}
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
