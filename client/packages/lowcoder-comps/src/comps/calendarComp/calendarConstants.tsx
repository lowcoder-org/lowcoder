import { trans } from "../../i18n/comps";
import {
  backgroundToBorder,
  CalendarStyleType,
  contrastText,
  contrastColor,
  handleToCalendarHeadSelectBg,
  handleToCalendarToday,
  genHoverColor,
  DATE_FORMAT,
  DATE_TIME_FORMAT,
  ThemeDetail,
  isDarkColor,
  darkenColor,
  lightenColor,
  toHex,
  UnderlineCss,
  EventModalStyleType
} from "lowcoder-sdk";
import styled from "styled-components";
import dayjs from "dayjs";
import {
  DayHeaderContentArg,
  FormatterInput,
  SlotLabelContentArg,
  ViewContentArg,
} from "@fullcalendar/core";
import { default as Form } from "antd/es/form";

export const Wrapper = styled.div<{
  $editable?: boolean;
  $style?: CalendarStyleType;
  $theme?: ThemeDetail;
  $left?: number;
  $showVerticalScrollbar?:boolean;
}>`
  position: relative;
  height: 100%;
  overflow: hidden;
  color: ${(props) => props.$style.text};
  .fc-theme-standard .fc-list-day-cushion,
  .fc .fc-timegrid-col.fc-day-today,
  .fc .fc-daygrid-day.fc-day-today {
    background-color: ${(props) => props.$style.background};
  }
  .fc .fc-highlight {
    background-color: ${(props) => props.$style.selectBackground};
  }
  a {
    color: ${(props) => props.$style.text};
  }

  .fc .fc-timegrid-slot {
    height: 28px;
  }

  // day
  .fc-timeGridDay-view {
    .fc-col-header-cell {
      font-size: 20px;
      font-weight: 500;
      a {
        line-height: 67px;
      }
    }
  }

  // list
  .fc-list {
    .fc-list-table {
      table-layout: fixed;
      thead {
        position: relative;
        left: unset;
        visibility: hidden;
      }
      th {
        background-color: ${(props) => props.$style.background};

        &:first-child {
          width: 150px;
        }
        &:nth-child(2) {
          width: 300px;
        }
      }
    }
    .fc-list-event-graphic {
      display: none;
    }
    .fc-list-day-cushion {
      font-size: 16px;
      font-weight: 500;
      line-height: 32px;
      padding: 0 24px;
    }
    .fc-list-day-side-text {
      float: left;
      margin-left: 24px;
    }
    .fc-list-day {
      th {
        padding: 8px 0 3px 0;
      }
      > th {
        border: none;
      }
      &:not(:nth-of-type(1)) .fc-list-day-cushion {
        border-top: 1px solid
          ${(props) =>
            toHex(props.$style.border) === "#D7D9E0"
              ? "#E1E3EB"
              : lightenColor(props.$style.border, 0.03)};
      }
    }
    .fc-event + .fc-list-day th {
      padding-top: 11px;
      .fc-list-day-cushion {
        padding-top: 8px;
      }
    }
    .fc-event {
      .fc-list-event-time,
      .fc-list-event-title {
        border: none;
      }
      &:hover .event {
        box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.15);
        border-width: 1px;
        margin: 2px 5px;
        .event-title {
          margin-left: 15px;
        }
        &::before {
          left: 2px;
        }
      }
    }
    .fc-event {
      font-size: 13px;
      line-height: 20px;
      &.no-time {
        padding-left: 19px;
      }
    }
    .fc-list-event-time {
      padding: 0px 16px 0 24px;
      vertical-align: middle;
      min-width: 87px;
      width: 87px;
      box-sizing: content-box;
    }
    .fc-list-event-title {
      padding: 0 14px 0 0;
      cursor: pointer;
      .event {
        font-size: 13px;
        line-height: 18px;
        margin: 3px 5px;
        border-width: 0;
        align-items: center;
        &::before {
          top: 2px;
          left: 3px;
        }
        .event-time {
          display: none;
        }
        .event-title {
          margin-left: 16px;
        }
        .event-remove {
          background-color: inherit;
        }
      }
    }
    .fc-event:hover td {
      background-color: inherit;
    }
  }

  // month
  .fc-dayGridMonth-view {
    .fc-daygrid-day-frame {
      min-height: 95px;
      height: 100%;
    }
    .fc-col-header-cell {
      font-size: 14px;
      font-weight: 400;
      text-align: left;
      padding-left: 16px;
      a {
        padding: 0;
        line-height: 39px;
      }
    }
    .fc-daygrid-day-number {
      font-size: 14px;
      line-height: 22px;
      font-weight: 500;
      padding: 0 6px;
      border-radius: 11px;
      margin: 12px 0 0 10px;
    }
    .fc-daygrid-day-top {
      flex-direction: inherit;
    }
    .fc-day-today .fc-daygrid-day-number {
      background-color: ${(props) =>
        props.$theme?.primary ? props.$theme.primary : props.$style.background};
      color: ${(props) =>
        contrastText(
          props.$theme?.primary || "",
          props.$theme?.textDark || "#000000",
          props.$theme?.textLight || "#ffffff"
        )};
    }
    .fc-daygrid-day-events {
      padding: 1px 0 5px 0;
      min-height: unset;
      .fc-event {
        margin: 2px 4px 2px 12px;
        padding: 0;
        &:hover .event {
          padding-right: 20px;
        }
        .event {
          font-size: 13px;
          line-height: 18px;
          padding-right: 0;
          .event-time {
            display: none;
          }
          .event-title {
            margin-left: 15px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          &::before {
            height: 14px;
          }
        }
      }
      .fc-daygrid-day-bottom {
        padding: 2px 2px 0 10px;
      }
    }
    .fc-day-other {
      color: ${(props) => props.$style.text};
      .fc-daygrid-day-top,
      .fc-daygrid-day-events {
        opacity: 0.35;
      }
      .event::before {
        background-color: ${(props) => props.$style.text};
      }
    }
  }
  // month drag event
  .fc > .fc-event {
    visibility: hidden;
  }

  // more link
  .fc-view-harness-active .fc-more-popover {
    border-radius: 4px;
    box-shadow: 0 0px 10px 4px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    left: ${(props) => `min(${props.$left}px, calc(100% - 210px)) !important`};
    .fc-popover-body {
      padding: 4px 0;
      min-width: 200px;
      width: 200px;
      .fc-daygrid-event-harness {
        margin: 4px;
        .fc-event {
          margin: 0;
          .event {
            height: fit-content;
            .event-title {
              white-space: pre-wrap;
            }
            .event-time {
              margin-top: 0;
            }
          }
        }
      }
    }
    .fc-popover-header,
    .fc-popover-body {
      background-color: ${(props) => props.$style.background};
    }
    .fc-popover-header .fc-popover-close {
      color: #8b8fa3;
      &:hover {
        color: #222;
      }
    }
  }

  .fc-direction-ltr .fc-timegrid-more-link {
    border: 1px solid ${(props) => props.$style.border};
    border-radius: 4px;
    box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.15);
    font-size: 13px;
    display: inline-block;
    font-weight: 500;
    background-color: ${(props) => lightenColor(props.$style.background, 0.1)};
  }

  .fc-dayGridMonth-view .fc-more-link {
    margin: 0 2px 2px 2px !important;
  }
  .fc-timeGridWeek-view .fc-more-link,
  .fc-timeGridDay-view .fc-more-link {
    margin: 2px !important;
  }
  .fc-daygrid-day-events {
    margin: 0 !important;
    padding: 2px 0;
    .fc-event {
      margin: 2px 4px;
    }
    .fc-daygrid-day-bottom {
      line-height: 16px;
      padding: 0;
      .fc-more-link {
        width: calc(100% - 4px);
        border: 1px solid ${(props) => props.$style.border};
        border-radius: 4px;
        box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.15);
        font-size: 13px;
        display: inline-block;
        height: 20px;
        padding-left: 15px;
        font-weight: 500;
        background-color: ${(props) =>
          lightenColor(props.$style.background, 0.1)};
      }
    }
  }

  // on resize
  .fc-media-screen {
    height: 100% !important;
  }
  .fc-scroller {
    overflow: hidden auto !important;
    overflow: hidden overlay !important;
  }
  .fc-col-header,
  .fc-scroller > div,
  .fc-scroller > div > table,
  .fc-scrollgrid-sync-table,
  .fc-timegrid-cols > table,
  .fc .fc-scrollgrid,
  .fc .fc-scrollgrid table {
    width: 100% !important;
  }
  .fc-scroller.fc-scroller-liquid-absolute::-webkit-scrollbar {
    display:${(props) => (props.$showVerticalScrollbar ? 'block' : 'none')};
  }

  // event
  .fc-timegrid-event .fc-event-main {
    padding: 4px 0 4px 1px;
    
  }
  .fc-event {
    position: relative;
    height: 100%;
    background-color: unset !important;
    border: none !important;
    box-shadow: none !important;
    .event-remove {
      color: ${(props) => props.$style.text};
    }
    &:hover {
      .event-remove {
        opacity: ${(props) => (props.$editable ? 1 : undefined)};
      }
    }
  }

  // left time
  .time.past {
    opacity: 0.35;
  }

  .past .time {
    opacity: 0.35;
  }

  .future .time {
    opacity: 1;
  }

  .fc-scrollgrid-liquid > tbody {
    & > tr:nth-of-type(2) {
      display: ${(props) => props.allDay && 1};
    }
  }
  .fc .fc-timegrid-slot-label-cushion {
    padding: 0 15px;
  }

  // border-radius, bg
  .fc-theme-standard .fc-list {
    background-color: ${(props) => props.$style.background};
    border-radius: ${(props) =>
      `0 0 ${props.$style.radius} ${props.$style.radius}`};
    border-color: ${(props) => props.$style.border};
    border-top-color: ${(props) =>
      toHex(props.$style.border) === "#D7D9E0"
        ? "#E1E3EB"
        : lightenColor(props.$style.border, 0.03)};
  }
  .fc-scrollgrid-liquid {
    border-radius: ${(props) =>
      `0 0 ${props.$style.radius} ${props.$style.radius}`};
    overflow: hidden;
    border-right-width: 1px;
    border-bottom-width: 1px;
    border-color: ${(props) => props.$style.border};
    > thead,
    > tbody > tr:nth-of-type(1),
    .fc-scrollgrid-section-liquid > td {
      background-color: ${(props) => props.$style.background};
    }
  }
  .fc-scrollgrid-section-liquid > td,
  .fc-scrollgrid-liquid .fc-scrollgrid-section-header > th {
    border: none;
  }
  .fc-scrollgrid-liquid > tbody > tr:nth-of-type(1) > td {
    border-right: none;
  }
  .fc-theme-standard .fc-scrollgrid {
    border-color: ${(props) =>
      toHex(props.$style.border) === "#D7D9E0"
        ? "#E1E3EB"
        : lightenColor(props.$style.border, 0.03)};
  }
  .fc .fc-scrollgrid {
    border-bottom-width: 1px;
    border-right-width: 1px;
  }

  .fc-day-sat,
  .fc-day-sun {
    &.fc-timegrid-col,
    &.fc-daygrid-day {
      background-color: ${(props) =>
        isDarkColor(props.$style.background)
          ? darkenColor(props.$style.background, 0.06)
          : darkenColor(props.$style.background, 0.02)};
    }
  }
  .fc-theme-standard td,
  .fc-theme-standard th {
    border-color: ${(props) =>
      toHex(props.$style.border) === "#D7D9E0"
        ? "#E1E3EB"
        : lightenColor(props.$style.border, 0.03)};
  }

  // header
  .fc .fc-toolbar.fc-header-toolbar {
    padding: 16px;
    margin-bottom: 0;
    border: 1px solid ${(props) => props.$style.border};
    border-bottom: none;
    border-radius: ${(props) =>
      `${props.$style.radius} ${props.$style.radius} 0 0`};
    background-color: ${(props) => props.$style.background};
  }
  .fc-toolbar-title {
    color: ${(props) => props.$style.title};
    font-size: 24px;
    line-height: 24px;
    display: inline-flex;
  }
  .fc-toolbar-chunk {
    display: inline-flex;
    align-items: center;
  }
  .fc .fc-toolbar-chunk .fc-button.fc-button-primary {
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    &:not(:disabled):not(.fc-button-active) {
      &:hover,
      &:active {
        color: ${(props) => props.$style.btnText};
        background-color: ${(props) =>
          toHex(props.$style.headerBtnBackground) === "#FFFFFF"
            ? "#F5F5F6"
            : genHoverColor(props.$style.headerBtnBackground)};
        border-color: ${(props) =>
          toHex(props.$style.headerBtnBackground) === "#FFFFFF"
            ? "#D7D9E0"
            : backgroundToBorder(
                genHoverColor(props.$style.headerBtnBackground)
              )};
      }
    }
    &:not(:disabled):focus {
      box-shadow: none;
    }
    &:disabled {
      cursor: not-allowed;
      opacity: 1;
      &,
      &:hover {
        background-color: ${(props) => props.$style.headerBtnBackground};
        border-color: ${(props) =>
          backgroundToBorder(props.$style.headerBtnBackground)};
        color: ${(props) =>
          toHex(props.$style.btnText) === "#222222"
            ? "#B8B9BF"
            : contrastColor(props.$style.btnText)};
      }
    }
  }
  .fc .fc-button-primary:not(:disabled).fc-button-active:focus,
  .fc .fc-button-primary:not(:disabled):active:focus {
    box-shadow: none;
  }
  .fc-toolbar-chunk:nth-of-type(3) .fc-button-primary {
    height: 28px;
    display: inline-flex;
    font-size: 14px;
    margin-left: 8px;
    background-color: ${(props) => props.$style.headerBtnBackground};
    border-color: ${(props) =>
      backgroundToBorder(props.$style.headerBtnBackground)};
    color: ${(props) => props.$style.btnText};
    &.fc-today-button {
      min-width: 52px;
    }
    &.fc-prev-button,
    &.fc-next-button {
      padding: 0;
      width: 28px;
      color: ${(props) => lightenColor(props.$style.btnText, 0.4)};
    }
    &.fc-prev-button {
      margin-left: 12px;
    }
  }
  .fc-toolbar-chunk:nth-of-type(3) .fc-button-group {
    background-color: ${(props) =>
      toHex(props.$style.headerBtnBackground) === "#FFFFFF"
        ? "#EFEFF1"
        : isDarkColor(props.$style.headerBtnBackground)
          ? props.$style.headerBtnBackground
          : darkenColor(props.$style.headerBtnBackground, 0.1)};
    border-radius: 4px;
    margin-left: 16px;
    .fc-button-primary {
      background-color: transparent;
      min-width: 60px;
      border-radius: 4px;
      margin: 2px;
      border: none;
      color: ${(props) =>
        toHex(props.$style.btnText) === "#222222"
          ? "#8B8FA3"
          : lightenColor(props.$style.btnText, 0.4)};
      font-weight: 500;

      &.fc-button-active {
        background-color: ${(props) =>
          isDarkColor(props.$style.headerBtnBackground)
            ? lightenColor(props.$style.headerBtnBackground, 0.1)
            : props.$style.headerBtnBackground};
        color: ${(props) => props.$style.btnText};
      }
    }
  }

  // week head
  .fc-timeGridWeek-view {
    .week-head {
      display: flex;
      flex-direction: column;
      font-size: 14px;
      font-weight: 400;
      &.past span {
        opacity: 0.35;
      }
      .week {
        padding-bottom: 3px;
      }
      .day {
        font-size: 20px;
        font-weight: 500;
        line-height: 22px;
      }
    }
    .fc-day-today.fc-col-header-cell {
      background-color: ${(props) =>
        isDarkColor(props.$style.background)
          ? "#ffffff19"
          : toHex(props.$theme?.primary!) + "19"};
      a {
        color: ${(props) =>
          !isDarkColor(props.$style.background) &&
          darkenColor(props.$theme?.primary!, 0.1)};
      }
    }
    .fc-col-header-cell-cushion {
      padding: 8px 0 13px 0;
    }
  }

  // week left
  .fc .fc-timegrid-axis-cushion {
    min-width: 62px;
    min-height: 52px;
    max-width: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .fc-direction-ltr .fc-timegrid-slot-label-frame {
    text-align: center;
  }
  .fc .fc-timegrid-slot-label {
    border: none;
  }

  // time can doubleClick
  .fc-timegrid-bg-harness,
  .fc-daygrid-day-bg {
    pointer-events: none;
  }
`;

