import { BoolControl } from "comps/controls/boolControl";
import { NumberControl, StringControl } from "comps/controls/codeControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { eventHandlerControl } from "comps/controls/eventHandlerControl";
import { styleControl } from "comps/controls/styleControl";
import { NotificationStyle, NotificationStyleType } from "comps/controls/styleControlConstants";
import { withDefault, simpleMultiComp, withPropertyViewFn, withViewFn } from "comps/generators";
import { withMethodExposing } from "comps/generators/withMethodExposing";
import { NameConfig, withExposingConfigs } from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { trans } from "i18n";
import { notificationInstance } from "lowcoder-design";
import type { ArgsProps, NotificationPlacement } from "antd/es/notification/interface";
import { EvalParamType, ParamsConfig } from "comps/controls/actionSelector/executeCompTypes";
import { JSONObject } from "util/jsonTypes";
import React, { useEffect } from "react";
import { stateComp } from "comps/generators/simpleGenerators";
import { isEqual } from "lodash";

// Toast type options
const toastTypeOptions = [
  { label: trans("toastComp.typeInfo"), value: "info" },
  { label: trans("toastComp.typeSuccess"), value: "success" },
  { label: trans("toastComp.typeWarning"), value: "warning" },
  { label: trans("toastComp.typeError"), value: "error" },
] as const;

// Placement options for notification position
const placementOptions = [
  { label: trans("toastComp.placementTopLeft"), value: "topLeft" },
  { label: trans("toastComp.placementTopRight"), value: "topRight" },
  { label: trans("toastComp.placementBottomLeft"), value: "bottomLeft" },
  { label: trans("toastComp.placementBottomRight"), value: "bottomRight" },
] as const;

// Event options for toast
const ToastEventOptions = [
  { label: trans("toastComp.click"), value: "click", description: trans("toastComp.clickDesc") },
  { label: trans("toastComp.close"), value: "close", description: trans("toastComp.closeDesc") },
] as const;

// Method parameters for programmatic API
const showParams: ParamsConfig = [
  { name: "text", type: "string" },
  { name: "options", type: "JSON" },
];

const closeParams: ParamsConfig = [
  { name: "key", type: "string" },
];

// Children map for toast component configuration
const childrenMap = {
  // Basic configuration
  title: withDefault(StringControl, ""),
  description: withDefault(StringControl, ""),
  type: dropdownControl(toastTypeOptions, "info"),
  
  // Timing
  duration: withDefault(NumberControl, 4.5),
  
  // Position & Appearance
  placement: dropdownControl(placementOptions, "bottomRight"),
  dismissible: withDefault(BoolControl, true),
  showProgress: withDefault(BoolControl, false),
  pauseOnHover: withDefault(BoolControl, true),
  
  // Event handlers
  onEvent: eventHandlerControl(ToastEventOptions),

  // Style
  style: styleControl(NotificationStyle),
  resolvedStyle: stateComp<NotificationStyleType>({
    background: "",
    color: "",
    border: "",
  }),
  
  // Internal state for tracking visibility
  visible: stateComp<boolean>(false),
};

type ToastType = "info" | "success" | "warning" | "error";

// Helper function to show notification with event callbacks
const showNotificationWithEvents = (
  config: {
    title: string;
    description: string;
    type: ToastType;
    duration: number;
    placement: NotificationPlacement;
    dismissible: boolean;
    showProgress: boolean;
    pauseOnHover: boolean;
    key?: string;
    styleConfig?: NotificationStyleType;
    style?: React.CSSProperties;
  },
  onEvent: (eventName: "click" | "close") => Promise<unknown[]>,
  setVisible: (visible: boolean) => void
) => {
  const notificationKey = config.key || `toast-${Date.now()}`;

  const borderColor = config.styleConfig?.border;
  const computedStyle: React.CSSProperties = {
    background: config.styleConfig?.background,
    color: config.styleConfig?.color,
    border:
      borderColor && borderColor !== "transparent" ? `1px solid ${borderColor}` : undefined,
  };
  const mergedStyle: React.CSSProperties = { ...computedStyle, ...(config.style || {}) };
  const textColor = typeof mergedStyle.color === "string" ? mergedStyle.color : undefined;
  
  const notificationArgs: ArgsProps = {
    message: textColor ? <span style={{ color: textColor }}>{config.title}</span> : config.title,
    description: config.description
      ? textColor
        ? <span style={{ color: textColor }}>{config.description}</span>
        : config.description
      : undefined,
    duration: config.duration === 0 ? null : config.duration,
    key: notificationKey,
    placement: config.placement,
    closeIcon: config.dismissible ? undefined : false,
    showProgress: config.showProgress,
    pauseOnHover: config.pauseOnHover,
    style: mergedStyle,
    onClick: () => {
      onEvent("click");
    },
    onClose: () => {
      setVisible(false);
      onEvent("close");
    },
  };

  // Show notification based on type
  if (config.title || config.description) {
    setVisible(true);
    notificationInstance[config.type](notificationArgs);
  }
  
  return notificationKey;
};

