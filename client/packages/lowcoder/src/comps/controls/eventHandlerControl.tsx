import EmptyItem from "components/EmptyItem";
import { CustomListAction, list } from "comps/generators/list";
import { simpleMultiComp } from "comps/generators/multi";
import { trans } from "i18n";
import _ from "lodash";
import { DispatchType } from "lowcoder-core";
import {
  AddEventIcon,
  AddLine,
  controlItem,
  CustomPopover,
  EditPopover,
  EventAction,
  EventContent,
  EventDiv,
  EventTitle,
  InlineEventFormWrapper,
  LinkButton,
  OptionType,
  QueryConfigItemWrapper,
  ValueFromOption,
} from "lowcoder-design";
import { Fragment, ReactNode, useContext, useEffect, useState} from "react";
import { memo } from "util/cacheUtils";
import { EditorContext } from "../editorState";
import { ActionSelectorControl } from "./actionSelector/actionSelectorControl";
import { dropdownControl } from "./dropdownControl";

export interface EventConfigType extends OptionType {
  readonly description: string;
}

export type EventConfigsType = readonly EventConfigType[];

interface SingleEventHandlerProperViewProps {
  onCopy: () => void;
  onDelete: () => void;
  inline?: boolean;
  type?: "query";
  popup: boolean;
  eventConfigs: EventConfigsType;
}

const childrenMap = {
  name: dropdownControl<EventConfigsType>([], ""), // event name
  // FIXME: refactor the parameter config more properly
  handler: ActionSelectorControl,
};

class SingleEventHandlerControl<
  T extends EventConfigsType
> extends simpleMultiComp(childrenMap) {
  // view is function (eventName: ValueFromOption<T>) => void, representing a named event
  getView() {
    const name = this.children.name.getView();
    const handler = this.children.handler.getView();
    return (eventName: ValueFromOption<T>) => {
      if (eventName !== name) {
        return;
      }
      if (handler) {
        return handler();
      }
    };
  }

  propertyView(props: SingleEventHandlerProperViewProps) {
    const name = this.children.name.getView();
    const children = this.children;
    const { eventConfigs } = props;

    const eventName = eventConfigs
      .find((x) => x.value === name)
      ?.label?.toString();

    let content: ReactNode = null;
    if (props.inline && eventConfigs.length === 1) {
      content = (
        <InlineEventFormWrapper>
          <div>
            {trans("eventHandler.inlineEventTitle", {
              eventName: eventName?.toLowerCase() ?? "",
            })}
          </div>
          {children.handler.propertyView({
            label: trans("eventHandler.action"),
            placement: props.type,
          })}
        </InlineEventFormWrapper>
      );
    } else {
      content = (
        <>
          {eventConfigs.length > 1 &&
            children.name.propertyView({
              label: trans("eventHandler.event"),
              options: eventConfigs,
            })}
          {children.handler.propertyView({
            label: trans("eventHandler.action"),
            placement: props.type,
          })}
        </>
      );
    }

    const eventAction = this.children.handler.displayName();

    if (props.inline) {
      return content;
    }
    return (
      <EventDiv>
        <CustomPopover
          title={trans("edit")}
          content={content}
          type={props.type}
          defaultVisible={props.popup}
        >
          <EventContent>
            {!_.isEmpty(eventName) && <EventTitle>{eventName}</EventTitle>}
            <EventAction>{eventAction}</EventAction>
          </EventContent>
        </CustomPopover>
        <EditPopover copy={props.onCopy} del={props.onDelete} />
      </EventDiv>
    );
  }
}

