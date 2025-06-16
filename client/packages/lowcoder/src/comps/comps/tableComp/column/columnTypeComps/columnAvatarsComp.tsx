import { ColumnTypeCompBuilder } from "comps/comps/tableComp/column/columnTypeCompBuilder";
import { StringControl } from "comps/controls/codeControl";
import { MultiCompBuilder, stateComp, withDefault } from "comps/generators";
import { trans } from "i18n";
import styled from "styled-components";
import { LightActiveTextColor, PrimaryColor } from "constants/style";
import { styleControl } from "comps/controls/styleControl";
import { avatarGroupStyle, AvatarGroupStyleType } from "comps/controls/styleControlConstants";
import { AlignCenter, AlignLeft, AlignRight } from "lowcoder-design";
import { NumberControl } from "comps/controls/codeControl";
import { Avatar, Tooltip } from "antd";
import { clickEvent, eventHandlerControl, refreshEvent, doubleClickEvent } from "comps/controls/eventHandlerControl";
import React, { ReactElement, useCallback, useEffect, useRef } from "react";
import { IconControl } from "comps/controls/iconControl";
import { ColorControl } from "comps/controls/colorControl";
import { optionsControl } from "comps/controls/optionsControl";
import { BoolControl } from "comps/controls/boolControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { JSONObject } from "util/jsonTypes";
import { useCompClickEventHandler } from "@lowcoder-ee/comps/utils/useCompClickEventHandler";

const MacaroneList = [
  '#fde68a',
  '#eecff3',
  '#a7f3d0',
  '#bfdbfe',
  '#bfdbfe',
  '#c7d2fe',
  '#fecaca',
  '#fcd6bb',
]

const Container = styled.div<{ $style: AvatarGroupStyleType | undefined, alignment: string }>`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: ${props => props.alignment};
  cursor: pointer;
`;

const AvatarEventOptions = [clickEvent, refreshEvent] as const;

const DropdownOption = new MultiCompBuilder(
  {
    src: StringControl,
    AvatarIcon: IconControl,
    label: StringControl,
    color: ColorControl,
    backgroundColor: ColorControl,
    Tooltip: StringControl,
    onEvent: eventHandlerControl(AvatarEventOptions),
  },
  (props) => props
)
.setPropertyViewFn((children) => {
  return (
    <>
      {children.src.propertyView({ label: trans("avatarComp.src"), placeholder: "", tooltip: trans("avatarComp.avatarCompTooltip") })}
      {children.label.propertyView({label: trans("avatarComp.title"), tooltip: trans("avatarComp.avatarCompTooltip"),
      })}
      {children.AvatarIcon.propertyView({
        label: trans("avatarComp.icon"),
        IconType: "All",
        tooltip: trans("avatarComp.avatarCompTooltip"),
      })}
      {children.color.propertyView({ label: trans("style.fill") })}
      {children.backgroundColor.propertyView({ label: trans("style.background") })}
      {children.Tooltip.propertyView({ label: trans("badge.tooltip") })}
      {children.onEvent.propertyView()}
    </>
  );
})
.build();

const EventOptions = [clickEvent, refreshEvent, doubleClickEvent] as const;

export const alignOptions = [
  { label: <AlignLeft />, value: "flex-start" },
  { label: <AlignCenter />, value: "center" },
  { label: <AlignRight />, value: "flex-end" },
] as const;