export const Remove = styled.div<{ $isList: boolean }>`
  position: absolute;
  pointer-events: auto;
  top: 0;
  right: 0;
  display: flex;
  padding: 5px;
  opacity: 0;
  cursor: pointer;
  &:hover {
    g {
      stroke: #315efb;
    }
  }
`;

export const Event = styled.div<{
  theme: Object;
  $isList: boolean;
  $allDay: boolean;
  $style: CalendarStyleType;
  $backgroundColor:string;
  $extendedProps: any;
}>`
  height: 100%;
  width: 100%;
  pointer-events: none;
  border-radius: 4px;
  box-shadow: ${(props) => !props.$isList && "0 0 5px 0 rgba(0, 0, 0, 0.15)"};
  border: 1px solid ${(props) => props.$style.border};
  display: ${(props) => props.$isList && "flex"};
  background-color:${(props) => props?.$backgroundColor || "#ffffff"} ;
  overflow: hidden;
  font-size: 13px;
  line-height: 19px;
  padding-right: 20px;
  overflow: hidden;
  position: relative;
  animation: ${(props) => props?.$extendedProps?.animation || ""};
  animation-delay: ${(props) => props?.$extendedProps?.animationDelay || ""} ;
  animation-duration: ${(props) => props?.$extendedProps?.animationDuration || ""};
  animation-iteration-count: ${(props) => props?.$extendedProps?.animationIterationCount || ""};
  &::before {
    content: "";
    position: absolute;
    display: block;
    width: 5px;
    height: calc(100% - 4px);
    left: 2px;
    top: 2px;
    border-radius: 3px;
    background-color: ${(props) => props.$extendedProps?.color};
  }

  .event-time {
    color: ${(props) =>
      !props.$isList &&
      (isDarkColor(props.$style.text)
        ? lightenColor(props.$style.text, 0.2)
        : props.$style.text)};
    margin-left: 15px;
    white-space: pre-wrap;
    margin-top: 2px;
  }
  .event-title {
    color: ${(props) => props?.$extendedProps?.titleColor || "#000000"};
    font-weight: ${(props) => props?.$extendedProps?.titleFontWeight || "normal"};
    font-style: ${(props) => props?.$extendedProps?.titleFontStyle || ""};
    margin-left: 15px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .event-detail {
    color: ${(props) => props?.$extendedProps?.detailColor || "#000000"};
    font-weight: ${(props) => props?.$extendedProps?.detailFontWeight || "normal"};
    font-style: ${(props) => props?.$extendedProps?.detailFontStyle || "italic"};
    margin-left: 15px;
    white-space: pre-wrap;
    word-break: break-word;
    margin-top: 2px; 
  }

  &.small {
    height: 20px;
    .event-time {
      display: none;
    }
    .event-title,
    .event-detail
    {
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
  }
  &.middle {
    padding-top: 2px;
    .event-time,
    .event-title,
     .event-detail
     {
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
  }
  &.large {
    .event-time {
      margin-top: 13px;
    }
  }
  &.past {
    background-color: ${(props) =>
    `rgba(${props?.$extendedProps?.color}, 0.3)`};
    &::before {
    background-color: ${(props) => props?.$extendedProps?.color};
    opacity: 0.3;
    }
    &::before,
    .event-title,
    .event-time,
    .event-detail
    {
      opacity: 0.35;
    }
  }
`;

