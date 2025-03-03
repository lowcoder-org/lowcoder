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
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { TIME_FORMAT } from "util/dateTimeUtils";

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

const Wrapper = styled.div`
  background: transparent !important;
`;

export function formatTime(time: string, format: string) {
  const parsedTime = dayjs(time, TIME_FORMAT);
  return parsedTime.isValid() ? parsedTime.format(format) : "";
}

const childrenMap = {
  text: StringControl,
  format: withDefault(StringControl, TIME_FORMAT),
  inputFormat: withDefault(StringControl, TIME_FORMAT),
};

let inputFormat = TIME_FORMAT;

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string, string> = (props) => props.text;

type TimeEditProps = {
  value: string;
  onChange: (value: string) => void;
  onChangeEnd: () => void;
  inputFormat: string;
};

export const TimeEdit = (props: TimeEditProps) => {
  const pickerRef = useRef<any>();
  const [panelOpen, setPanelOpen] = useState(true);
  let value = dayjs(props.value, TIME_FORMAT);
  if (!value.isValid()) {
    value = dayjs("00:00:00", TIME_FORMAT);
  }

  const [tempValue, setTempValue] = useState<dayjs.Dayjs | null>(value);

  useEffect(() => {
    const value = props.value ? dayjs(props.value, TIME_FORMAT) : null;
    setTempValue(value);
  }, [props.value]);

  return (
    <Wrapper
      onKeyDown={(e) => {
        if (e.key === "Enter" && !panelOpen) {
          props.onChangeEnd();
        }
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <TimePickerStyled
        ref={pickerRef}
        $open={panelOpen}
        format={props.inputFormat}
        allowClear={true}
        autoFocus
        value={tempValue}
        defaultOpen={true}
        onOpenChange={(open) => setPanelOpen(open)}
        onChange={(value, timeString) => {
          props.onChange(timeString as string);
        }}
        onBlur={() => props.onChangeEnd()}
      />
    </Wrapper>
  );
};

export const TimeComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      inputFormat = props.inputFormat;
      const value = props.changeValue ?? getBaseValue(props, dispatch);
      return formatTime(value, props.format);
    },
    (nodeValue) => formatTime(nodeValue.text.value, nodeValue.format.value),
    getBaseValue
  )
    .setEditViewFn((props) => (
      <TimeEdit
        value={props.value}
        onChange={props.onChange}
        onChangeEnd={props.onChangeEnd}
        inputFormat={inputFormat}
      />
    ))
    .setPropertyViewFn((children) => (
      <>
        {children.text.propertyView({
          label: trans("table.columnValue"),
          tooltip: ColumnValueTooltip,
        })}
        {formatPropertyView({ children, placeholder: TIME_FORMAT })}
      </>
    ))
    .build();
})();
