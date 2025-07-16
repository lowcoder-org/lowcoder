import dayjs from "dayjs";
import type { DateCompViewProps } from "./dateComp";
import { disabledDate, getStyle, StyledPickerPanel } from "comps/comps/dateComp/dateCompUtil";
import { useUIView } from "../../utils/useUIView";
import { checkIsMobile } from "util/commonUtils";
import React, { useContext } from "react";
import styled from "styled-components";
import type { ChildrenMultiSelectStyleType, DateTimeStyleType, DisabledInputStyleType } from "../../controls/styleControlConstants";
import { EditorContext } from "../../editorState";
import { default as DatePicker } from "antd/es/date-picker";
import { hasIcon } from "comps/utils";
import { omit } from "lodash";
import { DateParser } from "@lowcoder-ee/util/dateTimeUtils";
import { default as AntdSelect } from "antd/es/select";
import { timeZoneOptions } from "./timeZone";

const { RangePicker } = DatePicker;

const RangePickerStyled = styled(RangePicker)<{$style: DateTimeStyleType; $disabledStyle?: DisabledInputStyleType}>`
  width: 100%;
  box-shadow: ${(props) =>
    `${props.$style.boxShadow} ${props.$style.boxShadowColor}`};
  ${(props) => props.$style && getStyle(props.$style)}

  &.ant-picker-disabled {
    cursor: not-allowed;
    color: ${(props) => props.$disabledStyle?.disabledText};
    background: ${(props) => props.$disabledStyle?.disabledBackground};
    border-color: ${(props) => props.$disabledStyle?.disabledBorder};

    .ant-picker-input > input {
      color: ${(props) => props.$disabledStyle?.disabledText};
      background: ${(props) => props.$disabledStyle?.disabledBackground};
    }
    .ant-picker-suffix,
    .ant-picker-clear,
    .ant-picker-separator {
      color: ${(props) => props.$disabledStyle?.disabledText};
    }
  }
`;

const StyledAntdSelect = styled(AntdSelect)`
  width: 400px; 
  margin: 10px 0px;
  .ant-select-selector {
    font-size: 14px;
    line-height: 1.5;
  }
`;
const StyledDiv = styled.div`
  text-align: center;
`;
const DateRangeMobileUIView = React.lazy(() =>
  import("./dateMobileUIView").then((m) => ({ default: m.DateRangeMobileUIView }))
);

export interface DateRangeUIViewProps extends DateCompViewProps {
  start: dayjs.Dayjs | null;
  end: dayjs.Dayjs | null;
  placeholder?: string | [string, string];
  onChange: (start?: dayjs.Dayjs | null, end?: dayjs.Dayjs | null) => void;
  onPanelChange: (value: any, mode: [string, string]) => void;
  onClickDateRangeTimeZone:(value:any)=>void;
  tabIndex?: number;
  $disabledStyle?: DisabledInputStyleType;
}

export const DateRangeUIView = (props: DateRangeUIViewProps) => {
  const editorState = useContext(EditorContext);

  // Extract or compute the placeholder values
  let placeholders: [string, string];
  if (Array.isArray(props.placeholder)) {
    placeholders = props.placeholder;
  } else {
    // Use the same placeholder for both start and end if it's a single string
    placeholders = [props.placeholder || 'Start Date', props.placeholder || 'End Date'];
  }
  return useUIView(
    <DateRangeMobileUIView {...props} />,
    <RangePickerStyled
      {...omit(props, "onChange" , "format", "inputFormat", "pickerMode", "$childrenInputFieldStyle")}
      format={props.inputFormat}
      ref={props.viewRef as any}
      picker={props.pickerMode as any}
      value={[props.start, props.end]}
      disabledDate={(current: any) => disabledDate(current, props.minDate, props.maxDate)}
      onCalendarChange={(time: any) => {
        props.onChange(time?.[0], time?.[1]);
      }}
      inputReadOnly={checkIsMobile(editorState?.getAppSettings().maxWidth)}
      suffixIcon={hasIcon(props.suffixIcon) && props.suffixIcon}
      placeholder={placeholders}
      minDate={props.minDate ? dayjs(props.minDate, DateParser) : undefined}
      maxDate={props.maxDate ? dayjs(props.maxDate, DateParser) : undefined}
      hourStep={props.hourStep as any}
      minuteStep={props.minuteStep as any}
      secondStep={props.secondStep as any}
      panelRender={(panelNode) => (
        <StyledPickerPanel
          $style={props.$childrenInputFieldStyle as ChildrenMultiSelectStyleType}
        >
          {panelNode}
        </StyledPickerPanel>
      )}
      renderExtraFooter={() => (
        props.timeZone === "UserChoice" && (
          <StyledDiv>
            <StyledAntdSelect 
              options={timeZoneOptions.filter(option => option.value !== 'UserChoice')}
              placeholder="Select Time Zone" 
              defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}
              onChange={props?.onClickDateRangeTimeZone}
              />
          </StyledDiv>
        )
      )}
      $disabledStyle={props.$disabledStyle}
    />
  );
};
