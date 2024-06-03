import { default as Menu } from "antd/es/menu";
import { default as Dropdown } from "antd/es/dropdown";
import { default as DropdownButton } from "antd/es/dropdown/dropdown-button";
import { BoolControl } from "comps/controls/boolControl";
import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { DropdownStyle, DropdownStyleType } from "comps/controls/styleControlConstants";
import { withDefault } from "comps/generators";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { disabledPropertyView, hiddenPropertyView } from "comps/utils/propertyUtils";
import { Section, sectionNames } from "lowcoder-design";
import { trans } from "i18n";
import React, { ReactElement, useContext } from "react";
import { EditorContext } from "comps/editorState";
import styled from "styled-components";
import { ButtonEventHandlerControl } from "../../controls/eventHandlerControl";
import { DropdownOptionControl } from "../../controls/optionsControl";
import { CommonNameConfig, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import {
  Button100,
  ButtonCompWrapper,
  ButtonStyleControl,
  getButtonStyle,
} from "./buttonCompConstants";
import { styleControl } from "@lowcoder-ee/index.sdk";


const StyledDropdownButton = styled(DropdownButton)`
  width: 100%;
  
  .ant-btn-group {
    width: 100%;
   
  }
`;

const LeftButtonWrapper = styled.div<{ $buttonStyle: DropdownStyleType }>`
  width: calc(100%);
  ${(props) => `margin: ${props.$buttonStyle.margin};`}
  margin-right: 0;
  .ant-btn span {
    ${(props) => `text-decoration: ${props.$buttonStyle.textDecoration};`}
    ${(props) => `font-family: ${props.$buttonStyle.fontFamily};`}
  }
  
  .ant-btn {
    ${(props) => getButtonStyle(props.$buttonStyle)}
    margin: 0 !important;
    height: 100%;
    &.ant-btn-default {
      margin: 0 !important;
      ${(props) => `border-radius: ${props.$buttonStyle.radius} 0 0 ${props.$buttonStyle.radius};`}
      ${(props) => `text-transform: ${props.$buttonStyle.textTransform};`}
      ${(props) => `font-weight: ${props.$buttonStyle.textWeight};`}
    }
    ${(props) => `background-color: ${props.$buttonStyle.background};`}
    ${(props) => `color: ${props.$buttonStyle.text};`}
    ${(props) => `padding: ${props.$buttonStyle.padding};`}
    ${(props) => `font-size: ${props.$buttonStyle.textSize};`}
    ${(props) => `font-style: ${props.$buttonStyle.fontStyle};`}

    width: 100%;
  }
  
`;

const RightButtonWrapper = styled.div<{ $buttonStyle: DropdownStyleType }>`
  // width: 32px;
  ${(props) => `margin: ${props.$buttonStyle.margin};`}
  margin-left: -1px;
  .ant-btn {
    ${(props) => getButtonStyle(props.$buttonStyle)}
    margin: 0 !important;
    height: 100%;
    &.ant-btn-default {
      margin: 0 !important;
      ${(props) => `border-radius: 0 ${props.$buttonStyle.radius} ${props.$buttonStyle.radius} 0;`}
    }
    width: 100%;
  }
`;

const DropdownTmpComp = (function () {
  const childrenMap = {
    text: withDefault(StringControl, trans("menu")),
    onlyMenu: BoolControl,
    options: DropdownOptionControl,
    disabled: BoolCodeControl,
    onEvent: ButtonEventHandlerControl,
    style: styleControl(DropdownStyle),
  };
  return new UICompBuilder(childrenMap, (props) => {
    const hasIcon =
      props.options.findIndex((option) => (option.prefixIcon as ReactElement)?.props.value) > -1;
    const items = props.options
      .filter((option) => !option.hidden)
      .map((option, index) => ({
        title: option.label,
        label: option.label,
        style: {padding: props.style.padding},
        key: option.label + " - " + index,
        disabled: option.disabled,
        icon: hasIcon && <span>{option.prefixIcon}</span>,
        index,
      }));

    const menu = (
      <Menu
        items={items}
        onClick={({ key }) => {
          const item = items.find((o) => o.key === key);
          item && props.options[item.index]?.onEvent("click");
        }}
      />
    );

    return (
      <ButtonCompWrapper disabled={props.disabled}>
        {props.onlyMenu ? (
          <Dropdown
            disabled={props.disabled}
            dropdownRender={() => menu}
          >
            <Button100 $buttonStyle={props.style} disabled={props.disabled}>
              {props.text || " " /* Avoid button disappearing */}
            </Button100>
          </Dropdown>
        ) : (
          <StyledDropdownButton
            disabled={props.disabled}
            dropdownRender={() => menu}
            onClick={() => props.onEvent("click")}
            buttonsRender={([left, right]) => [
              <LeftButtonWrapper $buttonStyle={props.style}>
                {React.cloneElement(left as React.ReactElement<any, string>, {
                  disabled: props.disabled,
                })}
              </LeftButtonWrapper>,
              <RightButtonWrapper $buttonStyle={props.style}>
                {React.cloneElement(right as React.ReactElement<any, string>, {
                  disabled: props.disabled,
                })}
              </RightButtonWrapper>,
            ]}
          >
            {/* Avoid button disappearing */}
            {!props.text || props.text?.length === 0 ? " " : props.text}
          </StyledDropdownButton>
        )}
      </ButtonCompWrapper>
    );
  })
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.options.propertyView({})}
        </Section>

        {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
          <><Section name={sectionNames.interaction}>
              {!children.onlyMenu.getView() && children.onEvent.getPropertyView()}
              {disabledPropertyView(children)}
              {hiddenPropertyView(children)}
            </Section>
          </>
        )}

        {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
          <>
            <Section name={sectionNames.layout}>
              {children.text.propertyView({ label: trans("label") })}
              {children.onlyMenu.propertyView({ label: trans("dropdown.onlyMenu") })}
            </Section>
            <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
          </>
        )}
      </>
    ))
    .build();
})();

export const DropdownComp = withExposingConfigs(DropdownTmpComp, [
  new NameConfig("text", trans("dropdown.textDesc")),
  ...CommonNameConfig,
]);
