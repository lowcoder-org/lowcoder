import { default as DatePicker } from "antd/es/date-picker";
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
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import { CalendarCompIconSmall, PrevIcon, SuperPrevIcon } from "lowcoder-design";
import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { DateParser, DATE_FORMAT } from "util/dateTimeUtils";

dayjs.extend(utc)

const IconNext = styled(PrevIcon)`
  transform: rotate(180deg);
`;
const IconSuperNext = styled(SuperPrevIcon)`
  transform: rotate(180deg);
`;

const DatePickerStyled = styled(DatePicker)<{ $open: boolean }>`
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

const StylePanel = styled.div`
  .ant-picker-header {
    padding: 0 12px;
    .ant-picker-header-super-prev-btn,
    .ant-picker-header-prev-btn,
    .ant-picker-header-next-btn,
    .ant-picker-header-super-next-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      svg {
        max-width: 12px;
        max-height: 12px;
      }
      &:hover svg g {
        fill: #315efb;
      }
    }
  }
  .ant-picker-date-panel .ant-picker-body {
    padding: 8px 16px;
  }
  .ant-picker-ranges {
    padding: 10px 16px;
  }
  .ant-picker-now-btn {
    color: #4965f2;
    &:hover {
      color: #315efb;
    }
  }
  .ant-picker-cell {
    color: #b8b9bf;
  }
  .ant-picker-cell-in-view {
    color: rgba(0, 0, 0, 0.85);
  }
  .ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-cell-inner,
  .ant-picker-ok .ant-btn-primary {
    background: #4965f2;
    border: none;
    box-shadow: none;
    &:hover {
      background: #315efb;
      border: none;
      box-shadow: none;
    }
  }
  .ant-picker-cell:hover:not(.ant-picker-cell-in-view) .ant-picker-cell-inner,
  .ant-picker-cell:hover:not(.ant-picker-cell-selected):not(.ant-picker-cell-range-start):not(.ant-picker-cell-range-end):not(.ant-picker-cell-range-hover-start):not(.ant-picker-cell-range-hover-end)
    .ant-picker-cell-inner {
    background-color: #f2f7fc;
    color: #4965f2;
  }
  .ant-picker-year-panel,
  .ant-picker-month-panel {
    & + div .ant-picker-now {
      display: none;
    }
  }
`;

const DatePickerPopup = styled.div`
  border-radius: 8px;
  box-shadow: 0 0 10px 0 rgba(0,0,0,0.10);
  overflow: hidden;
`;

const Wrapper = styled.div`
  background: transparent !important;
`;

export function formatDate(date: string, format: string) {
  let mom = dayjs(date);
  if (isNumber(Number(date)) && !isNaN(Number(date)) && date !== "") {
    mom = dayjs(Number(date));
  }
  if (!mom.isValid()) {
    mom = dayjs.utc(date).local();
  }

  return mom.isValid() ? mom.format(format) : "";
}

const childrenMap = {
  text: StringControl,
  format: withDefault(StringControl, DATE_FORMAT),
  inputFormat: withDefault(StringControl, DATE_FORMAT),
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string, string> = (props) => props.text;

type DateEditProps = {
  value: string;
  onChange: (value: string) => void;
  onChangeEnd: () => void;
  showTime: boolean;
  inputFormat: string;
};

// Memoized DateEdit component
export const DateEdit = React.memo((props: DateEditProps) => {
  const pickerRef = useRef<any>();
  const mountedRef = useRef(true);
  const [panelOpen, setPanelOpen] = useState(true);
  
  // Initialize tempValue with proper validation
  const [tempValue, setTempValue] = useState<dayjs.Dayjs | null>(() => {
    const initialValue = dayjs(props.value, DateParser);
    return initialValue.isValid() ? initialValue : dayjs(0, DateParser);
  });

  // Memoize event handlers
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!mountedRef.current) return;
    if (e.key === "Enter" && !panelOpen) {
      props.onChangeEnd();
    }
  }, [panelOpen, props.onChangeEnd]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountedRef.current) return;
    e.stopPropagation();
    e.preventDefault();
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!mountedRef.current) return;
    setPanelOpen(open);
  }, []);

  const handleChange = useCallback((value: dayjs.Dayjs | null, dateString: string | string[]) => {
    if (!mountedRef.current) return;
    props.onChange(dateString as string);
  }, [props.onChange]);

  const handleBlur = useCallback(() => {
    if (!mountedRef.current) return;
    props.onChangeEnd();
  }, [props.onChangeEnd]);

  // Update tempValue when props.value changes
  useEffect(() => {
    if (!mountedRef.current) return;
    
    const newValue = props.value ? dayjs(props.value, DateParser) : null;
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
      <DatePickerStyled
        ref={pickerRef}
        $open={panelOpen}
        suffixIcon={<CalendarCompIconSmall />}
        prevIcon={<PrevIcon />}
        nextIcon={<IconNext />}
        superNextIcon={<IconSuperNext />}
        superPrevIcon={<SuperPrevIcon />}
        format={props.inputFormat}
        allowClear={true}
        variant="borderless"
        autoFocus
        value={tempValue}
        showTime={props.showTime}
        showNow={true}
        defaultOpen={true}
        panelRender={(panelNode) => (
          <DatePickerPopup>
            <StylePanel>{panelNode}</StylePanel>
          </DatePickerPopup>
        )}
        onOpenChange={handleOpenChange}
        onChange={(date: unknown, dateString: string | string[]) => handleChange(date as Dayjs | null, dateString)}
        onBlur={handleBlur}
      />
    </Wrapper>
  );
});

DateEdit.displayName = 'DateEdit';

export const DateComp = (function () {
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
      <DateEdit
        value={props.value}
        onChange={props.onChange}
        onChangeEnd={props.onChangeEnd}
        showTime={false}
        inputFormat={props.otherProps?.inputFormat}
      />
    ))
    .setPropertyViewFn((children) => (
      <>
        {children.text.propertyView({
          label: trans("table.columnValue"),
          tooltip: ColumnValueTooltip,
        })}
        {formatPropertyView({ children, placeholder: DATE_FORMAT })}
      </>
    ))
    .build();
})();
