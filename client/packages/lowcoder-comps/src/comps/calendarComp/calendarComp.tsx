import { default as Form } from "antd/es/form";
import { default as Input } from "antd/es/input";
import { trans, getCalendarLocale } from "../../i18n/comps";
import { createRef, useContext, useRef, useState, useEffect } from "react";
import dayjs from "dayjs";
import FullCalendar from "@fullcalendar/react";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import adaptivePlugin from "@fullcalendar/adaptive";
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
  Tooltip
} from "lowcoder-sdk";

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

// this should ensure backwards compatibility with older versions of the SDK
const safeDragEventHandlerControl = typeof DragEventHandlerControl !== 'undefined' ? DragEventHandlerControl : () => {};
 
const childrenMap = {
  events: jsonValueExposingStateControl("events", defaultData),
  resourcesEvents: jsonValueExposingStateControl("resourcesEvents", resourcesEventsDefaultData),
  resources: jsonValueExposingStateControl("resources", resourcesDefaultData),
  resourceName: withDefault(StringControl, trans("calendar.resourcesDefault")),
  onEvent: ChangeEventHandlerControl,
  onDropEvent: safeDragEventHandlerControl,
  editable: withDefault(BoolControl, true),
  showEventTime: withDefault(BoolControl, true),
  showWeekends: withDefault(BoolControl, true),
  showAllDay: withDefault(BoolControl, true),
  defaultDate: withDefault(StringControl, "{{ new Date() }}"),
  firstDay: dropdownControl(FirstDayOptions, "1"),
  dayMaxEvents: withDefault(NumberControl, 2),
  eventMaxStack: withDefault(NumberControl, 0),
  style: styleControl(CalendarStyle),
  licenseKey: withDefault( StringControl, "" ),
  currentFreeView: dropdownControl(DefaultWithFreeViewOptions, "timeGridWeek"),
  currentPremiumView: dropdownControl(DefaultWithPremiumViewOptions, "resourceTimelineDay"),
};

let CalendarBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props: { 
    events: any; 
    resourcesEvents: any; 
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
  }) => {

    const theme = useContext(ThemeContext);
    const ref = createRef<HTMLDivElement>();
    const editEvent = useRef<EventType>();
    const [form] = Form.useForm(); 
    const [left, setLeft] = useState<number | undefined>(undefined);
    const [licensed, setLicensed] = useState<boolean>(props.licenseKey !== "");

    useEffect(() => {
      setLicensed(props.licenseKey !== "");
    }, [props.licenseKey]);

    let currentView = licensed ? props.currentPremiumView : props.currentFreeView;
    let currentEvents = currentView == "resourceTimelineDay" || currentView == "resourceTimeGridDay" ? props.resourcesEvents : props.events;

    console.log("currentEvents", currentEvents);

    // we use one central stack of events for all views
    let events = Array.isArray(currentEvents.value) ? currentEvents.value.map((item: EventType) => {
      return {
        title: item.title,
        id: item.id,
        start: dayjs(item.start, DateParser).format(),
        end: dayjs(item.end, DateParser).format(),
        allDay: item.allDay,
        resourceId: item.resourceId ? item.resourceId : null,
        color: isValidColor(item.color || "") ? item.color : theme?.theme?.primary,
        ...(item.groupId ? { groupId: item.groupId } : {}),
      };
    }) : [currentEvents.value];

    const resources = props.resources.value;

    // list all plugins for Fullcalendar
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

    // filter out premium plugins if not licensed
    const filteredPlugins = plugins.filter((plugin) => {
      if (!licensed) {
        return ![resourceTimelinePlugin, resourceTimeGridPlugin, adaptivePlugin].includes(plugin);
      }
      return true;
    });

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

    let initialDate: string | undefined;

    try {
      initialDate = new Date(props.defaultDate || Date.now()).toISOString();
    } catch (error) {
      initialDate = undefined;
    }

    let {
      showEventTime,
      showWeekends,
      showAllDay,
      dayMaxEvents,
      eventMaxStack,
      style,
      firstDay,
      editable,
      licenseKey,
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
          $bg={eventInfo.backgroundColor}
          theme={theme?.theme}
          $isList={isList}
          $allDay={Boolean(showAllDay)}
          $style={props.style}
        >
          <div className="event-time">{eventInfo.timeText}</div>
          <div className="event-title">{eventInfo.event.title}</div>
          <Remove
            $isList={isList}
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

    const handleDrop = () => {
      if (typeof props.onDropEvent === 'function') {
        props.onDropEvent("dropEvent");
      }
    };

    return (
      <Wrapper
        ref={ref}
        $editable={editable}
        $style={style}
        $theme={theme?.theme}
        onDoubleClick={handleDbClick}
        $left={left}
        key={initialDate ? currentView + initialDate : currentView}
      >
        <ErrorBoundary>
          <FullCalendar
            slotEventOverlap={false}
            events={ events }
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
            headerToolbar={toolBar(currentView)}
            resourceAreaHeaderContent={resourceName}
            buttonText={buttonText}
            schedulerLicenseKey={licenseKey}
            views={views}
            resources={ currentView == "resourceTimelineDay" || currentView == "resourceTimeGridDay" ? resources : [] }
            eventClassNames={() => (!showEventTime ? "no-time" : "")}
            slotLabelFormat={currentSlotLabelFormat}
            viewClassNames={viewClassNames}
            moreLinkText={trans("calendar.more")}
            initialDate={initialDate}
            initialView={currentView}
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
              if (needChange) {
                props.onEvent("change");
              }
            }}
            eventDragStop={(info) => {
              if (info.view) {
                handleDrop
              }
            }}
          />
        </ErrorBoundary>
      </Wrapper>
    );
  })
    .setPropertyViewFn((children: { 
      events: { propertyView: (arg0: {}) => any; }; 
      resourcesEvents: { propertyView: (arg0: {}) => any; };
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
      licenseKey: { getView: () => any; propertyView: (arg0: { label: string; }) => any; };
    }) => {

      const license = children.licenseKey.getView();
      
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.defaultDate.propertyView({ label: trans("calendar.defaultDate"), tooltip: trans("calendar.defaultDateTooltip"), })}
            {children.events.propertyView({label: trans("calendar.events")})}
            {license == "" ? null : children.resourcesEvents.propertyView({label: trans("calendar.resourcesEvents")})}
          </Section>
          { license != "" && 
            <Section name={trans("calendar.resources")}>
              {children.resources.propertyView({label: trans("calendar.resources")})}
              {children.resourceName.propertyView({label: trans("calendar.resourcesName")})}
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
            {children.licenseKey.propertyView({ label: trans("calendar.license"), tooltip: trans("calendar.licenseTooltip"), })}
            {license == ""
              ? children.currentFreeView.propertyView({ label: trans("calendar.defaultView"), tooltip: trans("calendar.defaultViewTooltip"), })
              : children.currentPremiumView.propertyView({ label: trans("calendar.defaultView"), tooltip: trans("calendar.defaultViewTooltip"), })}
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

let CalendarComp = withMethodExposing(TmpCalendarComp, [

      /* this is not backwards compatible with older versions of the SDK
      {
          method: {
              name: "setCalendarView",
              description: "Sets the view of the calendar to a specified type",
              params: [{ name: "viewType", type: "string" }],
          },
          execute: (comp, values) => {
              const viewType = values[0] as string || "timeGridWeek"; // Default to "timeGridWeek" if undefined
              const viewKey = comp.children.licenseKey.getView() === "" ? 'defaultFreeView' : 'defaultPremiumView';
              comp.children[viewKey].dispatchChangeValueAction(viewType);
          }
      },*/


        {
          method: {
            name: "setResourceTimeGridDayView",
            description: "Switches the calendar view to 'Resource Time Grid Day', which displays resources along the vertical axis and the hours of a single day along the horizontal axis.",
            params: [{ name: "viewType", type: "string" }],
        },
          execute: (comp) => {
            const viewKey = comp.children.licenseKey.getView() === "" ? 'defaultFreeView' : 'defaultPremiumView';
            comp.children["viewKey"].dispatchChangeValueAction("resourceTimeGridDay");
          }
        },
        {
          method: {
            name: "setResourceTimelineDayView",
            description: "Switches the calendar view to 'Resource Timeline Day', showing events against a timeline for a single day, segmented by resources.",
            params: [{ name: "viewType", type: "string" }],
        },
          execute: (comp) => {
            const viewKey = comp.children.licenseKey.getView() === "" ? 'defaultFreeView' : 'defaultPremiumView';
            comp.children["viewKey"].dispatchChangeValueAction("resourceTimelineDay");
          }
        },
        {
          method: {
            name: "setDayGridWeekView",
            description: "Switches the calendar view to 'Day Grid Week', where the days of the week are displayed as columns and events are laid out in grid form.",
            params: [{ name: "viewType", type: "string" }],
        },
          execute: (comp) => {
            const viewKey = comp.children.licenseKey.getView() === "" ? 'defaultFreeView' : 'defaultPremiumView';
            comp.children["viewKey"].dispatchChangeValueAction("dayGridWeek");
          }
        },
        {
          method: {
            name: "setTimeGridWeekView",
            description: "Switches the calendar view to 'Day Grid Week', where the days of the week are displayed as columns and events are laid out in grid form.",
            params: [{ name: "viewType", type: "string" }],
        },
          execute: (comp) => {
            const viewKey = comp.children.licenseKey.getView() === "" ? 'defaultFreeView' : 'defaultPremiumView';
            comp.children["viewKey"].dispatchChangeValueAction("timeGridWeek");
          }
        },
        {
          method: {
            name: "setTimeGridDayView",
            description: "Switches the calendar view to 'Time Grid Day', which shows a detailed hourly schedule for a single day.",
            params: [{ name: "viewType", type: "string" }],
        },
          execute: (comp) => {
            const viewKey = comp.children.licenseKey.getView() === "" ? 'defaultFreeView' : 'defaultPremiumView';
            comp.children["viewKey"].dispatchChangeValueAction("timeGridDay");
          }
        },
        {
          method: {
            name: "setDayGridDayView",
            description: "Switches the calendar view to 'Day Grid Day', displaying a single day in a grid layout that includes all events for that day.",
            params: [{ name: "viewType", type: "string" }],
        },
          execute: (comp) => {
            const viewKey = comp.children.licenseKey.getView() === "" ? 'defaultFreeView' : 'defaultPremiumView';
            comp.children["viewKey"].dispatchChangeValueAction("dayGridDay");
          }
        },
        {
          method: {
            name: "setListWeekView",
            description: "Switches the calendar view to 'List Week', which provides a list-style overview of all events happening throughout the week.",
            params: [{ name: "viewType", type: "string" }],
        },
          execute: (comp) => {
            const viewKey = comp.children.licenseKey.getView() === "" ? 'defaultFreeView' : 'defaultPremiumView';
            comp.children["viewKey"].dispatchChangeValueAction("listWeek");
          }
        },
        {
          method: {
            name: "setDayGridMonthView",
            description: "Switches the calendar view to 'Day Grid Month', presenting the entire month in a grid with events displayed on their respective days.",
            params: [{ name: "viewType", type: "string" }],
        },
          execute: (comp) => {
            const viewKey = comp.children.licenseKey.getView() === "" ? 'defaultFreeView' : 'defaultPremiumView';
            comp.children["viewKey"].dispatchChangeValueAction("dayGridMonth");
          }
        },
        {
          method: {
            name: "setMultiMonthYearView",
            description: "Switches the calendar view to 'Multi Month Year', showing multiple months at once, allowing for long-term planning and overview.",
            params: [{ name: "viewType", type: "string" }],
        },
          execute: (comp) => {
            const viewKey = comp.children.licenseKey.getView() === "" ? 'defaultFreeView' : 'defaultPremiumView';
            comp.children["viewKey"].dispatchChangeValueAction("multiMonthYear");
          }
        }
  ]);


export { CalendarComp };