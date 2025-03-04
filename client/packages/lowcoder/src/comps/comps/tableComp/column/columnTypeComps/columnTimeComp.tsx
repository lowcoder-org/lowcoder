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
import { isNumber } from "lodash";
import dayjs from "dayjs";
import { CalendarCompIconSmall, TimeCompIconSmall } from "lowcoder-design";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import customParseFormat from "dayjs/plugin/customParseFormat";

const TimePickerStyled = styled(TimePicker)<{ $open: boolean }>`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
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

dayjs.extend(customParseFormat);

export function formatTime(time: string, format: string) {
  if (!time) return ""; 
  let timeValue;

  if (!isNaN(time as any) && time.trim() !== "") {
    timeValue = dayjs(Number(time));
  } else {
    timeValue = dayjs(time, format);
  }

  return timeValue.isValid() ? timeValue.format(format) : "";
}

const childrenMap = {
  text: StringControl,
  format: withDefault(StringControl, "HH:mm"), // Default to 24-hour format
  inputFormat: withDefault(StringControl, "HH:mm"),
};

let inputFormat = "HH:mm";

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string, string> = (
  props
) => props.text;

type TimeEditProps = {
  value: string;
  onChange: (value: string) => void;
  onChangeEnd: () => void;
  use12HourFormat?: boolean;
  format?: string;
};

export const TimeEdit = (props: TimeEditProps) => {
  console.log("props: ", props);
  const pickerRef = useRef<any>();
  const [panelOpen, setPanelOpen] = useState(true);
  let value = dayjs(props.value, inputFormat);
  if (!value.isValid()) {
    value = dayjs("00:00", inputFormat);
  }

  const [tempValue, setTempValue] = useState<dayjs.Dayjs | null>(value);

  useEffect(() => {
    const value = props.value ? dayjs(props.value, inputFormat) : null;
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
        suffixIcon={<TimeCompIconSmall />}
        format={props.use12HourFormat ? "hh:mm A" : "HH:mm"}
        allowClear={true}
        autoFocus
        value={tempValue}
        defaultOpen={true}
        popupStyle={{
          borderRadius: "8px",
          boxShadow: "0 0 10px 0 rgba(0,0,0,0.10)",
          overflow: "hidden",
        }}
        use12Hours={props.use12HourFormat}
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
      const formattedValue = formatTime(value, props.format || "HH:mm"); 
      return formattedValue || "-"; 
    },
    (nodeValue) => formatTime(nodeValue.text.value, nodeValue.format.value),
    getBaseValue
  )
    .setEditViewFn((props) => {
      return (
        <TimeEdit
          value={props.value}
          onChange={props.onChange}
          onChangeEnd={props.onChangeEnd}
          use12HourFormat={inputFormat === "hh:mm A"}
        />
      );
    })
    .setPropertyViewFn((children) => (
      <>
        {children.text.propertyView({
          label: "Time",
          tooltip: ColumnValueTooltip,
        })}
        {formatPropertyView({ children, placeholder: "HH:mm" })}
      </>
    ))
    .build();
})();
