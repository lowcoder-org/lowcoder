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

const DatePickerStyled = styled(DatePicker)<{ $style: DateTimeStyleType }>`
  width: 100%;
  ${(props) => props.$style && getStyle(props.$style)}
`;

export interface DataUIViewProps extends DateCompViewProps {
  value: dayjs.Dayjs | null;
  onChange: (value: dayjs.Dayjs | null) => void;
  onPanelChange: () => void;
  picker: "date" | "week" | "month" | "quarter" | "year" | undefined
}

const DateMobileUIView = React.lazy(() =>
  import("./dateMobileUIView").then((m) => ({ default: m.DateMobileUIView }))
);

export const DateUIView = (props: DataUIViewProps) => {
  const editorState = useContext(EditorContext);

  return useUIView(
    <DateMobileUIView {...props} />,
    <DatePickerStyled
      {...props}
      ref={props.viewRef as any}
      disabledDate={(current) => disabledDate(current, props.minDate, props.maxDate)}
      picker={props?.picker ?? "date"}
      inputReadOnly={checkIsMobile(editorState?.getAppSettings().maxWidth)}
    />
  );
};
