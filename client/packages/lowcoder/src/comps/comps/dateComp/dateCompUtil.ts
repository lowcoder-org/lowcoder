import dayjs from "dayjs";
import { DateParser, TimeParser } from "util/dateTimeUtils";
import { range } from "lodash";
import { ChildrenMultiSelectStyleType, DateTimeStyleType } from "../../controls/styleControlConstants";
import styled, { css } from "styled-components";
import { fadeColor, isDarkColor, lightenColor } from "components/colorSelect/colorUtils";
// import { CommonPickerMethods } from "antd/es/date-picker/generatePicker/interface";
import { blurMethod, focusMethod } from "comps/utils/methodUtils";
import { refMethods } from "comps/generators/withMethodExposing";

export interface CommonPickerMethods {
  focus: (options?: FocusOptions) => void;
  blur: VoidFunction;
};

export const handleDateChange = (
  time: string,
  onChange: (value: string) => Promise<unknown>,
  onEvent: (event: string) => void
) => {
  onChange(time).then(() => onEvent("change"));
};

export const disabledDate = (current: dayjs.Dayjs, min: string, max: string) => {
  const tmpMinDate = min === '' ? undefined : min
  const tmpMaxDate = max === '' ? undefined : max
  const maxDate = dayjs(tmpMaxDate, DateParser);
  const minDate = dayjs(tmpMinDate, DateParser);

  return (
    current &&
    current.isValid() &&
    (current.isAfter(maxDate, "date") || current.isBefore(minDate, "date"))
  );
};

export const disabledTime = (min: string, max: string) => {
  const tmpMinTime = min === '' ? undefined : min
  const tmpMaxTime = max === '' ? undefined : max
  const maxTime = dayjs(tmpMaxTime, TimeParser);
  const minTime = dayjs(tmpMinTime, TimeParser);

  return {
    disabledHours: () => {
      let disabledHours: number[] = [];
      if (minTime.isValid()) {
        disabledHours = [...disabledHours, ...range(0, minTime.hour())];
      }
      if (maxTime.isValid()) {
        disabledHours = [...disabledHours, ...range(maxTime.hour() + 1, 24)];
      }
      return disabledHours;
    },
    disabledMinutes: (hour: number) => {
      if (minTime.isValid() && minTime.hour() === hour) {
        return range(0, minTime.minute());
      }
      if (maxTime.isValid() && maxTime.hour() === hour) {
        return range(maxTime.minute() + 1, 60);
      }
      return [];
    },
    disabledSeconds: (hour: number, minute: number) => {
      if (minTime.isValid() && minTime.hour() === hour && minTime.minute() === minute) {
        return range(0, minTime.second());
      }
      if (maxTime.isValid() && maxTime.hour() === hour && maxTime.minute() === minute) {
        return range(maxTime.second() + 1, 60);
      }
      return [];
    },
  };
};
export const getStyle = (style: DateTimeStyleType) => {
  return css`
    border-radius: ${style.radius};
    padding: ${style.padding};
    &:not(.ant-picker-disabled) {
      border-color: ${style.border};
      background-color: ${style.background};
      border-width: ${style.borderWidth};
      border-style: ${style.borderStyle};

      input {
        color: ${style.text};

        &::-webkit-input-placeholder {
          color: ${style.text};
          opacity: 0.25;
        }
      }

      &.ant-picker-focused,
      &:hover {
        border-color: ${style.accent};
      }

      .ant-picker-suffix,
      .ant-picker-clear,
      .ant-picker-separator {
        background-color: ${style.background};
        color: ${style.text === "#222222"
          ? "#8B8FA3"
          : isDarkColor(style.text)
          ? lightenColor(style.text, 0.2)
          : style.text};
      }

      .ant-picker-clear {
        inset-inline-end: 1px;
        font-size: 16px;
      }

      .ant-picker-clear:hover {
        color: ${style.text === "#222222"
          ? "#8B8FA3"
          : isDarkColor(style.text)
          ? lightenColor(style.text, 0.1)
          : style.text};
      }

      .ant-picker-active-bar {
        background-color: ${style.accent};
      }
    }
  `;
};

export const getMobileStyle = (style: DateTimeStyleType) =>
  css`
    color: ${style.text};
    background-color: ${style.background};
    border-radius: ${style.radius};
    border-color: ${style.border};
  `;

export const dateRefMethods = refMethods<CommonPickerMethods>([focusMethod, blurMethod]);

export const StyledPickerPanel = styled.div<{
  $style: ChildrenMultiSelectStyleType
}>`
  background: ${props => props.$style?.background};
  border: ${props => props.$style?.border};
  border-style: ${props => props.$style?.borderStyle};
  border-width: ${props => props.$style?.borderWidth};
  border-radius: ${props => props.$style?.radius};
  rotate: ${props => props.$style?.rotation};
  margin: ${props => props.$style?.margin};
  padding: ${props => props.$style?.padding};

  .ant-picker-content th, .ant-picker-content td.ant-picker-cell {
    font-size: ${props => props.$style?.textSize};
    font-style: ${props => props.$style?.fontStyle};
    font-family: ${props => props.$style?.fontFamily};
    font-weight: ${props => props.$style?.textWeight};
    text-transform: ${props => props.$style?.textTransform};
    line-height: ${props => props.$style?.lineHeight};
    color: ${props => props.$style?.text};
    
    .ant-picker-cell-inner {
      text-decoration: ${props => props.$style?.textDecoration};
    }
  }

  .ant-picker-content td.ant-picker-cell:not(.ant-picker-cell-in-view) {
    color: ${props => fadeColor(props.$style?.text, 0.5)};
  }
  
  .ant-picker-content .ant-picker-time-panel-column > li.ant-picker-time-panel-cell .ant-picker-time-panel-cell-inner {
    font-size: ${props => props.$style?.textSize};
    font-style: ${props => props.$style?.fontStyle};
    font-family: ${props => props.$style?.fontFamily};
    font-weight: ${props => props.$style?.textWeight};
    text-transform: ${props => props.$style?.textTransform};
    line-height: ${props => props.$style?.lineHeight};
    color: ${props => props.$style?.text};
    text-decoration: ${props => props.$style?.textDecoration};
  }
`
