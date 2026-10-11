import React, { ReactNode, useCallback, useRef, useEffect, useMemo, ReactElement } from "react";
import { DropdownOptionControl } from "comps/controls/optionsControl";
import { StringControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import { ColumnTypeCompBuilder, ColumnTypeViewFn } from "../columnTypeCompBuilder";
import Menu from "antd/es/menu";
import Dropdown from "antd/es/dropdown";
import { dropdownControl } from "comps/controls/dropdownControl";
import { IconControl } from "comps/controls/iconControl";
import { withDefault } from "comps/generators";
import { IconWrapper } from "util/bottomResUtils";
import { ButtonTypeOptions } from "../simpleColumnTypeComps";
import { useStyle } from "comps/controls/styleControl";
import { ButtonStyle } from "comps/controls/styleControlConstants";
import { Button100 } from "comps/comps/buttonComp/buttonCompConstants";
import styled from "styled-components";
import { ButtonType } from "antd/es/button";
import { clickEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";
import { useCompClickEventHandler } from "@lowcoder-ee/comps/utils/useCompClickEventHandler";

const StyledButton = styled(Button100)`
  display: flex;
  align-items: center;
  gap: 0;
  min-width: 30px;
  width: auto;
`;

const StyledIconWrapper = styled(IconWrapper)`
  margin: 0;
`;

const DropdownEventOptions = [clickEvent] as const;

const childrenMap = {
  buttonType: dropdownControl(ButtonTypeOptions, "primary"),
  label: withDefault(StringControl, 'Menu'),
  prefixIcon: IconControl,
  suffixIcon: IconControl,
  options: DropdownOptionControl,
  onEvent: eventHandlerControl(DropdownEventOptions),
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string, string> = (props) => props.label;

// Memoized dropdown menu component
const DropdownMenu = React.memo(({ items, options, onEvent }: { items: any[]; options: any[]; onEvent: (eventName: string) => void }) => {
  const mountedRef = useRef(true);
  const handleClickEvent = useCompClickEventHandler({onEvent})

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleClick = useCallback(({ key }: { key: string }) => {
    if (!mountedRef.current) return;
    const item = items.find((o) => o.key === key);
    const itemIndex = options.findIndex(option => option.label === item?.label);
    item && options[itemIndex]?.onEvent("click");
    // Also trigger the dropdown's main event handler
    handleClickEvent();
  }, [items, options, handleClickEvent]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  return (
    <Menu
      items={items}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    />
  );
});

DropdownMenu.displayName = 'DropdownMenu';

const DropdownView = React.memo((props: {
  buttonType: ButtonType;
  label: string;
  prefixIcon: ReactNode;
  suffixIcon: ReactNode;
  options: any[];
  onEvent?: (eventName: string) => void;
}) => {
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const hasOptionIcon = useMemo(() => 
    props.options.findIndex((option) => (option.prefixIcon as ReactElement)?.props.value) > -1,
    [props.options]
  );

  const items = useMemo(() => 
    props.options
      .filter((option) => !option.hidden)
      .map((option, index) => ({
        title: option.label,
        label: option.label,
        key: option.label + " - " + index,
        disabled: option.disabled,
        icon: hasOptionIcon && <span>{option.prefixIcon}</span>,
        index,
      })),
    [props.options, hasOptionIcon]
  );
  
  const hasPrefixIcon = useMemo(() => 
    (props.prefixIcon as ReactElement)?.props.value,
    [props.prefixIcon]
  );

  const hasSuffixIcon = useMemo(() => 
    (props.suffixIcon as ReactElement)?.props.value,
    [props.suffixIcon]
  );

  const buttonStyle = useStyle(ButtonStyle);

  const menu = useMemo(() => (
    <DropdownMenu items={items} options={props.options} onEvent={props.onEvent ?? (() => {})} />
  ), [items, props.options, props.onEvent]);

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      popupRender={() => menu}
    >
      <StyledButton
        type={props.buttonType}
        $buttonStyle={props.buttonType === "primary" ? buttonStyle : undefined}
      >
        {hasPrefixIcon && (
          <StyledIconWrapper style={{
            marginRight: props.label || hasSuffixIcon ? '3px' : '0x',
          }}>
            {props.prefixIcon}
          </StyledIconWrapper>
        )}
        {props.label || (hasPrefixIcon || hasSuffixIcon ? undefined : " ")}
        {hasSuffixIcon && (
          <StyledIconWrapper style={{
            marginLeft: props.label || hasPrefixIcon ? '3px' : '0x',
          }}>
            {props.suffixIcon}
          </StyledIconWrapper>
        )}
      </StyledButton>
    </Dropdown>
  );
});

DropdownView.displayName = 'DropdownView';

export const ColumnDropdownComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props) => {
      return <DropdownView {...props} />;
    },
    (nodeValue) => nodeValue.label.value,
    getBaseValue,
  )
    .setPropertyViewFn((children) => {
      return (
        <>
          {children.buttonType.propertyView({
            label: trans("table.type"),
            radioButton: true,
          })}
          {children.label.propertyView({
            label: trans("text"),
          })}
          {children.prefixIcon.propertyView({
            label: trans("button.prefixIcon"),
          })}
          {children.suffixIcon.propertyView({
            label: trans("button.suffixIcon"),
          })}
          {children.options.propertyView({
            title: trans("optionsControl.optionList"),
          })}
          {children.onEvent.propertyView()}
        </>
      );
    })
    .build();
})();
