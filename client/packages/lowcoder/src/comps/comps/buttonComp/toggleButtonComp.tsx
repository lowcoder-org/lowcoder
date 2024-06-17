import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { withDefault } from "comps/generators";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import {
  disabledPropertyView,
  hiddenPropertyView,
  loadingPropertyView,
} from "comps/utils/propertyUtils";
import { Section, sectionNames } from "lowcoder-design";
import { trans } from "i18n";
import styled from "styled-components";
import { ChangeEventHandlerControl } from "../../controls/eventHandlerControl";
import { CommonNameConfig, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import { Button100, ButtonCompWrapper, buttonRefMethods } from "./buttonCompConstants";
import { IconControl } from "comps/controls/iconControl";
import { AlignWithStretchControl, LeftRightControl } from "comps/controls/dropdownControl";
import { booleanExposingStateControl } from "comps/controls/codeStateControl";
import {
  AnimationStyle,
  AnimationStyleType,
  ToggleButtonStyle,
} from "comps/controls/styleControlConstants";
import { styleControl } from "comps/controls/styleControl";
import { BoolControl } from "comps/controls/boolControl";
import { RefControl } from "comps/controls/refControl";
import React, { useContext } from "react";
import { EditorContext } from "comps/editorState"; 

const IconWrapper = styled.div`
  display: flex;
`;

const ButtonCompWrapperStyled = styled(ButtonCompWrapper)<{
  $align: "left" | "center" | "right" | "stretch";
  $showBorder: boolean;
  $animationStyle: AnimationStyleType;
}>`
  ${(props) => props.$animationStyle}
  width: 100%;
  display: flex;
  justify-content: ${(props) => props.$align};

  > button {
    width: ${(props) => props.$align !== "stretch" && "auto"};
    border: ${(props) => !props.$showBorder && "none"};
    box-shadow: ${(props) => !props.$showBorder && "none"};
  }
`;

const ToggleTmpComp = (function () {
  const childrenMap = {
    value: booleanExposingStateControl("value"),
    showText: withDefault(BoolControl, true),
    trueText: withDefault(StringControl, trans("toggleButton.trueDefaultText")),
    falseText: withDefault(StringControl, trans("toggleButton.falseDefaultText")),
    onEvent: ChangeEventHandlerControl,
    disabled: BoolCodeControl,
    loading: BoolCodeControl,
    trueIcon: withDefault(IconControl, "/icon:solid/AngleUp"),
    falseIcon: withDefault(IconControl, "/icon:solid/AngleDown"),
    iconPosition: LeftRightControl,
    alignment: AlignWithStretchControl,
    style: styleControl(ToggleButtonStyle),
    animationStyle: styleControl(AnimationStyle),
    showBorder: withDefault(BoolControl, true),
    viewRef: RefControl<HTMLElement>,
  };
  return new UICompBuilder(childrenMap, (props) => {
    const text = props.showText
      ? (props.value.value ? props.trueText : props.falseText) || undefined
      : undefined;
    return (
      <ButtonCompWrapperStyled
        disabled={props.disabled}
        $align={props.alignment}
        $showBorder={props.showBorder}
        $animationStyle={props.animationStyle}
      >
        <Button100
          ref={props.viewRef}
          $buttonStyle={props.style}
          loading={props.loading}
          disabled={props.disabled}
          onClick={() => {
            props.onEvent("change");
            props.value.onChange(!props.value.value);
          }}
        >
          {props.iconPosition === "right" && text}
          {<IconWrapper>{props.value.value ? props.trueIcon : props.falseIcon}</IconWrapper>}
          {props.iconPosition === "left" && text}
        </Button100>
      </ButtonCompWrapperStyled>
    );
  })
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.value.propertyView({
            label: trans("prop.defaultValue"),
            tooltip: trans("toggleButton.valueDesc"),
          })}
        </Section>

        {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
          <><Section name={sectionNames.interaction}>
              {children.onEvent.getPropertyView()}
              {disabledPropertyView(children)}
              {hiddenPropertyView(children)}
              {loadingPropertyView(children)}
            </Section>
            <Section name={sectionNames.advanced}>
              {children.showText.propertyView({ label: trans("toggleButton.showText") })}
              {children.showText.getView() && 
                children.trueText.propertyView({ label: trans("toggleButton.trueLabel") })}
              {children.showText.getView() &&
                children.falseText.propertyView({ label: trans("toggleButton.falseLabel") })}
              {children.trueIcon.propertyView({ label: trans("toggleButton.trueIconLabel") })}
              {children.falseIcon.propertyView({ label: trans("toggleButton.falseIconLabel") })}
              {children.showText.getView() &&
                children.iconPosition.propertyView({
                  label: trans("toggleButton.iconPosition"),
                  radioButton: true,
              })}
              {children.alignment.propertyView({
                label: trans("toggleButton.alignment"),
                radioButton: true,
              })}
            </Section>
          </>
        )}

        {(useContext(EditorContext).editorModeStatus === "layout" ||
          useContext(EditorContext).editorModeStatus === "both") && (
          <>
            <Section name={sectionNames.style}>
              {children.showBorder.propertyView({
                label: trans("toggleButton.showBorder"),
              })}
              {children.style.getPropertyView()}
            </Section>
            <Section name={sectionNames.animationStyle} hasTooltip={true}>
              {children.animationStyle.getPropertyView()}
            </Section>
          </>
          )}
        
      </>
    ))
    .setExposeMethodConfigs(buttonRefMethods)
    .build();
})();

export const ToggleButtonComp = withExposingConfigs(ToggleTmpComp, [
  new NameConfig("value", trans("dropdown.textDesc")),
  new NameConfig("loading", trans("button.loadingDesc")),
  ...CommonNameConfig,
]);
