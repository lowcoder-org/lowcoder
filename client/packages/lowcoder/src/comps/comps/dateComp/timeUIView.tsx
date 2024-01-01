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

const TimePickerStyled = styled(TimePicker)<{ $style: DateTimeStyleType }>`
  width: 100%;
  ${(props) => props.$style && getStyle(props.$style)}
`;

const TimeMobileUIView = React.lazy(() =>
  import("./timeMobileUIView").then((m) => ({ default: m.TimeMobileUIView }))
);

export interface TimeUIViewProps extends TimeCompViewProps {
  value: dayjs.Dayjs | null;
  onChange: (value: dayjs.Dayjs | null) => void;
}

export const TimeUIView = (props: TimeUIViewProps) => {
  const editorState = useContext(EditorContext);

  const placeholder = Array.isArray(props.placeholder) ? props.placeholder[0] : props.placeholder;

  return useUIView(
    <TimeMobileUIView {...props} />,
    <TimePickerStyled
      {...props}
      ref={props.viewRef}
      hideDisabledOptions
      inputReadOnly={checkIsMobile(editorState?.getAppSettings().maxWidth)}
      placeholder={placeholder}
    />
  );
};
