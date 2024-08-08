import dayjs from "dayjs";
import type { DateCompViewProps } from "./dateComp";
import { disabledDate, getStyle } from "comps/comps/dateComp/dateCompUtil";
import { useUIView } from "../../utils/useUIView";
import { checkIsMobile } from "util/commonUtils";
import React, { useContext } from "react";
import styled from "styled-components";
import type { DateTimeStyleType } from "../../controls/styleControlConstants";
import { EditorContext } from "../../editorState";
import { default as DatePicker } from "antd/es/date-picker";
import type { DatePickerProps } from "antd/es/date-picker";
import type { Dayjs } from 'dayjs';
import { DateParser } from "@lowcoder-ee/util/dateTimeUtils";

const DatePickerStyled = styled(DatePicker<Dayjs>)<{ $style: DateTimeStyleType }>`
  width: 100%;
  box-shadow: ${props=>`${props.$style.boxShadow} ${props.$style.boxShadowColor}`};
  ${(props) => props.$style && getStyle(props.$style)}
`;

export interface DataUIViewProps extends DateCompViewProps {
  value?: dayjs.Dayjs | null;
  defaultValue?: dayjs.Dayjs | null;
  // onChange: (value: dayjs.Dayjs | null) => void;
  onChange: DatePickerProps<Dayjs>['onChange'];
  onPanelChange: () => void;
}

const DateMobileUIView = React.lazy(() =>
  import("./dateMobileUIView").then((m) => ({ default: m.DateMobileUIView }))
);

export const DateUIView = (props: DataUIViewProps) => {
  const editorState = useContext(EditorContext);

  const placeholder = Array.isArray(props.placeholder) ? props.placeholder[0] : props.placeholder;
  console.log('props', props);
  return useUIView(
    <DateMobileUIView {...props} />,
    <DatePicker
      showTime
      onChange={(value, dateString) => {
        console.log('Selected Time: ', value);
        console.log('Formatted Selected Time: ', dateString);
      }}
      // onOk={onOk}
    />
    // <DatePickerStyled
    //   {...props}
    //   multiple={false}
    //   ref={props.viewRef as any}
    //   minDate={props.minDate ? dayjs(props.minDate, DateParser) : undefined}
    //   maxDate={props.maxDate ? dayjs(props.maxDate, DateParser) : undefined}
    //   hourStep={props.hourStep as any}
    //   minuteStep={props.minuteStep as any}
    //   secondStep={props.secondStep as any}
    //   disabledDate={(current) => disabledDate(current, props.minDate, props.maxDate)}
    //   picker={"date"}
    //   inputReadOnly={checkIsMobile(editorState?.getAppSettings().maxWidth)}
    //   placeholder={placeholder}
    // />

  );
};
