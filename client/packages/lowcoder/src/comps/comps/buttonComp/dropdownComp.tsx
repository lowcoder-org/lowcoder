import { default as Menu } from "antd/es/menu";
import { default as Dropdown } from "antd/es/dropdown";
import { default as DropdownButton } from "antd/es/dropdown/dropdown-button";
import { BoolControl } from "comps/controls/boolControl";
import { BoolCodeControl, NumberControl, StringControl } from "comps/controls/codeControl";
import { DropdownStyle, DropdownStyleType } from "comps/controls/styleControlConstants";
import { withDefault } from "comps/generators";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { disabledPropertyView, hiddenPropertyView } from "comps/utils/propertyUtils";
import { Section, sectionNames } from "lowcoder-design";
import { trans } from "i18n";
import React, { ReactElement } from "react";
import { useEditorStore } from "comps/editorStore";
import styled from "styled-components";
import EllipsisOutlined from "@ant-design/icons/EllipsisOutlined";
import { IconControl } from "comps/controls/iconControl";
import { hasIcon } from "comps/utils";
import { ButtonEventHandlerControl } from "../../controls/eventHandlerControl";
import { DropdownOptionControl } from "../../controls/optionsControl";
import { CommonNameConfig, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import {
  Button100,
  ButtonCompWrapper,
  getButtonStyle,
} from "./buttonCompConstants";
import { styleControl } from "@lowcoder-ee/comps/controls/styleControl";
import { dropdownControl } from "@lowcoder-ee/comps/controls/dropdownControl";

const StyledDropdownButton = styled(DropdownButton)`
  width: 100%;
  
  .ant-btn-group {
    width: 100%;
  }
`;

const LeftButtonWrapper = styled.div<{ $buttonStyle: DropdownStyleType }>`
  flex: 1;
  ${(props) => `margin: ${props.$buttonStyle.margin};`}
  margin-right: 0;
  .ant-btn span {
    ${(props) => props.$buttonStyle.textDecoration !== undefined ? `text-decoration: ${props.$buttonStyle.textDecoration};` : ''}
    ${(props) => props.$buttonStyle.fontFamily !== undefined ? `font-family: ${props.$buttonStyle.fontFamily};` : ''}
  }
  
  .ant-btn {
    ${(props) => getButtonStyle(props.$buttonStyle as any)}
    margin: 0 !important;
    height: 100%;
    &.ant-btn-default {
      margin: 0 !important;
      ${(props) => `border-radius: ${props.$buttonStyle.radius} 0 0 ${props.$buttonStyle.radius};`}
      ${(props) => `text-transform: ${props.$buttonStyle.textTransform};`}
      ${(props) => `font-weight: ${props.$buttonStyle.textWeight};`}
    }
    ${(props) => `background: ${props.$buttonStyle.background};`}
    ${(props) => `color: ${props.$buttonStyle.text};`}
    ${(props) => `padding: ${props.$buttonStyle.padding};`}
    ${(props) => `font-size: ${props.$buttonStyle.textSize};`}
    ${(props) => `font-style: ${props.$buttonStyle.fontStyle};`}

    width: 100%;
    line-height:${(props) => props.$buttonStyle.lineHeight}; 
  }
  
`;

const RightButtonWrapper = styled.div<{ $buttonStyle: DropdownStyleType }>`
  width: 32px;
  ${(props) => `margin: ${props.$buttonStyle.margin};`}
  margin-left: -1px;
  .ant-btn {
    ${(props) => getButtonStyle(props.$buttonStyle as any)}
    margin: 0 !important;
    height: 100%;
    &.ant-btn-default {
      margin: 0 !important;
      ${(props) => `border-radius: 0 ${props.$buttonStyle.radius} ${props.$buttonStyle.radius} 0;`}
    }
    width: 100%;
  }
`;

/** Single-button dropdown (matches split-button’s icon trigger styling, all corners rounded). */
const IconTriggerOnlyWrapper = styled.div<{
  $buttonStyle: DropdownStyleType;
  $minTriggerWidth: number;
}>`
  display: inline-flex;
  width: auto;
  min-width: ${(p) => p.$minTriggerWidth}px;

  ${(props) => `margin: ${props.$buttonStyle.margin};`}

  .ant-btn {
    ${(props) => getButtonStyle(props.$buttonStyle as any)}
    margin: 0 !important;
    &.ant-btn-default {
      ${(props) => `border-radius: ${props.$buttonStyle.radius};`}
    }
    width: auto;
    min-width: ${(p) => p.$minTriggerWidth}px;
    height: 100%;
  }
`;

const SizedTriggerIconWrap = styled.span<{ $size: number }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: ${(p) => p.$size}px;
  line-height: 1;
  & > *,
  & svg {
    width: 1em;
    height: 1em;
  }
`;

const triggerOptions = [
  { label: "Hover", value: "hover" },
  { label: "Click", value: "click" },
] as const;

function renderSizedTriggerIcon(
  triggerIcon: React.ReactNode,
  sizePx: number,
  fallback: React.ReactNode
) {
  return (
    <SizedTriggerIconWrap $size={sizePx}>
      {hasIcon(triggerIcon) ? triggerIcon : fallback}
    </SizedTriggerIconWrap>
  );
}

function labelButtonText(text: string) {
  return !text || text.length === 0 ? " " : text;
}

const DropdownTmpComp = (function () {
  const childrenMap = {
    text: withDefault(StringControl, trans("menu")),
    onlyIcon: BoolControl,
    triggerIcon: IconControl,
    triggerIconSize: withDefault(NumberControl, 15),
    onlyMenu: BoolControl,
    triggerMode: dropdownControl(triggerOptions, "hover"),
    options: DropdownOptionControl,
    disabled: BoolCodeControl,
    onEvent: ButtonEventHandlerControl,
    style: styleControl(DropdownStyle, 'style'),
  };
  return new UICompBuilder(childrenMap, (props) => {
    const rawTriggerIconSize = Number(props.triggerIconSize);
    const triggerIconSizePx =
      Number.isFinite(rawTriggerIconSize) && rawTriggerIconSize > 0 ? rawTriggerIconSize : 20;
    const menuShowsOptionIcons =
      props.options.findIndex((option) => (option.prefixIcon as ReactElement)?.props.value) > -1;
    const items = props.options
      .filter((option) => !option.hidden)
      .map((option, index) => ({
        title: option.label,
        label: option.label,
        style: {padding: props.style.padding},
        key: option.label + " - " + index,
        disabled: option.disabled,
        icon: menuShowsOptionIcons && <span>{option.prefixIcon}</span>,
        index,
      }));

    const menu = (
      <Menu
        items={items}
        onClick={({ key }) => {
          const item = items.find((o) => o.key === key);
          const itemIndex = props.options.findIndex(option => option.label === item?.label);
          item && props.options[itemIndex]?.onEvent("click");
        }}
      />
    );

    return (
      <ButtonCompWrapper $disabled={props.disabled}>
        {props.onlyMenu ? (
          <Dropdown
            disabled={props.disabled}
            popupRender={() => menu}
            trigger={[props.triggerMode]}
          >
            <Button100
              $buttonStyle={props.style as any}
              disabled={props.disabled}
              icon={
                props.onlyIcon
                  ? renderSizedTriggerIcon(
                      props.triggerIcon,
                      triggerIconSizePx,
                      <EllipsisOutlined />
                    )
                  : undefined
              }
            >
              {props.onlyIcon ? undefined : labelButtonText(props.text)}
            </Button100>
          </Dropdown>
        ) : props.onlyIcon ? (
          <Dropdown
            disabled={props.disabled}
            popupRender={() => menu}
            trigger={[props.triggerMode]}
          >
            <IconTriggerOnlyWrapper
              $buttonStyle={props.style}
              $minTriggerWidth={Math.max(32, triggerIconSizePx + 12)}
            >
              <Button100
                $buttonStyle={props.style as any}
                disabled={props.disabled}
                icon={renderSizedTriggerIcon(
                  props.triggerIcon,
                  triggerIconSizePx,
                  <EllipsisOutlined />
                )}
              />
            </IconTriggerOnlyWrapper>
          </Dropdown>
        ) : (
          <StyledDropdownButton
            disabled={props.disabled}
            popupRender={() => menu}
            trigger={[props.triggerMode]}
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
            {labelButtonText(props.text)}
          </StyledDropdownButton>
        )}
      </ButtonCompWrapper>
    );
  })
    .setPropertyViewFn((children) => {
      const editorModeStatus = useEditorStore((state) => state.editorModeStatus);
      return (
      <>
        <Section name={sectionNames.basic}>
          {children.options.propertyView({})}
        </Section>

        {(editorModeStatus === "logic" || editorModeStatus === "both") && (
          <><Section name={sectionNames.interaction}>
              {!children.onlyMenu.getView() && !children.onlyIcon.getView()
                ? children.onEvent.getPropertyView()
                : undefined}
              {disabledPropertyView(children)}
              {hiddenPropertyView(children)}
            </Section>
          </>
        )}

        {(editorModeStatus === "layout" || editorModeStatus === "both") && (
          <>
            <Section name={sectionNames.layout}>
              {children.text.propertyView({ label: trans("label") })}
              {children.triggerMode.propertyView({
                label: trans("dropdown.triggerMode"),
                radioButton: true,
              })}
              {children.onlyMenu.propertyView({ label: trans("dropdown.onlyMenu") })}
              {children.onlyIcon.propertyView({ label: trans("dropdown.onlyIcon") })}
              {!children.onlyIcon.getView()
                ? undefined
                : children.triggerIcon.propertyView({ label: trans("dropdown.triggerIcon") })}
              {!children.onlyIcon.getView()
                ? undefined
                : children.triggerIconSize.propertyView({
                    label: trans("dropdown.triggerIconSize"),
                  })}
            </Section>
            <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
          </>
        )}
      </>
    );
    })
    .build();
})();

export const DropdownComp = withExposingConfigs(DropdownTmpComp, [
  new NameConfig("text", trans("dropdown.textDesc")),
  ...CommonNameConfig,
]);