const EventHandlerControlPropertyView = (props: {
  dispatch: DispatchType;
  pushAction: (
    value: any
  ) => CustomListAction<typeof SingleEventHandlerControl>;
  deleteAction: (
    index: number
  ) => CustomListAction<typeof SingleEventHandlerControl>;
  items: InstanceType<typeof SingleEventHandlerControl>[];
  inline?: boolean;
  title?: ReactNode;
  type?: "query";
  eventConfigs: EventConfigsType;
}) => {

  
  const editorState = useContext(EditorContext);
  const [showNewCreate, setShowNewCreate] = useState(false);

  const {
    dispatch,
    pushAction,
    deleteAction,
    inline = false,
    items,
    eventConfigs,
    type
  } = props;
  
  useEffect(() => setShowNewCreate(false), [dispatch]);

  const queryHandler = {
    name: eventConfigs[0].value,
  };

  const handleAdd = () => {
    if (eventConfigs.length === 0) {
      return;
    }
    const queryExecHandler = {
      compType: "executeQuery",
      comp: {
        queryName: editorState
          ?.selectedOrFirstQueryComp()
          ?.children.name.getView(),
      },
    };
    const messageHandler = {
      compType: "message",
    };
    const isInDevIde = !!window.__LOWCODER_ORG__;
    const newHandler = {
      name: eventConfigs[0].value,
      handler: isInDevIde ? messageHandler : queryExecHandler,
    } as const;
    dispatch(pushAction(type !== "query" ? newHandler : queryHandler));
    setShowNewCreate(true);
  };

  const renderItems = () =>
    items.length > 0 ? (
      <div>
        {items.map((child, index) => (
          <Fragment key={index}>
            {child.propertyView({
              type,
              inline,
              onCopy: () => dispatch(pushAction({ ...child.toJsonValue() })),
              onDelete: () => dispatch(deleteAction(index)),
              popup: showNewCreate && index === items.length - 1,
              eventConfigs,
            })}
          </Fragment>
        ))}
      </div>
    ) : (
      <EmptyItem onClick={handleAdd}>
        {trans("eventHandler.emptyEventHandlers")}
      </EmptyItem>
    );
  if (props.inline) {
    return <div style={{ paddingTop: 8 }}>{renderItems()}</div>;
  }
  if (type === "query") {
    return (
      <QueryConfigItemWrapper>
        <LinkButton
          text={trans("addItem")}
          icon={<AddEventIcon />}
          onClick={() => {
            dispatch(pushAction(queryHandler));
            setShowNewCreate(true);
          }}
        />
        <div style={{ height: "8px" }} />
        {renderItems()}
      </QueryConfigItemWrapper>
    );
  }
  return (
    <>
      <AddLine title={props.title} add={handleAdd} />
      {renderItems()}
    </>
  );
};

class EventHandlerControl<T extends EventConfigsType> extends list(SingleEventHandlerControl) {

  @memo
  // @ts-ignore
  getView() {
    return (eventName: ValueFromOption<T>) => {
      const list: Promise<unknown>[] = [];
      super.getView().forEach((child) => {
        const ret = child.getView()(eventName);
        if (ret) {
          list.push(ret);
        }
      });
      return Promise.all(list);
    };
  }

  isBind(eventName: ValueFromOption<T>) {
    return super
      .getView()
      .some((child) => child.children.name.getView() === eventName);
  }

  override getPropertyView() {
    return this.propertyView();
  }

  propertyView(options?: {
    inline?: boolean;
    title?: ReactNode;
    type?: "query";
    eventConfigs: T;
  }) {
    const title = options?.title ?? trans("eventHandler.eventHandlers");
    return controlItem(
      { filterText: title },
      <EventHandlerControlPropertyView
        type={options?.type}
        eventConfigs={options?.eventConfigs || []}
        dispatch={this.dispatch}
        pushAction={this.pushAction}
        deleteAction={this.deleteAction}
        items={super.getView() as any}
        inline={options?.inline}
        title={title}
      />
    );
  }
}

export function eventHandlerControl<T extends EventConfigsType>(
  eventConfigs?: T,
  type?: "query"
) {
  class EventHandlerTempControl extends EventHandlerControl<T> {
    getEventNames() {
      return eventConfigs;
    }

    propertyView(options?: {
      inline?: boolean;
      title?: ReactNode;
      eventConfigs?: T;
    }) {
      return super.propertyView({
        ...options,
        type,
        eventConfigs: options?.eventConfigs || eventConfigs || ([] as any),
      });
    }
  }

  return EventHandlerTempControl;
}

export const refreshEvent: EventConfigType = {
  label: trans("event.refresh"),
  value: "refresh",
  description: trans("event.refreshDesc"),
};