export const FormWrapper = styled(Form)<{
  $modalStyle?: EventModalStyleType
}>`
  .ant-form-item-label {
    width: 125px;
    text-align: left;
    line-height: 18px;

    label:not(.ant-form-item-required) {
      margin-left: 2px;
    }
      label.ant-form-item-required{
      margin-left: 2px;
    }
    label span {
      ${UnderlineCss}
      
    }
  }

  // Setting style for input fields
  .ant-input {
    background-color: ${(props) => props.$modalStyle?.labelBackground };
    border-color: ${(props) => props.$modalStyle?.border};
    border-width: ${(props) => props.$modalStyle?.borderWidth};
    border-style: ${(props) => props.$modalStyle?.borderStyle};
    color: ${(props) => props.$modalStyle?.text};
  }

`;

export type EventType = {
  animationIterationCount: any;
  animationDuration: any;
  animationDelay: any;
  animation: any;
  titleFontWeight: any;
  titleFontStyle: any;
  detailFontWeight: any;
  detailFontStyle: any;
  id?: string;
  resourceId?: string;
  label?: string;
  title?: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  backgroundColor?:string;
  groupId?: string;
  value?: string;
  detail?:string;
  titleColor?:string;
  detailColor?:string;
};

export enum ViewType {
  YEAR = "multiMonthYear",
  MONTH = "dayGridMonth",
  WEEK = "timeGridWeek",
  DAY = "timeGridDay",
  DAYLIST = "dayGridDay",
  LIST = "listWeek",
  TIMEGRID = "timeGridDay",
}

