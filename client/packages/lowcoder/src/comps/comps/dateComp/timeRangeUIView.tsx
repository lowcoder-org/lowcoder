import styled from "styled-components";
import { default as TimePicker } from "antd/es/time-picker";
import { DateTimeStyleType } from "../../controls/styleControlConstants";
import { getStyle } from "comps/comps/dateComp/dateCompUtil";
import { useUIView } from "../../utils/useUIView";
import { checkIsMobile } from "util/commonUtils";
import React, { useContext } from "react";
import type { TimeCompViewProps } from "./timeComp";
import { EditorContext } from "../../editorState";
import dayjs from "dayjs";
import { hasIcon } from "comps/utils";
import { omit } from "lodash";

const { RangePicker } = TimePicker;

const RangePickerStyled = styled((props: any) => <RangePicker {...props} />)<{ $style: DateTimeStyleType }>`
  width: 100%;
  ${(props) => props.$style && getStyle(props.$style)}
`;

const TimeRangeMobileUIView = React.lazy(() =>
  import("./timeMobileUIView").then((m) => ({ default: m.TimeRangeMobileUIView }))
);

export interface TimeRangeUIViewProps extends TimeCompViewProps {
  start: dayjs.Dayjs | null;
  end: dayjs.Dayjs | null;
  placeholder?: string | [string, string];
  onChange: (start?: dayjs.Dayjs | null, end?: dayjs.Dayjs | null) => void;
}

export const TimeRangeUIView = (props: TimeRangeUIViewProps) => {
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
    <TimeRangeMobileUIView {...props} />,
    <RangePickerStyled
      {...omit(props, "onChange")}
      value={[props.start, props.end]}
      order={true}
      hideDisabledOptions
      onCalendarChange={(time: any) => {
        props.onChange(time?.[0], time?.[1]);
      }}
      inputReadOnly={checkIsMobile(editorState?.getAppSettings().maxWidth)}
      suffixIcon={hasIcon(props.suffixIcon) && props.suffixIcon}
      placeholder={placeholders}
    />
  );
};