export const submitEvent: EventConfigType = {
  label: trans("event.submit"),
  value: "submit",
  description: trans("event.submitDesc"),
};
export const changeEvent: EventConfigType = {
  label: trans("event.change"),
  value: "change",
  description: trans("event.changeDesc"),
};
export const focusEvent: EventConfigType = {
  label: trans("event.focus"),
  value: "focus",
  description: trans("event.focusDesc"),
};
export const blurEvent: EventConfigType = {
  label: trans("event.blur"),
  value: "blur",
  description: trans("event.blurDesc"),
};
export const clickEvent: EventConfigType = {
  label: trans("event.click"),
  value: "click",
  description: trans("event.clickDesc"),
};
export const doubleClickEvent: EventConfigType = {
  label: trans("event.doubleClick"),
  value: "doubleClick",
  description: trans("event.doubleClickDesc"),
};
export const rightClickEvent: EventConfigType = {
  label: trans("event.rightClick"),
  value: "doubleClick",
  description: trans("event.rightClickDesc"),
};

export const keyDownEvent: EventConfigType = {
  label: trans("event.keyDown"),
  value: "keyDown",
  description: trans("event.keyDownDesc"),
};

export const selectEvent: EventConfigType = {
  label: trans("event.select"),
  value: "select",
  description: trans("event.selectDesc"),
};

export const checkedEvent: EventConfigType = {
  label: trans("event.checked"),
  value: "checked",
  description: trans("event.checkedDesc"),
};

export const uncheckedEvent: EventConfigType = {
  label: trans("event.unchecked"),
  value: "unchecked",
  description: trans("event.uncheckedDesc"),
};

export const dragEvent: EventConfigType = {
  label: trans("event.drag"),
  value: "drag",
  description: trans("event.dragDesc"),
};

export const dropEvent: EventConfigType = {
  label: trans("event.drop"),
  value: "drop",
  description: trans("event.dropDesc"),
};

export const openEvent: EventConfigType = {
  label: trans("event.open"),
  value: "open",
  description: trans("event.openDesc"),
};

export const playEvent: EventConfigType = {
  label: trans("event.play"),
  value: "play",
  description: trans("event.playDesc"),
};

export const pauseEvent: EventConfigType = {
  label: trans("event.pause"),
  value: "pause",
  description: trans("event.pauseDesc"),
};

export const endedEvent: EventConfigType = {
  label: trans("event.ended"),
  value: "ended",
  description: trans("event.endedDesc"),
};

export const stepEvent: EventConfigType = {
  label: trans("event.step"),
  value: "step",
  description: trans("event.stepDesc"),
};

export const nextEvent: EventConfigType = {
  label: trans("event.next"),
  value: "next",
  description: trans("event.nextDesc"),
};

export const finishedEvent: EventConfigType = {
  label: trans("event.finished"),
  value: "finished",
  description: trans("event.finishedDesc"),
};

export const savedEvent: EventConfigType = {
  label: trans("event.saved"),
  value: "saved",
  description: trans("event.savedDesc"),
};

export const editedEvent: EventConfigType = {
  label: trans("event.edited"),
  value: "edited",
  description: trans("event.editedDesc"),
};

export const closeEvent: EventConfigType = {
  label: trans("event.close"),
  value: "close",
  description: trans("event.closeDesc"),
};
export const successEvent: EventConfigType = {
  label: trans("event.success"),
  value: "success",
  description: trans("event.successDesc"),
};
export const deleteEvent: EventConfigType = {
  label: trans("event.delete"),
  value: "delete",
  description: trans("event.deleteDesc"),
};
export const mentionEvent: EventConfigType = {
  label: trans("event.mention"),
  value: "mention",
  description: trans("event.mentionDesc"),
};

export const startEvent: EventConfigType = {
  label: trans("event.start"),
  value: "start",
  description: trans("event.startDesc"),
};
export const resumeEvent: EventConfigType = {
  label: trans("event.resume"),
  value: "resume",
  description: trans("event.resumeDesc"),
};
export const countdownEvent: EventConfigType = {
  label: trans("event.countdown"),
  value: "countdown",
  description: trans("event.countdownDesc"),
};
export const resetEvent: EventConfigType = {
  label: trans("event.reset"),
  value: "reset",
  description: trans("event.resetDesc"),
};


// Meeting Events

