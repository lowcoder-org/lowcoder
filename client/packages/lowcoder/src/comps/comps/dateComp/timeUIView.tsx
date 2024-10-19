import styled from "styled-components";
import { default as TimePicker } from "antd/es/time-picker";
import { DateTimeStyleType } from "../../controls/styleControlConstants";
import { getStyle } from "comps/comps/dateComp/dateCompUtil";
import { useUIView } from "../../utils/useUIView";
import { checkIsMobile } from "util/commonUtils";
import React, { useContext } from "react";
import type { TimeCompViewProps } from "./timeComp";
import { EditorContext } from "../../editorState";
import dayjs from "dayjs"
import { default as AntdSelect } from "antd/es/select";
import { timeZoneOptions } from "./timeZone";
import { omit } from "lodash";

const TimePickerStyled = styled(TimePicker)<{ $style: DateTimeStyleType }>`
  width: 100%;
  ${(props) => props.$style && getStyle(props.$style)}
`;

const TimeMobileUIView = React.lazy(() =>
  import("./timeMobileUIView").then((m) => ({ default: m.TimeMobileUIView }))
);
 
const StyledAntdSelect = styled(AntdSelect)`
  width: 300px;
  margin: 10px 0; 
  .ant-select-selector {
    font-size: 14px; 
    padding: 8px; 
  }
`;

export interface TimeUIViewProps extends TimeCompViewProps {
  value: dayjs.Dayjs | null;
  onChange: (value: dayjs.Dayjs | null) => void;
  handleTimeZoneChange: (value:any) => void;
}

export const TimeUIView = (props: TimeUIViewProps) => {
  const editorState = useContext(EditorContext);

  const placeholder = Array.isArray(props.placeholder) ? props.placeholder[0] : props.placeholder;

  return useUIView(
    <TimeMobileUIView {...props} />,
    <TimePickerStyled
      {...omit(props, "format")}
      ref={props.viewRef}
      hideDisabledOptions
      inputReadOnly={checkIsMobile(editorState?.getAppSettings().maxWidth)}
      placeholder={placeholder}
      renderExtraFooter={()=>(
      props.timeZone === "UserChoice" && (
        <StyledAntdSelect
          placeholder="Select Time Zone"
          options={timeZoneOptions.filter(option => option.value !== 'UserChoice')} // Filter out 'userChoice'
          onChange={props?.handleTimeZoneChange}
          defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}
          />
        )
      )}
    />   
  );
};
