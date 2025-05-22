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
import React, { useEffect, useRef, useState, useCallback } from "react";
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

const Wrapper = styled.div`
  background: transparent !important;
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

type TimeEditProps = {
  value: string;
  onChange: (value: string) => void;
  onChangeEnd: () => void;
  inputFormat: string;
};

export const TimeEdit = React.memo((props: TimeEditProps) => {
  const pickerRef = useRef<any>();
  const [panelOpen, setPanelOpen] = useState(true);
  const mountedRef = useRef(true);

  // Initialize tempValue with proper validation
  const [tempValue, setTempValue] = useState<dayjs.Dayjs | null>(() => {
    const initialValue = dayjs(props.value, TIME_FORMAT);
    return initialValue.isValid() ? initialValue : dayjs("00:00:00", TIME_FORMAT);
  });

  // Memoize event handlers
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !panelOpen) {
      props.onChangeEnd();
    }
  }, [panelOpen, props.onChangeEnd]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (mountedRef.current) {
      setPanelOpen(open);
    }
  }, []);

  const handleChange = useCallback((value: dayjs.Dayjs | null, dateString: string | string[]) => {
    props.onChange(dateString as string);
  }, [props.onChange]);

  // Update tempValue when props.value changes
  useEffect(() => {
    if (!mountedRef.current) return;
    
    const newValue = props.value ? dayjs(props.value, TIME_FORMAT) : null;
    if (newValue?.isValid()) {
      setTempValue(newValue);
    }
  }, [props.value]);

  // Cleanup event listeners and state
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      setTempValue(null);
      if (pickerRef.current) {
        pickerRef.current = null;
      }
    };
  }, []);

  return (
    <Wrapper
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
    >
      <TimePickerStyled
        ref={pickerRef}
        $open={panelOpen}
        format={props.inputFormat}
        allowClear={true}
        autoFocus
        value={tempValue}
        defaultOpen={true}
        onOpenChange={handleOpenChange}
        onChange={handleChange}
        onBlur={props.onChangeEnd}
      />
    </Wrapper>
  );
});

TimeEdit.displayName = 'TimeEdit';

export const TimeComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = props.changeValue ?? getBaseValue(props, dispatch);
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
    .setEditViewFn(({value, onChange, onChangeEnd, otherProps}) => (
      <TimeEdit
        value={value}
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        inputFormat={otherProps?.inputFormat}
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
