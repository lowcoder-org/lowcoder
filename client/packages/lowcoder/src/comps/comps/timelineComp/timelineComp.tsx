import React, { useEffect, useState } from "react";
import { Button } from "antd";
// 渲染组件到编辑器
import {
  changeChildAction,
  DispatchType,
  CompAction,
  RecordConstructorToView,
} from "lowcoder-core";
// 文字国际化转换api
import { trans } from "i18n";
// 右侧属性栏总框架
import { UICompBuilder, withDefault } from "../../generators";
// 右侧属性子框架
import { Section, sectionNames } from "lowcoder-design";
// 指示组件是否隐藏的开关
import { hiddenPropertyView } from "comps/utils/propertyUtils";
// 右侧属性开关

import { BoolControl } from "comps/controls/boolControl";
import { stringExposingStateControl } from "comps/controls/codeStateControl"; //文本并暴露值
import { dropdownControl } from "comps/controls/dropdownControl";
import { styleControl } from "comps/controls/styleControl"; //样式输入框
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
// 事件控制
import {
  clickEvent,
  eventHandlerControl,
} from "comps/controls/eventHandlerControl";

// 引入样式
import {
  TimeLineStyle,
  heightCalculator,
  widthCalculator,
  marginCalculator,
} from "comps/controls/styleControlConstants";
// 初始化暴露值
import { stateComp, valueComp } from "comps/generators/simpleGenerators";
// 组件对外暴露属性的api
import {
  NameConfig,
  NameConfigHidden,
  withExposingConfigs,
} from "comps/generators/withExposing";

import { timelineDate, timelineNode, TimelineDataTooltip } from "./timelineConstants";
import { convertTimeLineData } from "./timelineUtils";
import { Timeline } from "antd";

import { ANTDICON } from "./antIcon"; // todo: select icons to not import all icons

import { useContext } from "react";
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

const TimelineComp = (
  props: RecordConstructorToView<typeof childrenMap> & {
    dispatch: (action: CompAction) => void;
  }
) => {
  const { value, dispatch, style, mode, reverse, onEvent } = props;
  const timelineItems = value.map((value: timelineNode, index: number) => ({
    key: index,
    color: value?.color,
    dot: value?.dot && ANTDICON.hasOwnProperty(value?.dot.toLowerCase())
      ? ANTDICON[value?.dot.toLowerCase() as keyof typeof ANTDICON]
      : "",
    label: (
      <span style={{ color: value?.lableColor || style?.lableColor }}>
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
  }
  ))

  // TODO:parse px string
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