// Helper for programmatic API (backwards compatible)
const showNotificationProgrammatic = (
  params: EvalParamType[],
  level: ToastType,
  comp: any
) => {
  const text = params?.[0] as string;
  const options = (params?.[1] as JSONObject) || {};
  
  const {
    description,
    duration,
    key,
    placement,
    dismissible,
    showProgress,
    pauseOnHover,
    style,
  } = options;

  // Use component config as defaults, override with params
  const config = {
    title: text || comp.children.title.getView(),
    description: (description as string) ?? comp.children.description.getView(),
    type: level,
    duration: typeof duration === "number" ? duration : comp.children.duration.getView(),
    placement: (placement as NotificationPlacement) ?? comp.children.placement.getView(),
    dismissible: typeof dismissible === "boolean" ? dismissible : comp.children.dismissible.getView(),
    showProgress: typeof showProgress === "boolean" ? showProgress : comp.children.showProgress.getView(),
    pauseOnHover: typeof pauseOnHover === "boolean" ? pauseOnHover : comp.children.pauseOnHover.getView(),
    key: key as string | undefined,
    styleConfig: comp.children.resolvedStyle.getView() as NotificationStyleType,
    style: style as React.CSSProperties | undefined,
  };

  const onEvent = comp.children.onEvent.getView();
  const setVisible = (visible: boolean) => {
    comp.children.visible.dispatchChangeValueAction(visible);
  };

  return showNotificationWithEvents(config, onEvent, setVisible);
};

// Property view component
const ToastPropertyView = React.memo((props: { comp: any }) => {
  const { comp } = props;
  
  return (
    <>
      <Section name={sectionNames.basic}>
        {comp.children.title.propertyView({ 
          label: trans("toastComp.title"),
          placeholder: trans("toastComp.titlePlaceholder"),
        })}
        {comp.children.description.propertyView({ 
          label: trans("toastComp.description"),
          placeholder: trans("toastComp.descriptionPlaceholder"),
        })}
        {comp.children.type.propertyView({ 
          label: trans("toastComp.type"),
        })}
      </Section>
      
      <Section name={trans("toastComp.behavior")}>
        {comp.children.duration.propertyView({ 
          label: trans("toastComp.duration"),
          tooltip: trans("toastComp.durationTooltip"),
          placeholder: "4.5",
        })}
        {comp.children.placement.propertyView({ 
          label: trans("toastComp.placement"),
        })}
        {comp.children.dismissible.propertyView({ 
          label: trans("toastComp.dismissible"),
        })}
        {comp.children.showProgress.propertyView({ 
          label: trans("toastComp.showProgress"),
          tooltip: trans("toastComp.showProgressTooltip"),
        })}
        {comp.children.pauseOnHover.propertyView({ 
          label: trans("toastComp.pauseOnHover"),
        })}
      </Section>
      
      <Section name={sectionNames.interaction}>
        {comp.children.onEvent.getPropertyView()}
      </Section>

      <Section name={sectionNames.style}>
        {comp.children.style.getPropertyView()}
      </Section>
    </>
  );
});

ToastPropertyView.displayName = "ToastPropertyView";