export const DefaultWithPremiumViewOptions = [
  {
    label: trans("calendar.resourceTimeGridDay"),
    value: "resourceTimeGridDay",
  },
  {
    label: trans("calendar.timeline"),
    value: "resourceTimelineDay",
  },
  {
    label: trans("calendar.year"),
    value: "multiMonthYear",
  },
  {
    label: trans("calendar.month"),
    value: "dayGridMonth",
  },
  {
    label: trans("calendar.week"),
    value: "timeGridWeek",
  },
  {
    label: trans("calendar.weekdaygrid"),
    value: "dayGridWeek",
  },
  {
    label: trans("calendar.daygrid"),
    value: "dayGridDay",
  },
  {
    label: trans("calendar.day"),
    value: "timeGridDay",
  },
  {
    label: trans("calendar.list"),
    value: "listWeek",
  },
] as const;

export const DefaultWithFreeViewOptions = [
  {
    label: trans("calendar.year"),
    value: "multiMonthYear",
  },
  {
    label: trans("calendar.month"),
    value: "dayGridMonth",
  },
  {
    label: trans("calendar.week"),
    value: "timeGridWeek",
  },
  {
    label: trans("calendar.weekdaygrid"),
    value: "dayGridWeek",
  },
  {
    label: trans("calendar.daygrid"),
    value: "dayGridDay",
  },
  {
    label: trans("calendar.day"),
    value: "timeGridDay",
  },
  {
    label: trans("calendar.list"),
    value: "listWeek",
  },
] as const;