export const meetingStartEvent: EventConfigType = {
  label: trans("event.meetingStart"),
  value: "meetingStart",
  description: trans("event.meetingStartDesc"),
};
export const meetingEndEvent: EventConfigType = {
  label: trans("event.meetingEnd"),
  value: "meetingEnd",
  description: trans("event.meetingEndDesc"),
};
export const meetingJoinEvent: EventConfigType = {
  label: trans("event.meetingJoin"),
  value: "meetingJoin",
  description: trans("event.meetingJoinDesc"),
};
export const meetingLeaveEvent: EventConfigType = {
  label: trans("event.meetingLeave"),
  value: "meetingLeave",
  description: trans("event.meetingLeaveDesc"),
};
export const audioUnmuted: EventConfigType = {
  label: trans("meeting.audioUnmuted"),
  value: "audioUnmuted",
  description: trans("meeting.audioUnmuted"),
};
export const audioMuted: EventConfigType = {
  label: trans("meeting.audioMuted"),
  value: "audioMuted",
  description: trans("meeting.audioMuted"),
};
export const videoOff: EventConfigType = {
  label: trans("meeting.videoOff"),
  value: "videoOff",
  description: trans("meeting.videoOff"),
};
export const videoOn: EventConfigType = {
  label: trans("meeting.videoOn"),
  value: "videoOn",
  description: trans("meeting.videoOn"),
};
export const showCameraEvent: EventConfigType = {
  label: trans("event.showCamera"),
  value: "showCamera",
  description: trans("event.showCameraDesc"),
};
export const hideCameraEvent: EventConfigType = {
  label: trans("event.hideCamera"),
  value: "hideCamera",
  description: trans("event.hideCameraDesc"),
};
export const videoClicked: EventConfigType = {
  label: trans("meeting.videoClicked"),
  value: "videoClicked",
  description: trans("meeting.videoClicked"),
};

// Collaboration Events

export const shareScreenEvent: EventConfigType = {
  label: trans("event.shareScreen"),
  value: "shareScreen",
  description: trans("event.shareScreenDesc"),
};
export const shareScreenEndEvent: EventConfigType = {
  label: trans("event.shareScreenEnd"),
  value: "shareScreenEnd",
  description: trans("event.shareScreenEndDesc"),
};
export const shareControlEvent: EventConfigType = {
  label: trans("event.shareControl"),
  value: "shareControl",
  description: trans("event.shareControlDesc"),
};
export const shareControlEndEvent: EventConfigType = {
  label: trans("event.shareControlEnd"),
  value: "shareControlEnd",
  description: trans("event.shareControlEndDesc"),
};
export const shareContentEvent: EventConfigType = {
  label: trans("event.shareContent"),
  value: "shareContent",
  description: trans("event.shareContentDesc"),
};
export const shareContentEndEvent: EventConfigType = {
  label: trans("event.shareContentEnd"),
  value: "shareContentEnd",
  description: trans("event.shareContentEndDesc"),
};
export const muteEvent: EventConfigType = {
  label: trans("event.mute"),
  value: "mute",
  description: trans("event.muteDesc"),
};
export const unmuteEvent: EventConfigType = {
  label: trans("event.unmute"),
  value: "unmute",
  description: trans("event.unmuteDesc"),
};

// Geo Map Events

export const geoMapMoveEvent: EventConfigType = {
  label: trans("event.geoMapMove"),
  value: "geoMapMove",
  description: trans("event.geoMapMoveDesc"),
};
export const geoMapZoomEvent: EventConfigType = {
  label: trans("event.geoMapZoom"),
  value: "geoMapZoom",
  description: trans("event.geoMapZoomDesc"),
};
export const geoMapSelectEvent: EventConfigType = {
  label: trans("event.geoMapSelect"),
  value: "geoMapSelect",
  description: trans("event.geoMapSelectDesc"),
};


// Scanner Events

export const scannerSuccessEvent: EventConfigType = {
  label: trans("event.scannerSuccess"),
  value: "scannerSuccess",
  description: trans("event.scannerSuccessDesc"),
};
export const scannerErrorEvent: EventConfigType = {
  label: trans("event.scannerError"),
  value: "scannerError",
  description: trans("event.scannerErrorDesc"),
};

// Chart Events