/**
 * Toast has no visible view, but we still need a runtime view to:
 * - avoid executing styleControl.getView() inside EditorView's useMemo (hooks warning)
 * - resolve theme-dependent styleControl values inside React render, then persist them
 *   into a plain state field (`resolvedStyle`) that can be safely used by methods.
 */
const ToastRuntimeView = React.memo((props: { comp: any }) => {
  const { comp } = props;
  const style = comp.children.style.getView() as NotificationStyleType;

  useEffect(() => {
    const current = comp.children.resolvedStyle.getView() as NotificationStyleType;
    if (!isEqual(style, current)) {
      comp.children.resolvedStyle.dispatchChangeValueAction(style);
    }
  }, [comp, style]);

  return null;
});

ToastRuntimeView.displayName = "ToastRuntimeView";

// Build the component
let ToastCompBase = simpleMultiComp(childrenMap);

ToastCompBase = withViewFn(ToastCompBase, (comp) => <ToastRuntimeView comp={comp} />);

ToastCompBase = withPropertyViewFn(ToastCompBase, (comp) => (
  <ToastPropertyView comp={comp} />
));

// Add exposing configs
let ToastCompWithExposing = withExposingConfigs(ToastCompBase, [
  new NameConfig("visible", trans("toastComp.visibleDesc")),
  new NameConfig("title", trans("toastComp.titleDesc")),
  new NameConfig("description", trans("toastComp.descriptionDesc")),
  new NameConfig("type", trans("toastComp.typeDesc")),
  new NameConfig("duration", trans("toastComp.durationDesc")),
  new NameConfig("placement", trans("toastComp.placementDesc")),
]);

// Add method exposing
export let ToastComp = withMethodExposing(ToastCompWithExposing, [
  {
    method: {
      name: "show",
      description: trans("toastComp.showMethod"),
      params: [],
    },
    execute: (comp) => {
      const config = {
        title: comp.children.title.getView(),
        description: comp.children.description.getView(),
        type: comp.children.type.getView() as ToastType,
        duration: comp.children.duration.getView(),
        placement: comp.children.placement.getView() as NotificationPlacement,
        dismissible: comp.children.dismissible.getView(),
        showProgress: comp.children.showProgress.getView(),
        pauseOnHover: comp.children.pauseOnHover.getView(),
        styleConfig: comp.children.resolvedStyle.getView() as NotificationStyleType,
      };
      
      const onEvent = comp.children.onEvent.getView();
      const setVisible = (visible: boolean) => {
        comp.children.visible.dispatchChangeValueAction(visible);
      };
      
      showNotificationWithEvents(config, onEvent, setVisible);
    },
  },
  {
    method: {
      name: "info",
      description: trans("toastComp.info"),
      params: showParams,
    },
    execute: (comp, params) => showNotificationProgrammatic(params, "info", comp),
  },
  {
    method: {
      name: "success",
      description: trans("toastComp.success"),
      params: showParams,
    },
    execute: (comp, params) => showNotificationProgrammatic(params, "success", comp),
  },
  {
    method: {
      name: "warn",
      description: trans("toastComp.warn"),
      params: showParams,
    },
    execute: (comp, params) => showNotificationProgrammatic(params, "warning", comp),
  },
  {
    method: {
      name: "error",
      description: trans("toastComp.error"),
      params: showParams,
    },
    execute: (comp, params) => showNotificationProgrammatic(params, "error", comp),
  },
  {
    method: {
      name: "close",
      description: trans("toastComp.closeMethod"),
      params: closeParams,
    },
    execute: (comp, params) => {
      const key = params?.[0] as string;
      if (key) {
        notificationInstance.destroy(key);
      }
      comp.children.visible.dispatchChangeValueAction(false);
      comp.children.onEvent.getView()("close");
    },
  },
  // Legacy method for backwards compatibility
  {
    method: {
      name: "destroy",
      description: trans("toastComp.destroy"),
      params: closeParams,
    },
    execute: (comp, params) => {
      const key = params?.[0] as string;
      notificationInstance.destroy(key);
    },
  },
  {
    method: {
      name: "open",
      description: trans("toastComp.openMethod"),
      params: showParams,
    },
    execute: (comp, params) => showNotificationProgrammatic(params, "info", comp),
  },
]);
