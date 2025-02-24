import { default as Form } from "antd/es/form";
import { default as Input } from "antd/es/input";
import { default as ColorPicker } from "antd/es/color-picker";
import { default as Switch } from "antd/es/switch";
import { trans, getCalendarLocale } from "../../i18n/comps";
import { createRef, useContext, useRef, useState, useEffect, useCallback, useMemo, Suspense } from "react";
import dayjs from "dayjs";
import FullCalendar from "@fullcalendar/react";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import adaptivePlugin from "@fullcalendar/adaptive";
import dayGridPlugin from "@fullcalendar/daygrid";
import multiMonthPlugin from '@fullcalendar/multimonth';
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { EventResizeDoneArg } from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import allLocales from "@fullcalendar/core/locales-all";
import { EventContentArg, DateSelectArg, EventDropArg } from "@fullcalendar/core";
import momentPlugin from "@fullcalendar/moment";

import ErrorBoundary from "./errorBoundary";
import { default as Tabs } from "antd/es/tabs";
import { differenceBy, differenceWith, isEqual, filter, includes } from "lodash";

import {
  isValidColor,
  NameConfig,
  NameConfigHidden,
  BoolControl,
  UICompBuilder,
  withDefault,
  withExposingConfigs,
  withMethodExposing,
  NumberControl,
  StringControl,
  hiddenPropertyView,
  ChangeEventHandlerControl,
  DragEventHandlerControl,
  CalendarEventHandlerControl,
  Section,
  sectionNames,
  dropdownControl,
  styleControl,
  ThemeContext,
  CalendarStyle,
  DateParser,
  modalInstance,
  CustomModal,
  jsonValueExposingStateControl,
  CalendarDeleteIcon,
  Tooltip,
  EditorContext,
  CompNameContext,
  AnimationStyle,
  EventModalStyle,
  migrateOldData,
  controlItem,
  depsConfig,
  stateComp,
  JSONObject,
} from 'lowcoder-sdk';

import {
  DefaultWithFreeViewOptions,
  DefaultWithPremiumViewOptions,
  FirstDayOptions,
  Wrapper,
  Event,
  Remove,
  EventType,
  defaultEvents,
  ViewType,
  buttonText,
  headerToolbar,
  views,
  slotLabelFormat,
  slotLabelFormatWeek,
  slotLabelFormatMonth,
  viewClassNames,
  FormWrapper,
  resourcesDefaultData,
  resourceTimeLineHeaderToolbar,
  resourceTimeGridHeaderToolbar,
} from "./calendarConstants";
import { EventOptionControl } from "./eventOptionsControl";
import { EventImpl } from "@fullcalendar/core/internal";
import DatePicker from "antd/es/date-picker";

const DATE_TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

function fixOldData(oldData: any) {
  if(!Boolean(oldData)) return;
  let {events, resourcesEvents, ...data } = oldData;
  let allEvents: any[] = [];
  let isDynamicEventData = false;

  if (events && typeof events === 'string') {
    try {
      let eventsList = JSON.parse(events);
      if (eventsList && eventsList.length) {
        eventsList = eventsList?.map(event => {
          const {title, ...eventData} = event;
          return {
            ...eventData,
            label: title, // replace title field with label
          }
        });
        allEvents = allEvents.concat(eventsList);
      }
    } catch (_) {
      isDynamicEventData = true;
    }
  }
  if (resourcesEvents && typeof resourcesEvents === 'string') {
    try {
      let resourceEventsList = JSON.parse(resourcesEvents);
      if (resourceEventsList && resourceEventsList.length) {
        resourceEventsList = resourceEventsList?.map(event => {
          const {title, ...eventData} = event;
          return {
            ...eventData,
            label: title, // replace title field with label
          }
        });
        allEvents = allEvents.concat(resourceEventsList);
      }
    } catch (_) {}
  }
  
  if (isDynamicEventData) {
    return {
      ...data,
      events: {
        manual: {
          manual: allEvents,
        },
        mapData: {
          data: events,
          mapData: {
            id: "{{item.id}}",
            label: "{{item.title}}",
            detail: "{{item.detail}}",
            start: "{{item.start}}",
            end: "{{item.end}}",
            color: "{{item.color}}",
            allDay: "{{item.allDay}}",
            groupId: "{{item.groupId}}",
            resourceId: "{{item.resourceId}}",
          }
        },
        optionType: "map",
      },
    };
  }

  if (allEvents.length) {
    return {
      ...data,
      events: {
        manual: {
          manual: allEvents,
        },
        mapData: {
          data: JSON.stringify(allEvents, null, 2),
          mapData: {
            id: "{{item.id}}",
            label: "{{item.title}}",
            detail: "{{item.detail}}",
            start: "{{item.start}}",
            end: "{{item.end}}",
            color: "{{item.color}}",
            allDay: "{{item.allDay}}",
            groupId: "{{item.groupId}}",
            resourceId: "{{item.resourceId}}",
          }
        },
        optionType: "manual",
      },
    };
  }

  return {
    ...data,
    events,
  };
}