export const chartZoomEvent: EventConfigType = {
  label: trans("event.chartZoom"),
  value: "chartZoom",
  description: trans("event.chartZoomDesc"),
};
export const chartHoverEvent: EventConfigType = {
  label: trans("event.chartHover"),
  value: "chartHover",
  description: trans("event.chartHoverDesc"),
};
export const chartSelectEvent: EventConfigType = {
  label: trans("event.chartSelect"),
  value: "chartSelect",
  description: trans("event.chartSelectDesc"),
};
export const chartDeselectEvent: EventConfigType = {
  label: trans("event.chartDeselect"),
  value: "chartDeselect",
  description: trans("event.chartDeselectDesc"),
};

export const selectedChangeEvent: EventConfigType = {
  label: trans("event.selectedChange"),
  value: "selectedChange",
  description: trans("event.selectedChangeDesc"),
};

export const searchEvent: EventConfigType = {
  label: trans("event.search"),
  value: "search",
  description: trans("event.searchDesc"),
};

export const clickExtraEvent: EventConfigType = {
  label: trans("event.clickExtra"),
  value: "clickExtra",
  description: trans("event.clickExtraDesc"),
};

// Exports

export const InputEventHandlerControl = eventHandlerControl([
  changeEvent,
  focusEvent,
  blurEvent,
  submitEvent,
] as const); // , { title: trans("eventHandler.inputEventHandlers"), description: trans("eventHandler.inputEventHandlersDesc"), icon : "" } as const);

export const ButtonEventHandlerControl = eventHandlerControl([
  clickEvent,
] as const);

export const ChangeEventHandlerControl = eventHandlerControl([
  changeEvent,
] as const);

export const EditedEventHandlerControl = eventHandlerControl([
  editedEvent,
] as const);

export const ClickEventHandlerControl = eventHandlerControl([
  clickEvent,
  doubleClickEvent,
  rightClickEvent
] as const);

export const KeyDownEventHandlerControl = eventHandlerControl([
  keyDownEvent,
] as const);

export const CheckboxEventHandlerControl = eventHandlerControl([
  checkedEvent,
  uncheckedEvent,
] as const);

export const DragEventHandlerControl = eventHandlerControl([
  dragEvent,
  dropEvent,
] as const);

export const ElementEventHandlerControl = eventHandlerControl([
  openEvent,
  editedEvent,
  closeEvent,
  savedEvent,
  deleteEvent,
] as const);

export const MediaEventHandlerControl = eventHandlerControl([
  playEvent,
  pauseEvent,
  nextEvent,
  endedEvent,
] as const);

export const StepEventHandlerControl = eventHandlerControl([
  stepEvent,
  nextEvent,
  finishedEvent,
] as const);

export const ShareContentEventHandlerControl = eventHandlerControl([
  shareContentEvent,
  shareContentEndEvent,
] as const);

export const SelectEventHandlerControl = eventHandlerControl([
  changeEvent,
  focusEvent,
  blurEvent,
] as const);

export const ScannerEventHandlerControl = eventHandlerControl([
  clickEvent,
  // scannerSuccessEvent,
  // scannerErrorEvent,
  successEvent,
  closeEvent,
] as const);

export const MeetingEventHandlerControl = eventHandlerControl([
  audioMuted,
  audioUnmuted,
  showCameraEvent,
  hideCameraEvent,
  videoClicked,
  shareScreenEvent,
  shareScreenEndEvent,
  shareControlEvent,
  shareControlEndEvent,
] as const);

export const GeoMapEventHandlerControl = eventHandlerControl([
  geoMapMoveEvent,
  geoMapZoomEvent,
  geoMapSelectEvent,
] as const);

export const ChartEventHandlerControl = eventHandlerControl([
  chartZoomEvent,
  chartHoverEvent,
  chartSelectEvent,
  chartDeselectEvent,
] as const);

export const CollaborationEventHandlerControl = eventHandlerControl([
  shareScreenEvent,
  shareScreenEndEvent,
  shareControlEvent,
  shareControlEndEvent,
  shareContentEvent,
  shareContentEndEvent,
] as const);

export const CardEventHandlerControl = eventHandlerControl([
  clickEvent,
  clickExtraEvent,
  focusEvent,
  blurEvent,
] as const);