// Memoized Avatar component
const MemoizedAvatar = React.memo(({ 
  item, 
  index, 
  style, 
  autoColor, 
  avatarSize, 
  onEvent,
  onItemEvent
}: { 
  item: any; 
  index: number; 
  style: any; 
  autoColor: boolean; 
  avatarSize: number; 
  onEvent: (event: string) => void;
  onItemEvent?: (event: string) => void;
}) => {
  const mountedRef = useRef(true);
  const handleClickEvent = useCompClickEventHandler({onEvent})


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleClick = useCallback(() => {
    if (!mountedRef.current) return;
    
    // Trigger individual avatar event first
    if (onItemEvent) {
      onItemEvent("click");
    }
    
    // Then trigger main component event
    handleClickEvent()
  }, [onItemEvent, handleClickEvent]);

  return (
    <Tooltip title={item.Tooltip} key={index}>
      <Avatar
        src={item.src ?? undefined}
        icon={(item.AvatarIcon as ReactElement)?.props.value === '' || item.label.trim() !== '' ? undefined : item.AvatarIcon}
        style={{
          color: item.color ? item.color : (style.fill !== '#FFFFFF' ? style.fill : '#FFFFFF'),
          backgroundColor: item.backgroundColor ? item.backgroundColor : (autoColor ? MacaroneList[index % MacaroneList.length] : style.background),
          cursor: 'pointer',
        }}
        size={avatarSize}
        onClick={handleClick}
      >
        {item.label}
      </Avatar>
    </Tooltip>
  );
});

MemoizedAvatar.displayName = 'MemoizedAvatar';

// Memoized Avatar Group component
const MemoizedAvatarGroup = React.memo(({ 
  avatars, 
  maxCount, 
  avatarSize, 
  style, 
  autoColor, 
  onEvent 
}: { 
  avatars: any[]; 
  maxCount: number; 
  avatarSize: number; 
  style: any; 
  autoColor: boolean; 
  onEvent: (event: string) => void; 
}) => {
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <Avatar.Group maxCount={maxCount} size={avatarSize}>
      {avatars.map((item, index) => (
        <MemoizedAvatar
          key={index}
          item={item}
          index={index}
          style={style}
          autoColor={autoColor}
          avatarSize={avatarSize}
          onEvent={onEvent}
          onItemEvent={item.onEvent}
        />
      ))}
    </Avatar.Group>
  );
});

MemoizedAvatarGroup.displayName = 'MemoizedAvatarGroup';

export const ColumnAvatarsComp = (function () {
  const childrenMap = {
    style: styleControl(avatarGroupStyle),
    maxCount: withDefault(NumberControl, 3),
    avatarSize: withDefault(NumberControl, 40),
    alignment: dropdownControl(alignOptions, "center"),
    autoColor: BoolControl.DEFAULT_TRUE,
    onEvent: eventHandlerControl(EventOptions),
    currentAvatar: stateComp<JSONObject>({}),
    avatars: optionsControl(DropdownOption, {
      initOptions: [
        { src: "https://api.dicebear.com/7.x/miniavs/svg?seed=1", label: String.fromCharCode(65 + Math.ceil(Math.random() * 25)) },
        { AvatarIcon: "/icon:antd/startwotone" },
        { label: String.fromCharCode(65 + Math.ceil(Math.random() * 25)) },
        { label: String.fromCharCode(65 + Math.ceil(Math.random() * 25)) },
      ],
    })
  };

  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      return (
        <Container
          $style={props.style}
          alignment={props.alignment}
        >
          <MemoizedAvatarGroup
            avatars={props.avatars}
            maxCount={props.maxCount}
            avatarSize={props.avatarSize}
            style={props.style}
            autoColor={props.autoColor}
            onEvent={props.onEvent}
          />
        </Container>
      );
    },
    () => ""
  )
    .setPropertyViewFn((children) => (
      <>
        {children.avatars.propertyView({})}
        {children.maxCount.propertyView({
          label: trans("avatarGroup.maxCount")
        })}
        {children.avatarSize.propertyView({
          label: trans("avatarGroup.avatarSize")
        })}
        {children.autoColor.propertyView({
          label: trans("avatarGroup.autoColor")
        })}
        {children.alignment.propertyView({
          label: trans("table.avatarGroupAlignment"),
          radioButton: true,
        })}
        {children.onEvent.propertyView()}
      </>
    ))
    .build();
})();