export const FirstDayOptions = [
  {
    label: trans("calendar.monday"),
    value: "1",
  },
  {
    label: trans("calendar.tuesday"),
    value: "2",
  },
  {
    label: trans("calendar.wednesday"),
    value: "3",
  },
  {
    label: trans("calendar.thursday"),
    value: "4",
  },
  {
    label: trans("calendar.friday"),
    value: "5",
  },
  {
    label: trans("calendar.saturday"),
    value: "6",
  },
  {
    label: trans("calendar.sunday"),
    value: "0",
  },
];

export const defaultEvents = [
  {
    id: "1",
    label: "Coding",
    start: dayjs().hour(10).minute(0).second(0).format(DATE_TIME_FORMAT),
    end: dayjs().hour(12).minute(30).second(0).format(DATE_TIME_FORMAT),
    color: "#079968",
    backgroundColor:"#ffffff",
    detail: 'Discuss project milestones and deliverables.',
    titleColor:"#000000",
    detailColor:"#000000",
    titleFontWeight:"normal",
    titleFontStyle:"italic",
    detailFontWeight:"normal",
    detailFontStyle:"italic",
    animation:"none",
    animationDelay:"0s",
    animationDuration:"0s",
    animationIterationCount:"0",
  },
  {
    id: "2",
    label: "Rest",
    start: dayjs().hour(24).format(DATE_FORMAT),
    end: dayjs().hour(48).format(DATE_FORMAT),
    color: "#079968",
    allDay: true,
  },
  {
    id: "3",
    resourceId: "d1",
    label: "event 1",
    start: dayjs().hour(10).minute(0).second(0).format(DATE_TIME_FORMAT),
    end: dayjs().hour(17).minute(30).second(0).format(DATE_TIME_FORMAT),
    color: "#079968",
  },
  {
    id: "4",
    resourceId: "b",
    label: "event 5",
    start: dayjs().hour(8).minute(0).second(0).format(DATE_TIME_FORMAT),
    end: dayjs().hour(16).minute(30).second(0).format(DATE_TIME_FORMAT),
    color: "#079968",
  },
  {
    id: "5",
    resourceId: "a",
    label: "event 3",
    start: dayjs().hour(12).minute(0).second(0).format(DATE_TIME_FORMAT),
    end: dayjs().hour(21).minute(30).second(0).format(DATE_TIME_FORMAT),
    color: "#079968",
  },
];
export const resourcesEventsDefaultData = [
  {
    id: "1",
    resourceId: "d1",
    label: "event 1",
    start: dayjs().hour(10).minute(0).second(0).format(DATE_TIME_FORMAT),
    end: dayjs().hour(17).minute(30).second(0).format(DATE_TIME_FORMAT),
    color: "#079968",
  },
  {
    id: "2",
    resourceId: "b",
    label: "event 5",
    start: dayjs().hour(8).minute(0).second(0).format(DATE_TIME_FORMAT),
    end: dayjs().hour(16).minute(30).second(0).format(DATE_TIME_FORMAT),
    color: "#079968",
  },
  {
    id: "3",
    resourceId: "a",
    label: "event 3",
    start: dayjs().hour(12).minute(0).second(0).format(DATE_TIME_FORMAT),
    end: dayjs().hour(21).minute(30).second(0).format(DATE_TIME_FORMAT),
    color: "#079968",
  },
];

