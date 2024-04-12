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
  jsonValueStateControl,
  Tooltip,
} from "lowcoder-sdk";
import { default as Form } from "antd/es/form";
import { default as Input } from "antd/es/input";
import { trans, getCalendarLocale } from "../../i18n/comps";
import { createRef, useContext, useRef, useState } from "react";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import adaptivePlugin from "@fullcalendar/adaptive";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import multiMonthPlugin from '@fullcalendar/multimonth';
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import allLocales from "@fullcalendar/core/locales-all";
import { EventContentArg, DateSelectArg } from "@fullcalendar/core";
import momentPlugin from "@fullcalendar/moment";

import ErrorBoundary from "./errorBoundary";

import {
  DefaultWithFreeViewOptions,
  DefaultWithPremiumViewOptions,
  FirstDayOptions,
  Wrapper,
  Event,
  Remove,
  EventType,
  defaultData,
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
  resourcesEventsDefaultData,
  resourceTimeLineHeaderToolbar,
  resourceTimeGridHeaderToolbar,
} from "./calendarConstants";
import dayjs from "dayjs";
 
const childrenMap = {
  events: jsonValueExposingStateControl("events", defaultData),
  resourcesEvents: jsonValueExposingStateControl("resourcesEvents", resourcesEventsDefaultData),
  resources: jsonValueExposingStateControl("resources", resourcesDefaultData),
  onEvent: ChangeEventHandlerControl,
  resourceName: withDefault(StringControl, trans("calendar.resourcesDefault")),
  editable: withDefault(BoolControl, true),
  defaultDate: withDefault(StringControl, "{{ new Date() }}"),
  defaultFreeView: dropdownControl(DefaultWithFreeViewOptions, "timeGridWeek"),
  defaultPremiumView: dropdownControl(DefaultWithPremiumViewOptions, "resourceTimelineDay"),
  firstDay: dropdownControl(FirstDayOptions, "1"),
  showEventTime: withDefault(BoolControl, true),
  showWeekends: withDefault(BoolControl, true),
  showAllDay: withDefault(BoolControl, true),
  dayMaxEvents: withDefault(NumberControl, 2),
  eventMaxStack: withDefault(NumberControl, 0),
  style: styleControl(CalendarStyle),
  licenceKey: withDefault( StringControl, "" ),
};

let CalendarBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props: { events?: any; style: any; onEvent?: any; resourcesEvents?: any; resources?: any; defaultDate?: any; defaultFreeView?: any; defaultPremiumView?: any; showEventTime?: any; showWeekends?: any; showAllDay?: any; dayMaxEvents?: any; eventMaxStack?: any; firstDay?: any; editable?: any; licenceKey?: string; resourceName : string }) => {
    const theme = useContext(ThemeContext);
    const ref = createRef<HTMLDivElement>();
    const editEvent = useRef<EventType>();
    const [form] = Form.useForm();
    const [left, setLeft] = useState<number | undefined>(undefined);

    const events = props.events.value.map((item: EventType) => {
      return {
        title: item.title,
        id: item.id,
        start: dayjs(item.start, DateParser).format(),
        end: dayjs(item.end, DateParser).format(),
        allDay: item.allDay,
        resourceId: item.resourceId ? item.resourceId : null,
        color: isValidColor(item.color || "")
          ? item.color
          : theme?.theme?.primary,
        ...(item.groupId ? { groupId: item.groupId } : null),
      };
    });

    const resources = props.resources.value;

    const resourcesEvents = props.resourcesEvents.value.map((item: EventType) => {
      return {
        title: item.title,
        id: item.id,
        start: dayjs(item.start, DateParser).format(),
        end: dayjs(item.end, DateParser).format(),
        allDay: item.allDay,
        resourceIds: item.resourceId ? [item.resourceId] : [],
        color: isValidColor(item.color || "")
          ? item.color
          : theme?.theme?.primary,
        ...(item.groupId ? { groupId: item.groupId } : null),
      };
    });

    let {
      defaultDate,
      defaultFreeView,
      defaultPremiumView,
      showEventTime,
      showWeekends,
      showAllDay,
      dayMaxEvents,
      eventMaxStack,
      style,
      firstDay,
      editable,
      licenceKey,
      resourceName,
    } = props;

    function renderEventContent(eventInfo: EventContentArg) {
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
        <Event
          className={`event ${sizeClass} ${stateClass}`}
          bg={eventInfo.backgroundColor}
          theme={theme?.theme}
          isList={isList}
          allDay={showAllDay}
          $style={props.style}
        >
          <div className="event-time">{eventInfo.timeText}</div>
          <div className="event-title">{eventInfo.event.title}</div>
          <Remove
            isList={isList}
            className="event-remove"
            onClick={(e) => {
              e.stopPropagation();
              props.onEvent("change");
              const event = events.filter(
                (item: EventType) => item.id !== eventInfo.event.id
              );
              props.events.onChange(event);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <CalendarDeleteIcon />
          </Remove>
        </Event>
      );
    }

    const handleDbClick = () => {
      const event = props.events.value.find(
        (item: EventType) => item.id === editEvent.current?.id
      ) as EventType;
      if (!editable || !editEvent.current) {
        return;
      }
      if (event) {
        const { title, groupId, color, id } = event;
        const eventInfo = {
          title,
          groupId,
          color,
          id,
        };
        showModal(eventInfo, true);
      } else {
        showModal(editEvent.current, false);
      }
    };

    const handleCreate = (info: DateSelectArg) => {
      const event = {
        allDay: info.allDay,
        start: info.startStr,
        end: info.endStr,
      };
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
    };

    const showModal = (event: EventType, ifEdit: boolean) => {
      const modalTitle = ifEdit
        ? trans("calendar.editEvent")
        : trans("calendar.creatEvent");
      form && form.setFieldsValue(event);
      const eventId = editEvent.current?.id;
      CustomModal.confirm({
        title: modalTitle,
        content: (
          <FormWrapper form={form}>
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
              name="title"
              rules={[
                { required: true, message: trans("calendar.eventNameRequire") },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item label={trans("calendar.eventColor")} name="color">
              <Input />
            </Form.Item>
            <Form.Item
              label={
                <Tooltip title={trans("calendar.groupIdTooltip")}>
                  {trans("calendar.eventGroupId")}
                </Tooltip>
              }
              name="groupId"
            >
              <Input />
            </Form.Item>
          </FormWrapper>
        ),
        onConfirm: () => {
          form.submit();
          return form.validateFields().then(() => {
            const { id, groupId, color, title = "" } = form.getFieldsValue();
            const idExist = props.events.value.findIndex(
              (item: EventType) => item.id === id
            );
            if (idExist > -1 && id !== eventId) {
              form.setFields([
                { name: "id", errors: [trans("calendar.eventIdExist")] },
              ]);
              throw new Error();
            }
            if (ifEdit) {
              const changeEvents = props.events.value.map((item: EventType) => {
                if (item.id === eventId) {
                  return {
                    ...item,
                    title,
                    id,
                    ...(groupId !== undefined ? { groupId } : null),
                    ...(color !== undefined ? { color } : null),
                  };
                } else {
                  return item;
                }
              });
              props.events.onChange(changeEvents);
            } else {
              const createInfo = {
                allDay: event.allDay,
                start: event.start,
                end: event.end,
                id,
                title,
                ...(groupId !== undefined ? { groupId } : null),
                ...(color !== undefined ? { color } : null),
              };
              props.events.onChange([...props.events.value, createInfo]);
            }
            props.onEvent("change");
            form.resetFields();
          }); //small change
        },
        onCancel: () => {
          form.resetFields();
        },
      });
    };

    const toolBar = (defaultView: any) => {
      switch (defaultView) {
        case "resourceTimelineDay":
          return resourceTimeLineHeaderToolbar;
          break;
        case "resourceTimeGridDay":
          return resourceTimeGridHeaderToolbar;
          break;
        default:
          return headerToolbar;
          break;
      }
    };


    const [currentSlotLabelFormat, setCurrentSlotLabelFormat] = useState(slotLabelFormat);

    const handleDatesSet = (arg: { view: { type: any; }; }) => {
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
    };

    let initialDate = defaultDate;
    try {
      initialDate = new Date(defaultDate).toISOString();
    } catch (error) {
      initialDate = undefined;
    }
    let defaultView = defaultFreeView;
    if (licenceKey != "") { 
      defaultView = defaultPremiumView; 
    }
    
    const plugins = [
      dayGridPlugin,
      timeGridPlugin,
      interactionPlugin,
      listPlugin,
      momentPlugin,
      resourceTimelinePlugin,
      resourceTimeGridPlugin,
      adaptivePlugin,
      multiMonthPlugin,
    ];
    const filteredPlugins = plugins.filter((plugin) => {
      if (licenceKey === "") {
        return ![
          resourceTimelinePlugin,
          resourceTimeGridPlugin,
          adaptivePlugin,
        ].includes(plugin);
      } else {
        return true;
      }
    });

    return (
      <Wrapper
        ref={ref}
        $editable={editable}
        $style={style}
        $theme={theme?.theme}
        onDoubleClick={handleDbClick}
        $left={left}
        key={initialDate ? defaultView + initialDate : defaultView}
      >
        <ErrorBoundary>
          <FullCalendar
            slotEventOverlap={false}
            events={ defaultView == "resourceTimelineDay" || defaultView == "resourceTimeGridDay" ? resourcesEvents : events }
            dayHeaders={true}
            dayHeaderFormat={{ weekday: 'short', month: 'numeric', day: 'numeric', omitCommas: true }}
            expandRows={true}
            multiMonthMinWidth={250}
            nowIndicator={true}
            height={"100%"}
            locale={getCalendarLocale()}
            locales={allLocales}
            firstDay={Number(firstDay)}
            plugins={filteredPlugins}
            headerToolbar={toolBar(defaultView)}
            resourceAreaHeaderContent={resourceName}
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
            buttonText={buttonText}
            schedulerLicenseKey={licenceKey}
            views={views}
            resources={ defaultView == "resourceTimelineDay" || defaultView == "resourceTimeGridDay" ? resources : [] }
            eventClassNames={() => (!showEventTime ? "no-time" : "")}
            slotLabelFormat={currentSlotLabelFormat}
            viewClassNames={viewClassNames}
            moreLinkText={trans("calendar.more")}
            initialDate={initialDate}
            initialView={defaultView}
            editable={editable}
            selectable={editable}
            datesSet={handleDatesSet}
            selectMirror={false}
            displayEventTime={showEventTime}
            dayMaxEvents={dayMaxEvents}
            eventMaxStack={eventMaxStack || undefined}
            weekends={showWeekends}
            allDaySlot={showAllDay}
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
              if (needChange) {
                // props.events.onChange(changeEvents);
                props.onEvent("change");
              }
            }}
          />
        </ErrorBoundary>
      </Wrapper>
    );
  })
    .setPropertyViewFn((children: { 
      licenceKey: { getView: () => any; propertyView: (arg0: { label: string; }) => any; }; 
      events: { propertyView: (arg0: {}) => any; }; 
      resources: { propertyView: (arg0: {}) => any; }; 
      onEvent: { getPropertyView: () => any; }; 
      editable: { propertyView: (arg0: { label: string; }) => any; }; 
      defaultDate: { propertyView: (arg0: { label: string; tooltip: string; }) => any; }; 
      defaultFreeView: { propertyView: (arg0: { label: string; tooltip: string; }) => any; }; 
      defaultPremiumView: { propertyView: (arg0: { label: string; tooltip: string; }) => any; }; 
      firstDay: { propertyView: (arg0: { label: string; }) => any; }; 
      showEventTime: { propertyView: (arg0: { label: string; tooltip: string; }) => any; }; 
      showWeekends: { propertyView: (arg0: { label: string; }) => any; }; 
      showAllDay: { propertyView: (arg0: { label: string; tooltip: string; }) => any; }; 
      dayMaxEvents: { propertyView: (arg0: { label: string; tooltip: string; }) => any; }; 
      eventMaxStack: { propertyView: (arg0: { label: string; tooltip: string; }) => any; }; 
      style: { getPropertyView: () => any; }; 
      resourceName: { propertyView: (arg0: {}) => any; };
    }) => {
      
      let licence = children.licenceKey.getView();

      return (
        <>
          <Section name={sectionNames.basic}>
            {children.events.propertyView({})}
            {children.defaultDate.propertyView({ label: trans("calendar.defaultDate"), tooltip: trans("calendar.defaultDateTooltip"), })}
          </Section>
          <Section name={trans("calendar.resources")}>
            {licence == "" ? null : children.resources.propertyView({})}
            {licence == "" ? null : children.resourceName.propertyView({})}
          </Section>
          <Section name={sectionNames.interaction}>
            {hiddenPropertyView(children)}
            {children.onEvent.getPropertyView()}
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
            {children.licenceKey.propertyView({ label: trans("calendar.licence"), tooltip: trans("calendar.licenseTooltip"), })}
            {licence == ""
              ? children.defaultFreeView.propertyView({ label: trans("calendar.defaultView"), tooltip: trans("calendar.defaultViewTooltip"), })
              : children.defaultPremiumView.propertyView({ label: trans("calendar.defaultView"), tooltip: trans("calendar.defaultViewTooltip"), })}
            {children.firstDay.propertyView({ label: trans("calendar.startWeek"), })}
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

const TmpCalendarComp = withExposingConfigs(CalendarBasicComp, [
  new NameConfig("events", trans("calendar.events")),
  new NameConfig("resourcesEvents", trans("calendar.resourcesEvents")),
  new NameConfig("resources", trans("calendar.resources")),
  NameConfigHidden,
]);

export const CalendarComp = withMethodExposing(TmpCalendarComp, [
  {
    method: {
      name: "setCalendarView",
      description: "timeGridWeek || timeGridDay || dayGridMonth || listWeek || resourceTimelineDay || resourceTimeGridDay || resourceTimelineWeek || resourceTimelineMonth",
      params: [{ name: "viewType", type: "string" }],
    },
    execute: (comp, values) => {
      const viewType = values[0] as string;
      viewType == "" ? viewType : "timeGridWeek";
      return comp.children.licenceKey.getView() == "" ? comp.children.defaultFreeView.dispatchChangeValueAction(viewType) : comp.children.defaultPremiumView.dispatchChangeValueAction(viewType);
    }
  },
]);
