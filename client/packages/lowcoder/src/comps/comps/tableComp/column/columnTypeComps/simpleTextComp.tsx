import { default as Input } from "antd/es/input";
import { StringOrNumberControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import { ColumnTypeCompBuilder, ColumnTypeViewFn } from "../columnTypeCompBuilder";
import { ColumnValueTooltip } from "../simpleColumnTypeComps";
import { IconControl } from "comps/controls/iconControl";
import { hasIcon } from "comps/utils";
import React, { useCallback, useMemo } from "react";
import { RecordConstructorToComp } from "lowcoder-core";
import { clickEvent, doubleClickEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";
import styled from "styled-components";
import { useCompClickEventHandler } from "@lowcoder-ee/comps/utils/useCompClickEventHandler";

const TextEventOptions = [clickEvent, doubleClickEvent] as const;

const TextWrapper = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const childrenMap = {
  text: StringOrNumberControl,
  prefixIcon: IconControl,
  suffixIcon: IconControl,
  onEvent: eventHandlerControl(TextEventOptions),
};

// Memoize the base value function to prevent unnecessary string creation
const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string | number, string | number> = (props) => 
  typeof props.text === 'string' ? props.text : String(props.text);

// Memoized icon components to prevent unnecessary re-renders
const IconWrapper = React.memo(({ icon }: { icon: React.ReactNode }) => (
  <span>{icon}</span>
));

interface SimpleTextContentProps {
  value: string | number;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  onEvent?: (eventName: string) => void;
}

interface SimpleTextEditViewProps {
  value: string | number;
  onChange: (value: string | number) => void;
  onChangeEnd: () => void;
}

const SimpleTextContent = React.memo(({ value, prefixIcon, suffixIcon, onEvent }: SimpleTextContentProps) => {
  const handleClickEvent = useCompClickEventHandler({onEvent: onEvent ?? (() => {})})
  
  const handleClick = useCallback(() => {
     handleClickEvent()
  }, [handleClickEvent]);

  return (
    <TextWrapper onClick={handleClick}>
      {hasIcon(prefixIcon) && <IconWrapper icon={prefixIcon} />}
      <span>{value}</span>
      {hasIcon(suffixIcon) && <IconWrapper icon={suffixIcon} />}
    </TextWrapper>
  );
});

const SimpleTextEditView = React.memo(({ value, onChange, onChangeEnd }: SimpleTextEditViewProps) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <Input
      defaultValue={value}
      autoFocus
      variant="borderless"
      onChange={handleChange}
      onBlur={onChangeEnd}
      onPressEnter={onChangeEnd}
    />
  );
});

const SimpleTextPropertyView = React.memo(({ children }: { children: RecordConstructorToComp<typeof childrenMap> }) => {
  return useMemo(() => (
    <>
      {children.text.propertyView({
        label: trans("table.columnValue"),
        tooltip: ColumnValueTooltip,
      })}
      {children.prefixIcon.propertyView({
        label: trans("button.prefixIcon"),
      })}
      {children.suffixIcon.propertyView({
        label: trans("button.suffixIcon"),
      })}
      {children.onEvent.propertyView()}
    </>
  ), [children.text, children.prefixIcon, children.suffixIcon, children.onEvent]);
});

export const SimpleTextComp = new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = props.changeValue ?? getBaseValue(props, dispatch);
      return (
        <SimpleTextContent
          value={value}
          prefixIcon={props.prefixIcon}
          suffixIcon={props.suffixIcon}
          onEvent={props.onEvent}
        />
      );
    },
    (nodeValue) => nodeValue.text.value,
    getBaseValue
  )
    .setEditViewFn((props) => <SimpleTextEditView {...props} />)
    .setPropertyViewFn((children) => <SimpleTextPropertyView children={children} />)
    .build();