export const resourcesDefaultData = [
  {
    id: "a",
    title: "Auditorium A",
  },
  {
    id: "b",
    title: "Auditorium B",
    eventColor: "green",
  },
  {
    id: "d",
    title: "Auditorium D",
    children: [
      {
        id: "d1",
        title: "Room D1",
      },
      {
        id: "d2",
        title: "Room D2",
      },
    ],
  },
];

export const buttonText = {
  today: trans("calendar.today"),
  month: trans("calendar.month"),
  week: trans("calendar.week"),
  timeline: trans("calendar.timeline"),
  day: trans("calendar.day"),
  list: trans("calendar.list"),
};

export const headerToolbar = {
  left: "title",
  right: "prev today next dayGridMonth,timeGridWeek,timeGridDay,listWeek",
};

export const resourceTimeLineHeaderToolbar = {
  left: "title",
  right:
    "prev today next resourceTimelineMonth,resourceTimelineWeek,resourceTimelineDay",
};
export const resourceTimeGridHeaderToolbar = {
  left: "title",
  right: "prev today next",
};

const weekHeadContent = (info: DayHeaderContentArg) => {
  const text = info.text.split(" ");
  return {
    html: `<span class="week-head ${info.isPast && "past"} ${
      info.isToday && "today"
    }">
  <span class="week">${text[0]}</span>
  <span class="day">${text[1]}</span>
  </span>`,
  };
};

