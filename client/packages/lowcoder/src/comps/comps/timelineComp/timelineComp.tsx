import React, { useEffect, useState, useContext } from "react";
import { default as Button } from "antd/es/button";
import {
  changeChildAction,
  DispatchType,
  CompAction,
  RecordConstructorToView,
} from "lowcoder-core";
import { trans } from "i18n";
import { UICompBuilder, withDefault } from "../../generators";
import { Section, sectionNames } from "lowcoder-design";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { BoolControl } from "comps/controls/boolControl";
import { stringExposingStateControl } from "comps/controls/codeStateControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { styleControl } from "comps/controls/styleControl";
import { alignControl } from "comps/controls/alignControl";
import { AutoHeightControl } from "comps/controls/autoHeightControl";
import { jsonValueExposingStateControl } from "comps/controls/codeStateControl";
import {
  ArrayStringControl,
  BoolCodeControl,
  CodeControlJSONType,
  jsonControl,
  jsonObjectControl,
  jsonValueControl,
  NumberControl,
  StringControl,
} from "comps/controls/codeControl";
import {
  clickEvent,
  eventHandlerControl,
} from "comps/controls/eventHandlerControl";
import {
  TimeLineStyle,
  heightCalculator,
  widthCalculator,
  marginCalculator,
} from "comps/controls/styleControlConstants";
import { stateComp, valueComp } from "comps/generators/simpleGenerators";
import {
  NameConfig,
  NameConfigHidden,
  withExposingConfigs,
} from "comps/generators/withExposing";
import { timelineDate, timelineNode, TimelineDataTooltip } from "./timelineConstants";
import { convertTimeLineData } from "./timelineUtils";
import { default as Timeline } from "antd/es/timeline";
import { EditorContext } from "comps/editorState";

const EventOptions = [
  clickEvent,
] as const;

const modeOptions = [
  { label: trans("timeLine.left"), value: "left" },
  { label: trans("timeLine.right"), value: "right" },
  { label: trans("timeLine.alternate"), value: "alternate" },
] as const;

const childrenMap = {
  value: jsonControl(convertTimeLineData, timelineDate),
  mode: dropdownControl(modeOptions, "alternate"),
  reverse: BoolControl,
  pending: withDefault(StringControl, trans("timeLine.defaultPending")),
  onEvent: eventHandlerControl(EventOptions),
  style: styleControl(TimeLineStyle),
  clickedObject: valueComp<timelineNode>({ title: "" }),
  clickedIndex: valueComp<number>(0),
};

// Utility function to dynamically load Ant Design icons
const loadIcon = async (iconName: string) => {
  if (!iconName) return null;
  try {
    const module = await import(`@ant-design/icons`);
    const IconComponent = (module as any)[iconName];
    return IconComponent ? <IconComponent /> : null;
  } catch (error) {
    console.error(`Error loading icon ${iconName}:`, error);
    return null;
  }
};

const TimelineComp = (
  props: RecordConstructorToView<typeof childrenMap> & {
    dispatch: (action: CompAction) => void;
  }
) => {
  const { value, dispatch, style, mode, reverse, onEvent } = props;
  const [icons, setIcons] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    const loadIcons = async () => {
      const iconComponents = await Promise.all(
        value.map((node) =>
          node.dot ? loadIcon(node.dot) : Promise.resolve(null)
        )
      );
      setIcons(iconComponents);
    };

    loadIcons();
  }, [value]);

  const timelineItems = value.map((value: timelineNode, index: number) => ({
    key: index,
    color: value?.color,
    dot: icons[index] || "",
    label: (
      <span style={{ color: value?.labelColor || style?.labelColor }}>
        {value?.label}
      </span>
    ),
    children: (
      <>
        <Button
          type="link"
          onClick={(e) => {
            e.preventDefault();
            dispatch(changeChildAction("clickedObject", value, false));
            dispatch(changeChildAction("clickedIndex", index, false));
            onEvent("click");
          }}
          style={{
            cursor: "pointer",
            color: value?.titleColor || style?.titleColor,
          }}
        >
          <b>{value?.title}</b>
        </Button>
        <p style={{ color: value?.subTitleColor || style?.subTitleColor }}>
          {value?.subTitle}
        </p>
      </>
    )
  }));

  return (
    <div
      style={{
        margin: style.margin ?? '3px',
        padding: style.padding !== '3px' ? style.padding : '20px 10px 0px 10px',
        width: widthCalculator(style.margin ?? '3px'),
        height: heightCalculator(style.margin ?? '3px'),
        background: style.background,
        overflow: "auto",
        overflowX: "hidden",
        borderRadius: style.radius,
      }}
    >
      <Timeline
        mode={props?.mode || "left"}
        reverse={props?.reverse}
        pending={
          props?.pending && (
            <span style={{ color: style?.titleColor }}>
              {props?.pending || ""}
            </span>
          )
        }
        items={timelineItems}
      />
    </div>
  );
};

let TimeLineBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props, dispatch) => (
    <TimelineComp {...props} dispatch={dispatch} />
  ))
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.value.propertyView({
            label: trans("timeLine.value"),
            tooltip: TimelineDataTooltip,
            placeholder: "[]",
          })}
        </Section>

        {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <Section name={sectionNames.interaction}>
            {children.onEvent.getPropertyView()}
            {hiddenPropertyView(children)}
          </Section>
        )}

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <><Section name={sectionNames.layout}>
              {children.mode.propertyView({
                label: trans("timeLine.mode"),
                tooltip: trans("timeLine.modeTooltip"),
              })}
              {children.pending.propertyView({
                label: trans("timeLine.pending"),
                tooltip: trans("timeLine.pendingDescription"),
              })}
              {children.reverse.propertyView({
                label: trans("timeLine.reverse"),
              })}
            </Section>
            <Section name={sectionNames.style}>
              {children.style.getPropertyView()}
            </Section>
          </>
        )}
      </>
    ))
    .build();
})();

TimeLineBasicComp = class extends TimeLineBasicComp {
  override autoHeight(): boolean {
    return false;
  }
};

export const TimeLineComp = withExposingConfigs(TimeLineBasicComp, [
  new NameConfig("value", trans("timeLine.valueDesc")),
  new NameConfig("clickedObject", trans("timeLine.clickedObjectDesc")),
  new NameConfig("clickedIndex", trans("timeLine.clickedIndexDesc")),
  NameConfigHidden,
]);
