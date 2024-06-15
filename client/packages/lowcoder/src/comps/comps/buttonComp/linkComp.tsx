import { default as Button } from "antd/es/button";
import { ButtonCompWrapper, buttonRefMethods } from "comps/comps/buttonComp/buttonCompConstants";
import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { ButtonEventHandlerControl } from "comps/controls/eventHandlerControl";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, AnimationStyleType, LinkStyle, LinkStyleType } from "comps/controls/styleControlConstants";
import { withDefault } from "comps/generators";
import { migrateOldData } from "comps/generators/simpleGenerators";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { Section, sectionNames } from "lowcoder-design";
import styled from "styled-components";
import { CommonNameConfig, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import {
  hiddenPropertyView,
  disabledPropertyView,
  loadingPropertyView,
} from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { IconControl } from "comps/controls/iconControl";
import { hasIcon } from "comps/utils";
import { RefControl } from "comps/controls/refControl";

import { EditorContext } from "comps/editorState";
import React, { useContext } from "react";

const Link = styled(Button)<{
  $style: LinkStyleType;
  $animationStyle: AnimationStyleType;
}>`
  ${(props) => props.$animationStyle}
  ${(props) => `
    color: ${props.$style.text};
    rotate: ${props.$style.rotation};
    margin: ${props.$style.margin};
    padding: ${props.$style.padding};
    font-size: ${props.$style.textSize};
    font-style:${props.$style.fontStyle};
    font-family:${props.$style.fontFamily};
    font-weight:${props.$style.textWeight};
    border: ${props.$style.borderWidth} ${props.$style.borderStyle} ${props.$style.border};
    border-radius:${props.$style.radius ? props.$style.radius:'0px'};
    text-transform:${props.$style.textTransform ? props.$style.textTransform:''};
    text-decoration:${props.$style.textDecoration ? props.$style.textDecoration:''} !important;
    background-color: ${props.$style.background};
    &:hover {
      color: ${props.$style.hoverText} !important;
    }
    &:active {
      color: ${props.$style.activeText} !important;
    }
  `}

  &.ant-btn { 
    display: inline-flex;
    align-items: center;
    > span {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-height: 1px;
    }
  }
`;

const IconWrapper = styled.span`
  display: flex;
`;

/**
 * compatible with old data 2022-08-26
 */
function fixOldData(oldData: any) {
  if (oldData && oldData.hasOwnProperty("color")) {
    return {
      text: oldData.color,
    };
  }
  return oldData;
}

const LinkTmpComp = (function () {
  const childrenMap = {
    text: withDefault(StringControl, trans("link.link")),
    onEvent: ButtonEventHandlerControl,
    disabled: BoolCodeControl,
    loading: BoolCodeControl,
    style: migrateOldData(styleControl(LinkStyle), fixOldData),
    animationStyle:styleControl(AnimationStyle),
    prefixIcon: IconControl,
    suffixIcon: IconControl,
    viewRef: RefControl<HTMLElement>,
  };
  return new UICompBuilder(childrenMap, (props) => {
    // chrome86 bug: button children should not contain only empty span
    const hasChildren = hasIcon(props.prefixIcon) || !!props.text || hasIcon(props.suffixIcon);
    return (
      <ButtonCompWrapper disabled={props.disabled}>
        <Link
          $animationStyle={props.animationStyle}
          ref={props.viewRef}
          $style={props.style}
          loading={props.loading}
          disabled={props.disabled}
          onClick={() => props.onEvent("click")}
          type={"link"}
        >
          {hasChildren && (
            <span>
              {hasIcon(props.prefixIcon) && <IconWrapper>{props.prefixIcon}</IconWrapper>}
              {!!props.text && props.text}
              {hasIcon(props.suffixIcon) && <IconWrapper>{props.suffixIcon}</IconWrapper>}
            </span>
          )}
        </Link>
      </ButtonCompWrapper>
    );
  })
    .setPropertyViewFn((children) => {
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.text.propertyView({ label: trans("text") })}
          </Section>

          {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
            <><Section name={sectionNames.interaction}>
              {children.onEvent.getPropertyView()}
              {disabledPropertyView(children)}
              {hiddenPropertyView(children)}
              {loadingPropertyView(children)}
            </Section>
              <Section name={sectionNames.advanced}>
                {children.prefixIcon.propertyView({ label: trans("button.prefixIcon") })}
                {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
              </Section></>
          )}

          {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
            <>
              <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
              <Section name={sectionNames.animationStyle} hasTooltip={true}>{children.animationStyle.getPropertyView()}</Section>
            </>
          )}
        </>
      );
    })
    .setExposeMethodConfigs(buttonRefMethods)
    .build();
})();

export const LinkComp = withExposingConfigs(LinkTmpComp, [
  new NameConfig("text", trans("link.textDesc")),
  new NameConfig("loading", trans("link.loadingDesc")),
  ...CommonNameConfig,
]);
