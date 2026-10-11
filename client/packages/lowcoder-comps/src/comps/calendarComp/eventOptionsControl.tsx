import {
  MultiCompBuilder,
  StringControl,
  BoolControl,
  ColorControl,
  optionsControl,
  NewChildren,
  RecordConstructorToComp,
  controlItem
} from 'lowcoder-sdk';
import { default as Divider } from "antd/es/divider";
import { trans } from "../../i18n/comps";
import styled from "styled-components";
import { defaultEvents } from './calendarConstants';

const PropertyViewWrapper = styled.div`
  max-height: 80vh;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

type NewChildren<T> = typeof NewChildren;
type RecordConstructorToComp<T> = typeof RecordConstructorToComp;

const eventChildrenMap =  {
  id: StringControl,
  label: StringControl,
  detail: StringControl,
  groupId: StringControl,
  resourceId: StringControl,
  start: StringControl, // TODO: Create Date,Time & DateTime Controls
  end: StringControl,
  allDay: BoolControl,
  color: ColorControl,
  backgroundColor: ColorControl,
  titleColor: ColorControl,
  detailColor: ColorControl,
  titleFontWeight: StringControl,
  titleFontStyle: StringControl,
  detailFontWeight: StringControl,
  detailFontStyle: StringControl,
  animation: StringControl,
  animationDelay: StringControl,
  animationDuration: StringControl,
  animationIterationCount: StringControl,
};

type EventChildrenType = NewChildren<RecordConstructorToComp<typeof eventChildrenMap>>;

const EventGeneral = ({ childrenMap }: { childrenMap: EventChildrenType }) => (
  <>
    {controlItem({filterText: 'general'}, (
      <><b>{trans("calendar.general")}</b></>
    ))}
    {childrenMap.id.propertyView({
      label: trans("calendar.eventId"),
      tooltip: trans("calendar.eventIdTooltip"),
    })}
    {childrenMap.label.propertyView({
      label: trans("calendar.eventName"),
    })}
    {childrenMap.detail.propertyView({
      label: trans("calendar.eventdetail"),
    })}
    {childrenMap.groupId.propertyView({
      label: trans("calendar.eventGroupId"),
      tooltip: trans("calendar.groupIdTooltip"),
    })}
    {childrenMap.resourceId.propertyView({
      label: trans("calendar.eventResourceId"),
    })}
    {childrenMap.start.propertyView({
      label: trans("calendar.eventStartTime"),
    })}
    {childrenMap.end.propertyView({
      label: trans("calendar.eventEndTime"),
    })}
    {childrenMap.allDay.propertyView({
      label: trans("calendar.eventAllDay"),
    })}
  </>
);

const EventColorStyles = ({ childrenMap }: { childrenMap: EventChildrenType }) => (
  <>
    {controlItem({filterText: 'colorStyles'}, (
      <><b>{trans("calendar.colorStyles")}</b></>
    ))}
    {childrenMap.titleColor.propertyView({
      label: trans("calendar.eventTitleColor"),
    })}
    {childrenMap.detailColor.propertyView({
      label: trans("calendar.eventdetailColor"),
    })}
    {childrenMap.color.propertyView({
      label: trans("calendar.eventColor"),
    })}
    {childrenMap.backgroundColor.propertyView({
      label: trans("calendar.eventBackgroundColor"),
    })}
  </>
);

const EventFontStyles = ({ childrenMap }: { childrenMap: EventChildrenType }) => (
  <>
    {controlItem({filterText: 'fontStyles'}, (
      <><b>{trans("calendar.fontStyles")}</b></>
    ))}
    {childrenMap.titleFontWeight.propertyView({
      label: trans("calendar.eventTitleFontWeight"),
    })}
    {childrenMap.titleFontStyle.propertyView({
      label: trans("calendar.eventTitleFontStyle"),
    })}
    {childrenMap.detailFontWeight.propertyView({
      label: trans("calendar.eventdetailFontWeight"),
    })}
    {childrenMap.detailFontStyle.propertyView({
      label: trans("calendar.eventdetailFontStyle"),
    })}
  </>
);

const EventAnimations = ({ childrenMap }: { childrenMap: EventChildrenType }) => (
  <>
    {controlItem({filterText: 'animations'}, (
      <><b>{trans("calendar.animations")}</b></>
    ))}
    {childrenMap.animation.propertyView({
      label: trans("calendar.animationType"),
    })}
    {childrenMap.animationDelay.propertyView({
      label: trans("calendar.animationDelay"),
    })}
    {childrenMap.animationDuration.propertyView({
      label: trans("calendar.animationDuration"),
    })}
    {childrenMap.animationIterationCount.propertyView({
      label: trans("calendar.animationIterationCount"),
    })}
  </>
);

let EventOption = new MultiCompBuilder(eventChildrenMap,
  (props: any) => props
)
.setPropertyViewFn((children: EventChildrenType) => (
  <PropertyViewWrapper>
    <EventGeneral childrenMap={children} />
    <Divider style={{ margin: '12px 0' }} />
    <EventColorStyles childrenMap={children} />
    <Divider style={{ margin: '12px 0' }} />
    <EventFontStyles childrenMap={children} />
    <Divider style={{ margin: '12px 0' }} />
    <EventAnimations childrenMap={children} />
  </PropertyViewWrapper>
))
.build();

export const EventOptionControl = optionsControl(
  EventOption,
  {
    initOptions: defaultEvents,
    uniqField: "id",
  }
);
