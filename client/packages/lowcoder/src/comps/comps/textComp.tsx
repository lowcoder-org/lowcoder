import { dropdownControl } from "comps/controls/dropdownControl";
import { stringExposingStateControl } from "comps/controls/codeStateControl";
import { AutoHeightControl } from "comps/controls/autoHeightControl";
import { ScrollBar, Section, sectionNames } from "lowcoder-design";
import styled, { css } from "styled-components";
import { AlignCenter } from "lowcoder-design";
import { AlignLeft } from "lowcoder-design";
import { AlignRight } from "lowcoder-design";
import { UICompBuilder, withDefault } from "../generators";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "../generators/withExposing";
import { markdownCompCss, TacoMarkDown } from "lowcoder-design";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, AnimationStyleType, TextStyle, TextStyleType, heightCalculator, widthCalculator } from "comps/controls/styleControlConstants";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { alignWithJustifyControl } from "comps/controls/alignControl";

import { MarginControl } from "../controls/marginControl";
import { PaddingControl } from "../controls/paddingControl";

import React, { useContext, useEffect } from "react";
import { EditorContext } from "comps/editorState";
import { clickEvent, eventHandlerControl } from "../controls/eventHandlerControl";
import { NewChildren } from "../generators/uiCompBuilder";
import { RecordConstructorToComp } from "lowcoder-core";
import { ToViewReturn } from "../generators/multi";
import { BoolControl } from "@lowcoder-ee/index.sdk";

const EventOptions = [clickEvent] as const;

const getStyle = (style: TextStyleType) => {
  return css`
    border-radius: ${(style.radius ? style.radius : "4px")};
    border: ${(style.borderWidth ? style.borderWidth : "0px")} ${(style.borderStyle ? style.borderStyle : "solid")} ${style.border};
    color: ${style.text};
    text-transform:${style.textTransform} !important;
    text-decoration:${style.textDecoration} !important;
    background-color: ${style.background};
    .markdown-body a {
      color: ${style.links};
    }
    .markdown-body {
      margin: ${style.margin} !important;	
      padding: ${style.padding};	
      width: ${widthCalculator(style.margin)};	
      font-family: ${style.fontFamily} !important;
      font-style:${style.fontStyle} !important;
      font-size: ${style.textSize} !important;
      // height: ${heightCalculator(style.margin)};
      h1 {
        line-height: 1.5;
      }
      h5 {
        line-height: 2.2;
      }
    }

    .markdown-body {
      &,
      p,
      div,
      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        color: ${style.text};
        font-weight: ${style.textWeight} !important;
        line-height:${style.lineHeight};
      }
      img,
      pre {
        background-color: ${style.background};
        code {
          color: #000000;
        }
      }
    }
  `;
};

const TextContainer = styled.div<{
  $type: string;
  $styleConfig: TextStyleType;
  $animationStyle:AnimationStyleType;
}>`
  height: 100%;
  overflow: auto;
  margin: 0;
  ${props=>props.$animationStyle}
  ${(props) =>
    props.$type === "text" && `
    white-space:break-spaces;
    line-height: 1.9;
    font-size: ${props.$styleConfig.textSize};
    font-weight: ${props.$styleConfig.textWeight};
    font-style: ${props.$styleConfig.fontStyle};
    font-family: ${props.$styleConfig.fontFamily};
    margin: ${props.$styleConfig.margin};
    padding: ${props.$styleConfig.padding};
  `};
  ${(props) => props.$styleConfig && getStyle(props.$styleConfig)}
  display: flex;
  ${markdownCompCss};
  overflow-wrap: anywhere;
  .markdown-body {
    overflow-wrap: anywhere;
  }
`;
const AlignTop = styled(AlignLeft)`
  transform: rotate(90deg);
`;
const AlignBottom = styled(AlignRight)`
  transform: rotate(90deg);
`;
const AlignVerticalCenter = styled(AlignCenter)`
  transform: rotate(90deg);
`;

