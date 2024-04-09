import {
  isValidColor,
  NameConfig,
  NameConfigHidden,
  BoolControl,
  UICompBuilder,
  withDefault,
  withExposingConfigs,
  NumberControl,
  StringControl,
  hiddenPropertyView,
  ChangeEventHandlerControl,
  Section,
  sectionNames,
  dropdownControl,
  styleControl,
  ThemeContext,
  CalendarStyle,
  DateParser,
  CustomModal,
  jsonValueExposingStateControl,
  CalendarDeleteIcon,
  Tooltip,
} from "lowcoder-sdk";
import { trans, getCalendarLocale } from "../../i18n/comps";
import {
  DefaultWithFreeViewOptions,
  DefaultWithPremiumViewOptions,
  FirstDayOptions,
} from "./calendarConstants";

import AgoraRTC, {
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type IAgoraRTCClient,
  type IAgoraRTCRemoteUser,
  type UID,
  type ILocalVideoTrack,
} from "agora-rtc-sdk-ng";
import type { RtmChannel, RtmClient } from "agora-rtm-sdk";

const childrenMap = {
  
};

let CalendarBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props) => {
    
  })
    .setPropertyViewFn((children) => {
      let licence = children.licenceKey.getView();
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.events.propertyView({})}
          </Section>
          <Section name={sectionNames.interaction}>
            {children.licenceKey.propertyView({
              label: trans("calendar.licence"),
            })}
            {children.onEvent.getPropertyView()}
          </Section>
          <Section name={sectionNames.advanced}>
            {children.editable.propertyView({
              label: trans("calendar.editable"),
            })}
            {children.defaultDate.propertyView({
              label: trans("calendar.defaultDate"),
              tooltip: trans("calendar.defaultDateTooltip"),
            })}
            {licence == ""
              ? children.defaultFreeView.propertyView({
                  label: trans("calendar.defaultView"),
                  tooltip: trans("calendar.defaultViewTooltip"),
                })
              : children.defaultPremiumView.propertyView({
                  label: trans("calendar.defaultView"),
                  tooltip: trans("calendar.defaultViewTooltip"),
                })}
            {children.firstDay.propertyView({
              label: trans("calendar.startWeek"),
            })}
            {children.showEventTime.propertyView({
              label: trans("calendar.showEventTime"),
              tooltip: trans("calendar.showEventTimeTooltip"),
            })}
            {children.showWeekends.propertyView({
              label: trans("calendar.showWeekends"),
            })}
            {children.showAllDay.propertyView({
              label: trans("calendar.showAllDay"),
              tooltip: trans("calendar.showAllDayTooltip"),
            })}
            {children.dayMaxEvents.propertyView({
              label: trans("calendar.dayMaxEvents"),
              tooltip: trans("calendar.dayMaxEventsTooltip"),
            })}
            {children.eventMaxStack.propertyView({
              label: trans("calendar.eventMaxStack"),
              tooltip: trans("calendar.eventMaxStackTooltip"),
            })}
          </Section>
          <Section name={sectionNames.layout}>
            {hiddenPropertyView(children)}
          </Section>
          <Section name={sectionNames.style}>
            {children.style.getPropertyView()}
          </Section>
        </>
      );
    })
    .build();
})();

CalendarBasicComp = class extends CalendarBasicComp {
  override autoHeight(): boolean {
    return false;
  }
};

export const CalendarComp = withExposingConfigs(CalendarBasicComp, [
  new NameConfig("events", trans("calendar.events")),
  NameConfigHidden,
]);
