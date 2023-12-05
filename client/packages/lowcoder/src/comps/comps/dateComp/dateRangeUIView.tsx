import dayjs from "dayjs";
import type { DateCompViewProps } from "./dateComp";
import { disabledDate, getStyle } from "comps/comps/dateComp/dateCompUtil";
import { useUIView } from "../../utils/useUIView";
import { checkIsMobile } from "util/commonUtils";
import React, { useContext } from "react";
import styled from "styled-components";
import type { DateTimeStyleType } from "../../controls/styleControlConstants";
import { EditorContext } from "../../editorState";
import { DatePicker } from "antd";
import { hasIcon } from "comps/utils";
import { omit } from "lodash";

const RangePickerStyled = styled(DatePicker.RangePicker)<{ $style: DateTimeStyleType }>`
  width: 100%;
  ${(props) => props.$style && getStyle(props.$style)}
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
      {...omit(props, "onChange")}
      ref={props.viewRef as any}
      value={[props.start, props.end]}
      disabledDate={(current) => disabledDate(current, props.minDate, props.maxDate)}
      onCalendarChange={(time) => {
        props.onChange(time?.[0], time?.[1]);
      }}
      inputReadOnly={checkIsMobile(editorState?.getAppSettings().maxWidth)}
      suffixIcon={hasIcon(props.suffixIcon) && props.suffixIcon}
      placeholder={placeholders}
    />
  );
};