const leftTimeContent = (info: SlotLabelContentArg) => {
  let isPast = false;
  if (info.view.type === ViewType.WEEK) {
    isPast = dayjs().isAfter(dayjs(dayjs().format("YYYY MM DD " + info.text)));
  } else if (info.view.type === ViewType.DAY) {
    isPast = dayjs().isAfter(
      dayjs(dayjs(info.view.activeStart).format("YYYY MM DD " + info.text))
    );
  }
  return {
    html: `<span class="time ${isPast && "past"}">${info.text}</span>`,
  };
};

export const views = {
  [ViewType.WEEK]: {
    dayHeaderFormat: "ddd DD",
    dayHeaderContent: (info: DayHeaderContentArg) => weekHeadContent(info),
    slotLabelContent: (info: SlotLabelContentArg) => leftTimeContent(info),
  },
  [ViewType.DAY]: {
    slotLabelContent: (info: SlotLabelContentArg) => leftTimeContent(info),
  },
  [ViewType.LIST]: {
    listDayFormat: { weekday: "short" },
  },
} as const;

export const slotLabelFormat = [
  {
    hour: "2-digit",
    minute: "2-digit",
  }, 
] as FormatterInput[];

export const slotLabelFormatWeek = [
  { week: "short" },
  { hour: "2-digit" }, 
] as FormatterInput[];

export const slotLabelFormatMonth = [
  { week: "short" },
  { weekday: "short" }
] as FormatterInput[];

export const viewClassNames = (info: ViewContentArg) => {
  let className = "";
  if ([ViewType.WEEK, ViewType.DAY].includes(info.view.type as ViewType)) {
    if (dayjs().isAfter(info.view.activeEnd)) {
      className = "past";
    } else if (dayjs().isBefore(info.view.activeStart)) {
      className = "future";
    }
  }
  return className;
};

