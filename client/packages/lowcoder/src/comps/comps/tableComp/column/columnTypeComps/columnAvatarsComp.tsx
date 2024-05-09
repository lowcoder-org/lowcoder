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
import { clickEvent, eventHandlerControl, refreshEvent } from "comps/controls/eventHandlerControl";
import { ReactElement } from "react";
import { IconControl } from "comps/controls/iconControl";
import { ColorControl } from "comps/controls/colorControl";
import { optionsControl } from "comps/controls/optionsControl";
import { BoolControl } from "comps/controls/boolControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { JSONObject } from "util/jsonTypes";

const MenuLinkWrapper = styled.div`
  > a {
    color: ${PrimaryColor} !important;

    &:hover {
      color: ${LightActiveTextColor} !important;
    }
  }
`;

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

const DropdownOption = new MultiCompBuilder(
  {
    src: StringControl,
    AvatarIcon: IconControl,
    label: StringControl,
    color: ColorControl,
    backgroundColor: ColorControl,
    Tooltip: StringControl,
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
    </>
  );
})
.build();

const EventOptions = [clickEvent, refreshEvent] as const;

export const alignOptions = [
  { label: <AlignLeft />, value: "flex-start" },
  { label: <AlignCenter />, value: "center" },
  { label: <AlignRight />, value: "flex-end" },
] as const;

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
    (props) => {
      return (
        <Container
          $style={props.style}
          alignment={props.alignment}
        >
          {
            <Avatar.Group maxCount={props.maxCount} size={props.avatarSize}>
              {
                props.avatars.map((item, index) => {
                  return (
                    <Tooltip title={item.Tooltip}>
                      <Avatar
                        src={item.src ?? undefined}
                        icon={(item.AvatarIcon as ReactElement)?.props.value === '' || item.label.trim() !== '' ? undefined : item.AvatarIcon}
                        style={{
                          color: item.color ? item.color : (props.style.fill !== '#FFFFFF' ? props.style.fill : '#FFFFFF'),
                          backgroundColor: item.backgroundColor ? item.backgroundColor : (props.autoColor ? MacaroneList[index % MacaroneList.length] : props.style.background),
                        }}
                        size={props.avatarSize}
                        onClick={() => {
                          props.onEvent("click")
                          // Falk: TODO: Implement dispatch function to set the currentAvatar
                          // dispatch(changeChildAction("currentAvatar", item as JSONObject, false));
                        }}
                      >
                        {item.label}
                      </Avatar>
                    </Tooltip>
                  )
                })
              }
            </Avatar.Group>
          }
        </Container>
      )
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