let childrenMap: any = {
  events: EventOptionControl,
  resources: jsonValueExposingStateControl("resources", resourcesDefaultData),
  resourceName: withDefault(StringControl, trans("calendar.resourcesDefault")),
  onEvent: CalendarEventHandlerControl ? CalendarEventHandlerControl : ChangeEventHandlerControl,
  editable: withDefault(BoolControl, true),
  showEventTime: withDefault(BoolControl, true),
  showWeekends: withDefault(BoolControl, true),
  showAllDay: withDefault(BoolControl, true),
  defaultDate: withDefault(StringControl, "{{ new Date() }}"),
  firstDay: dropdownControl(FirstDayOptions, "1"),
  dayMaxEvents: withDefault(NumberControl, 2),
  eventMaxStack: withDefault(NumberControl, 0),
  style: styleControl(CalendarStyle, 'style'),
  licenseKey: withDefault( StringControl, "" ),
  currentFreeView: dropdownControl(DefaultWithFreeViewOptions, "timeGridWeek"),
  currentPremiumView: dropdownControl(DefaultWithPremiumViewOptions, "resourceTimelineDay"),
  animationStyle: styleControl(AnimationStyle, 'animationStyle'),
  showVerticalScrollbar: withDefault(BoolControl, false),
  showResourceEventsInFreeView: withDefault(BoolControl, false),
  initialData: stateComp<JSONObject>({}),
  updatedEvents: stateComp<JSONObject>({}),
  insertedEvents: stateComp<JSONObject>({}),
  deletedEvents: stateComp<JSONObject>({}),
  inputFormat: withDefault(StringControl, DATE_TIME_FORMAT),
};

// this should ensure backwards compatibility with older versions of the SDK
if (DragEventHandlerControl) { 
  childrenMap = {
    ...childrenMap,
    onDropEvent: DragEventHandlerControl,
  }
}
if (EventModalStyle) { 
  childrenMap = {
    ...childrenMap,
    modalStyle:  styleControl(EventModalStyle),
  }
}

let CalendarBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props: { 
    events: any; 
    resources: any; 
    resourceName : string
    onEvent?: any;
    onDropEvent?: any;
    editable?: boolean; 
    showEventTime?: boolean; 
    showWeekends?: boolean; 
    showAllDay?: boolean; 
    defaultDate?: string; 
    firstDay?: string; 
    dayMaxEvents?: number; 
    eventMaxStack?: number; 
    style: any; 
    licenseKey?: string; 
    licensed?: boolean;
    currentFreeView?: string; 
    currentPremiumView?: string; 
    animationStyle?:any;
    modalStyle?:any;
    showVerticalScrollbar?:boolean;
    showResourceEventsInFreeView?: boolean;
    initialData: Array<EventType>;
    inputFormat: string;
  }, dispatch: any) => {
    const comp = useContext(EditorContext)?.getUICompByName(
      useContext(CompNameContext)
    );
    
    const theme = useContext(ThemeContext);
    const ref = createRef<HTMLDivElement>();
    const editEvent = useRef<EventType>();
    const initData = useRef<boolean>(false);
    const [form] = Form.useForm(); 
    const [left, setLeft] = useState<number | undefined>(undefined);
    const [licensed, setLicensed] = useState<boolean>(props.licenseKey !== "");
    const [currentSlotLabelFormat, setCurrentSlotLabelFormat] = useState(slotLabelFormat);
    const [initDataMap, setInitDataMap] = useState<Record<string, number>>({});
    const [hoverEventId, setHoverEvent] = useState<string>();

    useEffect(() => {
      setLicensed(props.licenseKey !== "");
    }, [props.licenseKey]);

    const onEventVal = useMemo(() => comp?.toJsonValue()?.comp?.onEvent, [comp]);

    const initialDate = useMemo(() => {
      let date = undefined;
      try {
        date = new Date(props.defaultDate || Date.now()).toISOString();
      } catch (error) {
        date = undefined;
      }
      return date;
    }, [props.defaultDate]);

    const currentView = useMemo(() => {
      return licensed ? props.currentPremiumView : props.currentFreeView;
    },[
      licensed,
      props.currentPremiumView,
      props.currentFreeView,
    ]);

    const currentEvents = useMemo(() => {
      if (props.showResourceEventsInFreeView && Boolean(props.licenseKey)) {
        return props.events.filter((event: { resourceId: any; }) => Boolean(event.resourceId))
      }
      return currentView == "resourceTimelineDay" || currentView == "resourceTimeGridDay"
        ? props.events.filter((event: { resourceId: any; }) => Boolean(event.resourceId))
        : props.events.filter((event: { resourceId: any; }) => !Boolean(event.resourceId));
    }, [
      currentView,
      props.events,
      props.showResourceEventsInFreeView,
    ])

    // we use one central stack of events for all views
    const events = useMemo(() => {
      return Array.isArray(currentEvents) ? currentEvents.map((item: EventType) => {
        return {
          title: item.label,
          id: item.id,
          start: dayjs(item.start, DateParser).format(),
          end: dayjs(item.end, DateParser).format(),
          allDay: item.allDay,
          ...(item.resourceId ? { resourceId: item.resourceId } : {}),
          ...(item.groupId ? { groupId: item.groupId } : {}),
          backgroundColor: item.backgroundColor,
          extendedProps: {   // Ensure color is in extendedProps
            color: isValidColor(item.color || "") ? item.color : theme?.theme?.primary,
            detail: item.detail,
            titleColor:item.titleColor,
            detailColor:item.detailColor,
            titleFontWeight:item.titleFontWeight,
            titleFontStyle:item.titleFontStyle,
            detailFontWeight:item.detailFontWeight,
            detailFontStyle:item.detailFontStyle,
            animation:item?.animation,
            animationDelay:item?.animationDelay,
            animationDuration:item?.animationDuration,
            animationIterationCount:item?.animationIterationCount
          }
        }
      }) : [currentEvents];
    }, [currentEvents, theme])

    useEffect(() => {
      if (initData.current) return;

      const mapData: Record<string, number> = {};
      events?.forEach((item: any, index: number) => {
        mapData[`${item.id}`] = index;
      })

      if (!initData.current && events?.length && comp?.children?.comp?.children?.initialData) {
        setInitDataMap(mapData);
        comp?.children?.comp?.children?.initialData?.dispatch?.(
          comp?.children?.comp?.children?.initialData?.changeValueAction?.([...events])
        );
        initData.current = true;
      }
    }, [JSON.stringify(events), comp?.children?.comp?.children?.initialData]);
  
    const resources = useMemo(() => props.resources.value, [props.resources.value]);

    // list all plugins for Fullcalendar
    const plugins = useMemo(() => [
      dayGridPlugin,
      timeGridPlugin,
      interactionPlugin,
      listPlugin,
      momentPlugin,
      resourceTimelinePlugin,
      resourceTimeGridPlugin,
      adaptivePlugin,
      multiMonthPlugin,
    ], []);

    // filter out premium plugins if not licensed
    const filteredPlugins = useMemo(() => {
      return plugins.filter((plugin) => {
        if (!licensed) {
          return ![resourceTimelinePlugin, resourceTimeGridPlugin, adaptivePlugin].includes(plugin);
        }
        return true;
      });
    }, [plugins, licensed]);

    const toolBar = useMemo(() => {
      let toolBarPos: {left: string, right: string};
      switch (currentView) {
        case "resourceTimelineDay":
          toolBarPos = resourceTimeLineHeaderToolbar;
          break;
        case "resourceTimeGridDay":
          toolBarPos = resourceTimeGridHeaderToolbar;
          break;
        default:
          toolBarPos = headerToolbar;
          break;
      }
      return toolBarPos;
    }, [currentView]);

    const handleDatesSet = useCallback((arg: { view: { type: any; }; }) => {
      switch (arg.view.type) {
        case "resourceTimelineDay":
          setCurrentSlotLabelFormat(slotLabelFormat);
          break;
        case "resourceTimelineWeek":
          setCurrentSlotLabelFormat(slotLabelFormatWeek);
          break;
        case "resourceTimelineMonth":
          setCurrentSlotLabelFormat(slotLabelFormatMonth);
          break;
        default:
          setCurrentSlotLabelFormat(slotLabelFormat);
          break;
      }
    }, [slotLabelFormat, slotLabelFormatWeek, slotLabelFormatMonth]);

    const findUpdatedInsertedDeletedEvents = useCallback((data: Array<EventType>) => {
      if (!initData.current) return;

      let eventsData: Array<Record<string, any>> = currentView == "resourceTimelineDay" || currentView == "resourceTimeGridDay"
        ? data.filter((event: { resourceId?: string; }) => Boolean(event.resourceId))
        : data.filter((event: { resourceId?: string; }) => !Boolean(event.resourceId));

      eventsData = eventsData.map((item) => ({
        title: item.label,
        id: item.id,
        start: dayjs(item.start, DateParser).format(),
        end: dayjs(item.end, DateParser).format(),
        allDay: item.allDay,
        ...(item.resourceId ? { resourceId: item.resourceId } : {}),
        ...(item.groupId ? { groupId: item.groupId } : {}),
        backgroundColor: item.backgroundColor,
        extendedProps: {   // Ensure color is in extendedProps
          color: isValidColor(item.color || "") ? item.color : theme?.theme?.primary,
          detail: item.detail,
          titleColor:item.titleColor,
          detailColor:item.detailColor,
          titleFontWeight:item.titleFontWeight,
          titleFontStyle:item.titleFontStyle,
          detailFontWeight:item.detailFontWeight,
          detailFontStyle:item.detailFontStyle,
          animation:item?.animation,
          animationDelay:item?.animationDelay,
          animationDuration:item?.animationDuration,
          animationIterationCount:item?.animationIterationCount
        }
      }));

      const mapData: Record<string, number> = {};
      eventsData?.forEach((item: any, index: number) => {
        mapData[`${item.id}`] = index;
      })

      const difference = differenceWith(eventsData, props.initialData, isEqual);
      const inserted = differenceBy(difference, Object.keys(initDataMap)?.map(id => ({ id })), 'id')
      const updated = filter(difference, obj => includes(Object.keys(initDataMap), String(obj.id)));
      const deleted = differenceBy(props.initialData, Object.keys(mapData)?.map(id => ({ id })), 'id')

      comp?.children?.comp?.children?.updatedEvents.dispatchChangeValueAction(updated);
      comp?.children?.comp?.children?.insertedEvents.dispatchChangeValueAction(inserted);
      comp?.children?.comp?.children?.deletedEvents.dispatchChangeValueAction(deleted);
    }, [initDataMap, currentView, props.initialData, initData.current]);

    const handleEventDataChange = useCallback((data: Array<EventType>) => {
      comp?.children?.comp.children.events.children.manual.children.manual.dispatch(
        comp?.children?.comp.children.events.children.manual.children.manual.setChildrensAction(
          data
        )
      );
      comp?.children?.comp.children.events.children.mapData.children.data.dispatchChangeValueAction(
        JSON.stringify(data)
      );

      findUpdatedInsertedDeletedEvents(data);

      props.onEvent("change");
    }, [comp, props.onEvent]);

    const renderEventContent = useCallback((eventInfo: EventContentArg) => {
      const isList = eventInfo.view.type === "listWeek";
      let sizeClass = "";
      if (
        [ViewType.WEEK, ViewType.DAY].includes(eventInfo.view.type as ViewType)
      ) {
        const duration = dayjs(eventInfo.event.end).diff(
          dayjs(eventInfo.event.start),
          "minutes"
        );
        if (duration <= 30 || eventInfo.event.allDay) {
          sizeClass = "small";
        } else if (duration <= 60) {
          sizeClass = "middle";
        } else {
          sizeClass = "large";
        }
      }
      const stateClass =
        dayjs().isAfter(dayjs(eventInfo.event.end)) &&
        (eventInfo.view.type as ViewType) !== ViewType.MONTH
          ? "past"
          : "";
      return (
        <Suspense fallback={null}>
          <Tooltip
            title={eventInfo?.event?.extendedProps?.detail}
            open={
              isList
              && Boolean(eventInfo?.event?.extendedProps?.detail)
              && hoverEventId === eventInfo.event.id
            }
          >
            <Event
              className={`event ${sizeClass} ${stateClass}`}
              theme={theme?.theme}
              $isList={isList}
              $allDay={Boolean(props.showAllDay)}
              $style={props.style}
              $backgroundColor={eventInfo.backgroundColor}
              $extendedProps={eventInfo?.event?.extendedProps}
            >
              <div className="event-time">{eventInfo?.timeText}</div>
              <div className="event-title">{eventInfo?.event?.title }</div>
              {!isList && <div className="event-detail">{eventInfo?.event?.extendedProps?.detail}</div>}
              <Remove
                $isList={isList}
                className="event-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  const events = props.events.filter(
                    (item: EventType) => item.id !== eventInfo.event.id
                  );
                  handleEventDataChange(events);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <CalendarDeleteIcon />
              </Remove>
            </Event>
          </Tooltip>
        </Suspense>
      );
    }, [
      theme,
      props.style,
      props.events,
      props.showAllDay,
      handleEventDataChange,
    ]);

    const showModal = useCallback((event: EventType, ifEdit: boolean) => {
      if (!modalInstance) return;

      const modalTitle = ifEdit
        ? trans("calendar.editEvent")
        : trans("calendar.creatEvent");
      if (form) {
        const eventData = {
          ...event,
          start: Boolean(event.start) ? dayjs(event.start, props.inputFormat): null,
          end: Boolean(event.end) ? dayjs(event.end, props.inputFormat): null,
        }
        form.setFieldsValue(eventData)
      }
      const eventId = editEvent.current?.id;

      CustomModal.confirm({
        title: modalTitle,
        customStyles: {
          backgroundColor:props?.modalStyle?.background,
          animationStyle:props?.animationStyle,
        },
        width: "450px",
        content: (
          <Tabs defaultActiveKey="1">
            <Tabs.TabPane tab={trans("calendar.general")} key="1">
              <FormWrapper form={form} $modalStyle={props.modalStyle}>
                <Form.Item
                  label={
                    <Tooltip title={trans("calendar.eventIdTooltip")}>
                      {trans("calendar.eventId")}
                    </Tooltip>
                  }
                  name="id"
                  rules={[
                    { required: true, message: trans("calendar.eventIdRequire") },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label={trans("calendar.eventName")}
                  name="label"
                  rules={[
                    { required: true, message: trans("calendar.eventNameRequire") },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label={trans("calendar.eventdetail")}
                  name="detail"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label={trans("calendar.eventGroupId")}
                  name="groupId"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label={trans("calendar.eventResourceId")}
                  name="resourceId"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label={trans("calendar.eventStartTime")}
                  name="start"
                >
                  <DatePicker
                    showTime
                    format={props.inputFormat}
                    popupStyle={{zIndex: 2050}}
                  />
                </Form.Item>
                <Form.Item
                  label={trans("calendar.eventEndTime")}
                  name="end"
                >
                  <DatePicker
                    showTime
                    format={props.inputFormat}
                    popupStyle={{zIndex: 2050}}
                  />
                </Form.Item>
                <Form.Item
                  label={trans("calendar.eventAllDay")}
                  name="allDay"
                >
                  <Switch />
                </Form.Item>
              </FormWrapper>
            </Tabs.TabPane>
            <Tabs.TabPane tab={trans("calendar.colorStyles")} key="2">
              <FormWrapper form={form} $modalStyle={props.modalStyle}>
                <Form.Item
                  label={trans("calendar.eventTitleColor")}
                  name="titleColor"
                >
                  <ColorPicker
                    getPopupContainer={(node: any) => node.parentNode}
                    defaultValue={form.getFieldValue('titleColor')}
                    showText
                    allowClear
                    format="hex"
                    onChange={(_, hex) => form.setFieldValue('titleColor', hex)}
                  />
                </Form.Item>
                <Form.Item
                  label={trans("calendar.eventdetailColor")}
                  name="detailColor"
                >
                  <ColorPicker
                    getPopupContainer={(node: any) => node.parentNode}
                    defaultValue={form.getFieldValue('detailColor')}
                    showText
                    allowClear
                    format="hex"
                    onChange={(_, hex) => form.setFieldValue('detailColor', hex)}
                  />
                </Form.Item>
                <Form.Item
                  label={trans("calendar.eventColor")}
                  name="color"
                >
                  <ColorPicker
                    getPopupContainer={(node: any) => node.parentNode}
                    defaultValue={form.getFieldValue('color')}
                    showText
                    allowClear
                    format="hex"
                    onChange={(_, hex) => form.setFieldValue('color', hex)}
                  />
                </Form.Item>
                <Form.Item
                  label={trans("calendar.eventBackgroundColor")}
                  name="backgroundColor"
                >
                  <ColorPicker
                    getPopupContainer={(node: any) => node.parentNode}
                    defaultValue={form.getFieldValue('backgroundColor')}
                    showText
                    allowClear
                    format="hex"
                    onChange={(_, hex) => form.setFieldValue('backgroundColor', hex)}
                  />
                </Form.Item>
              </FormWrapper>
            </Tabs.TabPane>
            <Tabs.TabPane tab={trans("calendar.fontStyles")} key="3">
              <FormWrapper form={form} $modalStyle={props.modalStyle}>
                <Form.Item
                  label={trans("calendar.eventTitleFontWeight")}
                  name="titleFontWeight"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label={trans("calendar.eventTitleFontStyle")}
                  name="titleFontStyle"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label={trans("calendar.eventdetailFontWeight")}
                  name="detailFontWeight"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label={trans("calendar.eventdetailFontStyle")}
                  name="detailFontStyle"
                >
                  <Input />
                </Form.Item>
              </FormWrapper>
            </Tabs.TabPane>
            <Tabs.TabPane tab={trans("calendar.animations")} key="4">
              <FormWrapper form={form} $modalStyle={props.modalStyle}>
                <Form.Item
                  label={trans("calendar.animationType")}
                  name="animation"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label={trans("calendar.animationDelay")}
                  name="animationDelay"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label={trans("calendar.animationDuration")}
                  name="animationDuration"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label={trans("calendar.animationIterationCount")}
                  name="animationIterationCount"
                >
                  <Input />
                </Form.Item>
              </FormWrapper>
            </Tabs.TabPane>
          </Tabs>
        ),
        onConfirm: () => {
          form.submit();
          return form.validateFields().then(() => {
            const {
              id,
              label = "",
              detail,
              groupId,
              resourceId,
              color,
              backgroundColor,
              titleColor,
              detailColor,
              titleFontWeight,
              titleFontStyle,
              detailFontWeight,
              detailFontStyle,
              animation,
              animationDelay,
              animationDuration,
              animationIterationCount,
              start,
              end,
              allDay,
            } = form.getFieldsValue();
            const idExist = props.events.findIndex(
              (item: EventType) => item.id === id
            );
            if (idExist > -1 && id !== eventId) {
              form.setFields([
                { name: "id", errors: [trans("calendar.eventIdExist")] },
              ]);
              throw new Error();
            }
            if (ifEdit) {
              const changeEvents = props.events.map((item: EventType) => {
                if (item.id === eventId) {
                  return {
                    ...item,
                    label,
                    detail,
                    id,
                    start: dayjs(start, DateParser).format(),
                    end: dayjs(end, DateParser).format(),
                    allDay,
                    ...(groupId !== undefined ? { groupId } : null),
                    ...(resourceId !== undefined ? { resourceId } : null),
                    ...(color !== undefined ? { color } : null),
                    ...(backgroundColor !== undefined ? { backgroundColor } : null),
                    ...(titleColor !== undefined ? { titleColor } : null),
                    ...(detailColor !== undefined ? { detailColor } : null),
                    ...(titleFontWeight !== undefined ? { titleFontWeight } : null),
                    ...(titleFontStyle !== undefined ? { titleFontStyle } : null),
                    ...(detailFontWeight !== undefined ? { detailFontWeight } : null),
                    ...(detailFontStyle !== undefined ? { detailFontStyle } : null),
                    ...(animation !== undefined ? { animation } : null),
                    ...(animationDelay !== undefined ? { animationDelay } : null),
                    ...(animationDuration !== undefined ? { animationDuration } : null),
                    ...(animationIterationCount !== undefined ? { animationIterationCount } : null),
                  };
                } else {
                  return item;
                }
              });
              handleEventDataChange(changeEvents);
            } else {
              const createInfo = {
                allDay: allDay,
                start: dayjs(start, DateParser).format(),
                end: dayjs(end, DateParser).format(),
                id,
                label,
                detail,
                titleFontWeight,
                titleFontStyle,
                detailFontWeight,
                detailFontStyle,
                animation,
                animationDelay,
                animationDuration,
                animationIterationCount,
                ...(groupId !== undefined ? { groupId } : null),
                ...(resourceId !== undefined ? { resourceId } : null),
                ...(color !== undefined ? { color } : null),
                ...(backgroundColor !== undefined ? { backgroundColor } : null),
                ...(titleColor !== undefined ? { titleColor } : null),
                ...(detailColor !== undefined ? { detailColor } : null),
              };
              handleEventDataChange([...props.events, createInfo]);
            }
            form.resetFields();
          }); //small change
        },
        onCancel: () => {
          form.resetFields();
        },
      });
    }, [
      form,
      editEvent,
      props.events,
      props?.modalStyle,
      props?.animationStyle,
      handleEventDataChange,
    ]); 

    const handleDbClick = useCallback(() => {
      const event = props.events.find(
        (item: EventType) => item.id === editEvent.current?.id
      ) as EventType;
      if (!props.editable || !editEvent.current) {
        return;
      }
      if (event) {
        showModal(event, true);
      } else {
        if (onEventVal && onEventVal.some((e: any) => e.name === 'doubleClick')) {
          // Check if 'doubleClick' is included in the array
          props.onEvent('doubleClick');
        } else {
          showModal(editEvent.current as EventType, false);
        }
      }
    }, [
      editEvent,
      props.events,
      props.editable,
      onEventVal,
      showModal,
    ]);

    const handleCreate = useCallback((info: DateSelectArg) => {
      const event = {
        allDay: info.allDay,
        start: info.startStr,
        end: info.endStr,
      } as EventType;
      const view = info.view.type as ViewType;
      const duration = dayjs(info.end).diff(dayjs(info.start), "minutes");
      const singleClick =
        (view === ViewType.MONTH && duration === 1440) ||
        ([ViewType.WEEK, ViewType.DAY].includes(view) && duration === 30) ||
        (info.allDay && duration === 1440);
      if (singleClick) {
        editEvent.current = event;
        setTimeout(() => {
          editEvent.current = undefined;
        }, 500);
        return;
      }
      showModal(event, false);
    }, [editEvent, showModal]);

    const updateEventsOnDragOrResize = useCallback((eventInfo: EventImpl) => {
      const {extendedProps, title, ...event} = eventInfo.toJSON();

      let eventsList = [...props.events];
      const eventIdx = eventsList.findIndex(
        (item: EventType) => item.id === event.id
      );
      if (eventIdx > -1) {
        eventsList[eventIdx] = {
          label: title,
          ...event,
          ...extendedProps,
        };
        handleEventDataChange(eventsList);
      }
    }, [props.events, handleEventDataChange]);

    const handleDrop = useCallback((eventInfo: EventDropArg) => {
      updateEventsOnDragOrResize(eventInfo.event);

      if (typeof props.onDropEvent === 'function') {
        props.onDropEvent("drop");
      }
    }, [props.onDropEvent, updateEventsOnDragOrResize]);

    const handleResize = useCallback((eventInfo: EventResizeDoneArg) => {
      updateEventsOnDragOrResize(eventInfo.event);
    }, [props.onDropEvent, updateEventsOnDragOrResize]);

    return (
      <Wrapper
        ref={ref}
        $editable={props.editable}
        $style={props.style}
        $theme={theme?.theme}
        $showVerticalScrollbar={props.showVerticalScrollbar}
        onDoubleClick={handleDbClick}
        $left={left}
        key={initialDate ? currentView + initialDate : currentView}
      >
        <ErrorBoundary>
          <FullCalendar
            slotEventOverlap={false}
            events={ events }
            dayHeaders={true}
            // dayHeaderFormat={{ weekday: 'short', month: 'numeric', day: 'numeric', omitCommas: true }}
            expandRows={true}
            multiMonthMinWidth={250}
            nowIndicator={true}
            height={"100%"}
            locale={getCalendarLocale()}
            locales={allLocales}
            firstDay={Number(props.firstDay)}
            plugins={filteredPlugins}
            headerToolbar={toolBar}
            resourceAreaHeaderContent={props.resourceName}
            buttonText={buttonText}
            schedulerLicenseKey={props.licenseKey}
            views={views}
            resources={ currentView == "resourceTimelineDay" || currentView == "resourceTimeGridDay" ? resources : [] }
            eventClassNames={() => (!props.showEventTime ? "no-time" : "")}
            slotLabelFormat={currentSlotLabelFormat}
            viewClassNames={viewClassNames}
            moreLinkText={trans("calendar.more")}
            initialDate={initialDate}
            initialView={currentView}
            editable={props.editable}
            selectable={props.editable}
            datesSet={handleDatesSet}
            selectMirror={false}
            displayEventTime={props.showEventTime}
            dayMaxEvents={props.dayMaxEvents}
            eventMaxStack={props.eventMaxStack || undefined}
            weekends={props.showWeekends}
            allDaySlot={props.showAllDay}
            eventContent={renderEventContent}
            select={(info) => handleCreate(info)}
            eventClick={(info) => {
              const event = events.find(
                (item: EventType) => item.id === info.event.id
              );
              editEvent.current = event;
              setTimeout(() => {
                editEvent.current = undefined;
              }, 500);
            }}
            moreLinkClick={(info) => {
              let left = 0;
              const ele = info.jsEvent.target as HTMLElement;
              if (info.view.type === ViewType.DAY) {
                if (info.allDay) {
                  left = ele.offsetParent?.parentElement?.offsetLeft || 0;
                } else {
                  left = ele.parentElement?.offsetLeft || 0;
                }
              } else {
                if (info.allDay) {
                  left =
                    ele.offsetParent?.parentElement?.parentElement?.offsetLeft ||
                    0;
                } else {
                  left =
                    ele.offsetParent?.parentElement?.parentElement?.parentElement
                      ?.offsetLeft || 0;
                }
              }
              setLeft(left);
            }}
            eventsSet={(info) => {
              let needChange = false;
              let changeEvents: EventType[] = [];
              info.forEach((item) => {
                const event = events.find((i: EventType) => i.id === item.id);
                const start = dayjs(item.start, DateParser).format();
                const end = dayjs(item.end, DateParser).format();
                if (
                  start !== event?.start ||
                  end !== event?.end ||
                  !!item.allDay !== !!event?.allDay
                ) {
                  needChange = true;
                  changeEvents.push({
                    ...event,
                    allDay: item.allDay,
                    start: item.startStr,
                    end: item.endStr,
                  });
                } else {
                  changeEvents.push(event);
                }
              });
              // if (needChange) {
              //   props.onEvent("change");
              // }
            }}
            eventDragStart={() => {
              if (typeof props.onDropEvent === 'function') {
                props.onDropEvent("drag");
              }
            }}
            eventDrop={handleDrop}
            eventResize={handleResize}
            eventMouseEnter={({event}) => setHoverEvent(event.id)}
            eventMouseLeave={({event}) => setHoverEvent(undefined)}
          />
        </ErrorBoundary>
      </Wrapper>
    );
  })
    .setPropertyViewFn((children: { 
      events: { propertyView: (arg0: {}) => any; }; 
      resources: { propertyView: (arg0: {}) => any; };
      resourceName: { propertyView: (arg0: {}) => any; };
      onEvent: { propertyView: ({title}?: {title?: string}) => any; }; 
      onDropEvent: { propertyView: ({title}?: {title?: string}) => any; };
      editable: { propertyView: (arg0: { label: string; }) => any; };
      showEventTime: { propertyView: (arg0: { label: string; tooltip: string; }) => any; }; 
      showWeekends: { propertyView: (arg0: { label: string; }) => any; }; 
      showAllDay: { propertyView: (arg0: { label: string; tooltip: string; }) => any; }; 
      defaultDate: { propertyView: (arg0: { label: string; tooltip: string; }) => any; }; 
      firstDay: { propertyView: (arg0: { label: string; }) => any; }; 
      dayMaxEvents: { propertyView: (arg0: { label: string; tooltip: string; }) => any; }; 
      eventMaxStack: { propertyView: (arg0: { label: string; tooltip: string; }) => any; }; 
      currentFreeView: { propertyView: (arg0: { label: string; tooltip: string; }) => any; }; 
      currentPremiumView: { propertyView: (arg0: { label: string; tooltip: string; }) => any; }; 
      style: { getPropertyView: () => any; };
      animationStyle:  { getPropertyView: () => any; };
      modalStyle: { getPropertyView: () => any; };
      licenseKey: { getView: () => any; propertyView: (arg0: { label: string; }) => any; };
      showVerticalScrollbar: { propertyView: (arg0: { label: string; }) => any; };
      showResourceEventsInFreeView: { propertyView: (arg0: { label: string; }) => any; };
      inputFormat: { propertyView: (arg0: {}) => any; };
    }) => {
      const license = children.licenseKey.getView();
      
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.defaultDate.propertyView({ label: trans("calendar.defaultDate"), tooltip: trans("calendar.defaultDateTooltip"), })}
            {controlItem({filterText: 'events'}, (
              <p style={{fontSize: '13px', marginTop: '10px'}}>{trans("calendar.events")}</p>
            ))}
            {children.events.propertyView({
              title: "Events",
              newOptionLabel: "Event",
            })}
          </Section>
          { license != "" && 
            <Section name={trans("calendar.resources")}>
              {children.resourceName.propertyView({label: trans("calendar.resourcesName")})}
              {children.resources.propertyView({label: trans("calendar.resources")})}
            </Section>
          }
          <Section name={sectionNames.interaction}>
            {hiddenPropertyView(children)}
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {children.onEvent.propertyView()}
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {children.onDropEvent?.propertyView({title: trans("calendar.dragDropEventHandlers")})}
            </div>
            {children.editable.propertyView({ label: trans("calendar.editable"), })}
          </Section>
          <Section name={sectionNames.advanced}>
            {children.showEventTime.propertyView({ label: trans("calendar.showEventTime"), tooltip: trans("calendar.showEventTimeTooltip"), })}
            {children.showWeekends.propertyView({ label: trans("calendar.showWeekends"), })}
            {children.showAllDay.propertyView({ label: trans("calendar.showAllDay"), tooltip: trans("calendar.showAllDayTooltip"), })}
            {children.dayMaxEvents.propertyView({ label: trans("calendar.dayMaxEvents"), tooltip: trans("calendar.dayMaxEventsTooltip"), })}
            {children.eventMaxStack.propertyView({ label: trans("calendar.eventMaxStack"), tooltip: trans("calendar.eventMaxStackTooltip"), })}
          </Section>
          <Section name={sectionNames.layout}>
            {children.inputFormat.propertyView({
              label: trans("calendar.inputFormat"),
              placeholder: DATE_TIME_FORMAT,
              tooltip: (
                <>
                  {trans("calendar.reference")} &nbsp;
                  <a
                    href={`https://day.js.org/docs/en/display/format`}
                    target={"_blank"}
                    rel="noreferrer"
                  >
                    dayjs format
                  </a>
                </>
              ),
            })}
            {children.licenseKey.propertyView({ label: trans("calendar.license"), tooltip: trans("calendar.licenseTooltip"), })}
            {license == ""
              ? children.currentFreeView.propertyView({ label: trans("calendar.defaultView"), tooltip: trans("calendar.defaultViewTooltip"), })
              : children.currentPremiumView.propertyView({ label: trans("calendar.defaultView"), tooltip: trans("calendar.defaultViewTooltip"), })}
            {children.firstDay.propertyView({ label: trans("calendar.startWeek"), })}
            {children.showVerticalScrollbar.propertyView({ label: trans("calendar.showVerticalScrollbar")})}
            {Boolean(license) && children.showResourceEventsInFreeView.propertyView({ label: trans("calendar.showResourceEventsInFreeView")})}
          </Section>
          <Section name={sectionNames.style}>
            {children.style.getPropertyView()}
          </Section>
          <Section name={sectionNames.animationStyle} hasTooltip={true}>{children.animationStyle.getPropertyView()}</Section>
          {Boolean(children.modalStyle) && (
            <Section name={sectionNames.modalStyle}>
              {children.modalStyle.getPropertyView()}
            </Section>
          )}
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

CalendarBasicComp = migrateOldData(CalendarBasicComp, fixOldData)

const TmpCalendarComp = withExposingConfigs(CalendarBasicComp, [
  NameConfigHidden,
  new NameConfig("resources", trans("calendar.resources")),
  depsConfig({
    name: "allEvents",
    desc: trans("calendar.events"),
    depKeys: ["events"],
    func: (input: { events: any[]; }) => {
      return input.events;
    },
  }),
  depsConfig({
    name: "events",
    desc: trans("calendar.events"),
    depKeys: ["events"],
    func: (input: { events: any[]; }) => {
      return input.events.filter(event => !Boolean(event.resourceId));
    },
  }),
  depsConfig({
    name: "resourcesEvents",
    desc: trans("calendar.resourcesEvents"),
    depKeys: ["events"],
    func: (input: { events: any[]; }) => {
      return input.events.filter(event => Boolean(event.resourceId));
    },
  }),
  depsConfig({
    name: "toUpdatedEvents",
    desc: trans("calendar.updatedEvents"),
    depKeys: ["updatedEvents"],
    func: (input: { updatedEvents: any[]; }) => {
      return input.updatedEvents;
    },
  }),
  depsConfig({
    name: "toInsertedEvents",
    desc: trans("calendar.insertedEvents"),
    depKeys: ["insertedEvents"],
    func: (input: { insertedEvents: any[]; }) => {
      return input.insertedEvents;
    },
  }),
  depsConfig({
    name: "toDeletedEvents",
    desc: trans("calendar.deletedEvents"),
    depKeys: ["deletedEvents"],
    func: (input: { deletedEvents: any[]; }) => {
      return input.deletedEvents;
    },
  }),
]);

let CalendarComp = withMethodExposing(TmpCalendarComp, [

      /* this is not backwards compatible with older versions of the SDK
      {
          method: {
              name: "setCalendarView",
              detail: "Sets the view of the calendar to a specified type",
              params: [{ name: "viewType", type: "string" }],
          },
          execute: (comp, values) => {
              const viewType = values[0] as string || "timeGridWeek"; // Default to "timeGridWeek" if undefined
              const viewKey = comp.children.licenseKey.getView() === "" ? 'currentFreeView' : 'currentPremiumView';
              comp.children[viewKey].dispatchChangeValueAction(viewType);
          }
      },*/


        {
          method: {
            name: "setResourceTimeGridDayView",
            detail: "Switches the calendar view to 'Resource Time Grid Day', which displays resources along the vertical axis and the hours of a single day along the horizontal axis.",
            params: [{ name: "viewType", type: "string" }],
        },
          execute: (comp) => {
            const viewKey = comp.children.licenseKey.getView() === "" ? 'currentFreeView' : 'currentPremiumView';
            comp.children[viewKey].dispatchChangeValueAction("resourceTimeGridDay");
          }
        },
        {
          method: {
            name: "setResourceTimelineDayView",
            detail: "Switches the calendar view to 'Resource Timeline Day', showing events against a timeline for a single day, segmented by resources.",
            params: [{ name: "viewType", type: "string" }],
        },
          execute: (comp) => {
            const viewKey = comp.children.licenseKey.getView() === "" ? 'currentFreeView' : 'currentPremiumView';
            comp.children[viewKey].dispatchChangeValueAction("resourceTimelineDay");
          }
        },
        {
          method: {
            name: "setDayGridWeekView",
            detail: "Switches the calendar view to 'Day Grid Week', where the days of the week are displayed as columns and events are laid out in grid form.",
            params: [{ name: "viewType", type: "string" }],
        },
          execute: (comp) => {
            const viewKey = comp.children.licenseKey.getView() === "" ? 'currentFreeView' : 'currentPremiumView';
            comp.children[viewKey].dispatchChangeValueAction("dayGridWeek");
          }
        },
        {
          method: {
            name: "setTimeGridWeekView",
            detail: "Switches the calendar view to 'Day Grid Week', where the days of the week are displayed as columns and events are laid out in grid form.",
            params: [{ name: "viewType", type: "string" }],
        },
          execute: (comp) => {
            const viewKey = comp.children.licenseKey.getView() === "" ? 'currentFreeView' : 'currentPremiumView';
            comp.children[viewKey].dispatchChangeValueAction("timeGridWeek");
          }
        },
        {
          method: {
            name: "setTimeGridDayView",
            detail: "Switches the calendar view to 'Time Grid Day', which shows a detailed hourly schedule for a single day.",
            params: [{ name: "viewType", type: "string" }],
        },
          execute: (comp) => {
            const viewKey = comp.children.licenseKey.getView() === "" ? 'currentFreeView' : 'currentPremiumView';
            comp.children[viewKey].dispatchChangeValueAction("timeGridDay");
          }
        },
        {
          method: {
            name: "setDayGridDayView",
            detail: "Switches the calendar view to 'Day Grid Day', displaying a single day in a grid layout that includes all events for that day.",
            params: [{ name: "viewType", type: "string" }],
        },
          execute: (comp) => {
            const viewKey = comp.children.licenseKey.getView() === "" ? 'currentFreeView' : 'currentPremiumView';
            comp.children[viewKey].dispatchChangeValueAction("dayGridDay");
          }
        },
        {
          method: {
            name: "setListWeekView",
            detail: "Switches the calendar view to 'List Week', which provides a list-style overview of all events happening throughout the week.",
            params: [{ name: "viewType", type: "string" }],
        },
          execute: (comp) => {
            const viewKey = comp.children.licenseKey.getView() === "" ? 'currentFreeView' : 'currentPremiumView';
            comp.children[viewKey].dispatchChangeValueAction("listWeek");
          }
        },
        {
          method: {
            name: "setDayGridMonthView",
            detail: "Switches the calendar view to 'Day Grid Month', presenting the entire month in a grid with events displayed on their respective days.",
            params: [{ name: "viewType", type: "string" }],
        },
          execute: (comp) => {
            const viewKey = comp.children.licenseKey.getView() === "" ? 'currentFreeView' : 'currentPremiumView';
            comp.children[viewKey].dispatchChangeValueAction("dayGridMonth");
          }
        },
        {
          method: {
            name: "setMultiMonthYearView",
            detail: "Switches the calendar view to 'Multi Month Year', showing multiple months at once, allowing for long-term planning and overview.",
            params: [{ name: "viewType", type: "string" }],
        },
          execute: (comp) => {
            const viewKey = comp.children.licenseKey.getView() === "" ? 'currentFreeView' : 'currentPremiumView';
            comp.children[viewKey].dispatchChangeValueAction("multiMonthYear");
          }
        },
        {
          method: {
            name: "clearUpdatedEvents",
            detail: "Clear updated events list",
            params: [],
        },
          execute: (comp) => {
            comp?.children?.updatedEvents.dispatch(
              comp?.children?.updatedEvents.changeValueAction([])
            );
          }
        },
        {
          method: {
            name: "clearInsertedEvents",
            detail: "Clear inserted events list",
            params: [],
        },
          execute: (comp) => {
            comp?.children?.insertedEvents.dispatch(
              comp?.children?.insertedEvents.changeValueAction([])
            );
          }
        },
        {
          method: {
            name: "clearDeletedEvents",
            detail: "Clear deleted events list",
            params: [],
        },
          execute: (comp) => {
            comp?.children?.deletedEvents.dispatch(
              comp?.children?.deletedEvents.changeValueAction([])
            );
          }
        },
  ]);


export { CalendarComp };