const typeOptions = [
  {
    label: "Markdown",
    value: "markdown",
  },
  {
    label: trans("text"),
    value: "text",
  },
] as const;

const VerticalAlignmentOptions = [
  { label: <AlignTop />, value: "flex-start" },
  { label: <AlignVerticalCenter />, value: "center" },
  { label: <AlignBottom />, value: "flex-end" },
] as const;
const childrenMap = {
  text: stringExposingStateControl(
    "text",
    trans("textShow.text", { name: "{{currentUser.name}}" })
  ),
  onEvent: eventHandlerControl(EventOptions),
  autoHeight: AutoHeightControl,
  type: dropdownControl(typeOptions, "markdown"),
  horizontalAlignment: alignWithJustifyControl(),
  contentScrollBar: withDefault(BoolControl, true),
  verticalAlignment: dropdownControl(VerticalAlignmentOptions, "center"),
  style: styleControl(TextStyle, 'style'),
  animationStyle: styleControl(AnimationStyle, 'animationStyle'),
  margin: MarginControl,
  padding: PaddingControl,
};

type ChildrenType = NewChildren<RecordConstructorToComp<typeof childrenMap>>;

const TextPropertyView = React.memo((props: {
  children: ChildrenType
}) => {
  return (
    <>
      <Section name={sectionNames.basic}>
        {props.children.type.propertyView({
          label: trans("value"),
          tooltip: trans("textShow.valueTooltip"),
          radioButton: true,
        })}
        {props.children.text.propertyView({})}
      </Section>

      {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
        <Section name={sectionNames.interaction}>
          {hiddenPropertyView(props.children)}
          {props.children.onEvent.getPropertyView()}
        </Section>
      )}

      {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
        <>
          <Section name={sectionNames.layout}>
            {props.children.autoHeight.getPropertyView()}
            {!props.children.autoHeight.getView() &&
              props.children.contentScrollBar.propertyView({
                label: trans("prop.contentScrollbar"),
              })}
            {!props.children.autoHeight.getView() &&
              props.children.verticalAlignment.propertyView({
                label: trans("textShow.verticalAlignment"),
                radioButton: true,
              })}
            {props.children.horizontalAlignment.propertyView({
              label: trans("textShow.horizontalAlignment"),
              radioButton: true,
            })}
          </Section>
          <Section name={sectionNames.style}>
            {props.children.style.getPropertyView()}
          </Section>
          <Section name={sectionNames.animationStyle} hasTooltip={true}>
            {props.children.animationStyle.getPropertyView()}
          </Section>
        </>
      )}
    </>
  );
})

const TextView = React.memo((props: ToViewReturn<ChildrenType>) => {
  const value = props.text.value;

  return (
    <TextContainer
      $animationStyle={props.animationStyle}
      $type={props.type}
      $styleConfig={props.style}
      style={{
        justifyContent: props.horizontalAlignment,
        alignItems: props.autoHeight ? "center" : props.verticalAlignment,
        textAlign: props.horizontalAlignment,
        rotate: props.style.rotation
      }}
      onClick={() => props.onEvent("click")}
    >
      <ScrollBar hideScrollbar={!props.contentScrollBar}>
        {props.type === "markdown" ? <TacoMarkDown>{value}</TacoMarkDown> : value}
      </ScrollBar>
    </TextContainer>
  );
}, (prev, next) => JSON.stringify(prev) === JSON.stringify(next));

let TextTmpComp = (function () {
  return new UICompBuilder(childrenMap, (props) => <TextView {...props} />)
    .setPropertyViewFn((children) => <TextPropertyView children={children} />)
    .build();
})();

TextTmpComp = class extends TextTmpComp {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

export const TextComp = withExposingConfigs(TextTmpComp, [
  new NameConfig("text", trans("textShow.textDesc")),
  NameConfigHidden,
]);
