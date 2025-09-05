import { default as TimePicker } from "antd/es/time-picker";
import {
  ColumnTypeCompBuilder,
  ColumnTypeViewFn,
} from "comps/comps/tableComp/column/columnTypeCompBuilder";
import { ColumnValueTooltip } from "comps/comps/tableComp/column/simpleColumnTypeComps";
import { StringControl } from "comps/controls/codeControl";
import { withDefault } from "comps/generators";
import { formatPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import dayjs from "dayjs";
import React from "react";
import styled from "styled-components";
import { TIME_FORMAT } from "util/dateTimeUtils";
import { hasIcon } from "comps/utils";
import { IconControl } from "comps/controls/iconControl";

const TimePickerStyled = styled(TimePicker)<{ $open: boolean }>`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  padding: 0;
  padding-left: 11px;
  .ant-picker-input {
    height: 100%;
  }
  input {
    padding-right: 18px;
    cursor: pointer;
  }
  &.ant-picker-focused .ant-picker-suffix svg g {
    stroke: ${(props) => props.$open && "#315EFB"};
  }
  .ant-picker-suffix {
    height: calc(100% - 1px);
    position: absolute;
    right: 0;
    top: 0.5px;
    display: flex;
    align-items: center;
    padding: 0 3px;
  }
`;

export function formatTime(time: string, format: string) {
  const parsedTime = dayjs(time, TIME_FORMAT);
  return parsedTime.isValid() ? parsedTime.format(format) : "";
}

const childrenMap = {
  text: StringControl,
  prefixIcon: IconControl,
  suffixIcon: IconControl,
  format: withDefault(StringControl, TIME_FORMAT),
  inputFormat: withDefault(StringControl, TIME_FORMAT),
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string, string> = (props) => props.text;

export const TimeComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = getBaseValue(props, dispatch);
      return (
        <>
          {hasIcon(props.prefixIcon) && (
            <span>{props.prefixIcon}</span>
          )}
          <span>{value}</span>
          {hasIcon(props.suffixIcon) && (
            <span>{props.suffixIcon}</span>
          )}
        </>
      );
    },
    (nodeValue) => formatTime(nodeValue.text.value, nodeValue.format.value),
    getBaseValue
  )
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
