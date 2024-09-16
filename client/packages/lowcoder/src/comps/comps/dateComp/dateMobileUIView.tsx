import styled from "styled-components";
import { DateTimeStyleType } from "comps/controls/styleControlConstants";
import { getMobileStyle } from "comps/comps/dateComp/dateCompUtil";
import dayjs from "dayjs";
import { DATE_FORMAT, DATE_TIME_FORMAT, DateParser } from "util/dateTimeUtils";
import { CanvasContainerID } from "constants/domLocators";
import { trans } from "i18n";
import React from "react";
import { DataUIViewProps } from "comps/comps/dateComp/dateUIView";
import { default as SwapRightOutlined } from "@ant-design/icons/SwapRightOutlined"
import { DateRangeUIViewProps } from "comps/comps/dateComp/dateRangeUIView";
import { DateCompViewProps } from "comps/comps/dateComp/dateComp";
import type { DatePickerProps } from "antd/es/date-picker";
import type { Dayjs } from "dayjs";

interface DateMobileUIViewProps extends Omit<DataUIViewProps, 'onChange'> {
  onChange: (value: dayjs.Dayjs | null) => void;
}

const handleClick = async (
  params: Pick<
    DateCompViewProps,
    "showTime" | "minDate" | "maxDate" | "disabledTime" | "onFocus" | "onBlur"
  > & {
    value?: dayjs.Dayjs | null;
    // onChange: (value: dayjs.Dayjs | null) => void;
    onChange: DatePickerProps<Dayjs>['onChange'];
  }
) => {
  const MobileDatePicker = (await import("antd-mobile/es/components/date-picker")).default;

  const min = dayjs(params.minDate, DateParser);
  const max = dayjs(params.maxDate, DateParser);

  const { disabledHours, disabledMinutes, disabledSeconds } = params.disabledTime();

  MobileDatePicker.prompt({
    getContainer: () => document.querySelector(`#${CanvasContainerID}`) || document.body,
    mouseWheel: true,
    cancelText: trans("cancel"),
    confirmText: trans("ok"),
    destroyOnClose: true,
    closeOnMaskClick: true,
    min: min.isValid() ? min.toDate() : undefined,
    max: max.isValid() ? max.toDate() : undefined,
    precision: params.showTime ? "second" : "day",
    defaultValue: params.value ? params.value.toDate() : undefined,
    filter: {
      hour: (val) => !disabledHours().includes(val),
      minute: (val, { date }) => !disabledMinutes(date.getHours()).includes(val),
      second: (val, { date }) => !disabledSeconds(date.getHours(), date.getMinutes()).includes(val),
    },
    onConfirm: (value) => {
      const time = dayjs(value);
      const timeString = time.format(params.showTime ? DATE_TIME_FORMAT : DATE_FORMAT);
      params.onChange?.(time, timeString);
    },
    onClose: params.onBlur,
  });

  params.onFocus();
};

const MobileView = styled.div<{
  $style: DateTimeStyleType;
}>`
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background-color: #ffffff;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #d7d9e0;
  ${(props) => props.$style && getMobileStyle(props.$style)}
`;

const DateItem = styled.div`
  overflow: hidden;
  white-space: nowrap;
  flex-grow: 1;
  display: flex;
  justify-content: center;
`;

export const DateMobileUIView = (props: DataUIViewProps) => (
  <MobileView ref={props.viewRef} $style={props.$style} onClick={() => handleClick(props)}>
    <DateItem>
      {props.value
        ? props.value.format(props.format || (props.showTime ? DATE_TIME_FORMAT : DATE_FORMAT))
        : trans("date.placeholder")}
    </DateItem>
    {props.suffixIcon}
  </MobileView>
);

export const DateRangeMobileUIView = (props: DateRangeUIViewProps) => (
  <MobileView ref={props.viewRef} $style={props.$style}>
    <DateItem
      onClick={() =>
        handleClick({
          ...props,
          value: props.start,
          onChange: (value) => props.onChange(value, props.end),
        })
      }
    >
      {props.start
        ? props.start.format(props.format || (props.showTime ? DATE_TIME_FORMAT : DATE_FORMAT))
        : trans("date.startDate")}
    </DateItem>
    <SwapRightOutlined />
    <DateItem
      onClick={() =>
        handleClick({
          ...props,
          value: props.end,
          onChange: (value) => props.onChange(props.start, value),
        })
      }
    >
      {props.end
        ? props.end.format(props.format || (props.showTime ? DATE_TIME_FORMAT : DATE_FORMAT))
        : trans("date.endDate")}
    </DateItem>
    {props.suffixIcon}
  </MobileView>
);
