import { CompAction, RecordConstructorToView, changeChildAction } from "lowcoder-core";
import { styleControl } from "comps/controls/styleControl";
import { avatarGroupStyle, avatarContainerStyle, AvatarContainerStyleType } from "comps/controls/styleControlConstants";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import {AlignCenter, AlignLeft, AlignRight} from "lowcoder-design";
import { trans } from "i18n";
import { NumberControl, StringControl } from "comps/controls/codeControl";
import { Avatar, Tooltip } from "antd";
import { clickEvent, eventHandlerControl, refreshEvent } from "../controls/eventHandlerControl";
import styled from "styled-components";
import React, { ReactElement } from "react";
import { MultiCompBuilder, stateComp, withDefault } from "../generators";
import { IconControl } from "../controls/iconControl";
import { ColorControl } from "../controls/colorControl";
import { optionsControl } from "../controls/optionsControl";
import { BoolControl } from "../controls/boolControl";
import { dropdownControl } from "../controls/dropdownControl";
import { JSONObject } from "util/jsonTypes";
import {MultiIconDisplay} from "@lowcoder-ee/comps/comps/multiIconDisplay";
import {viewMode} from "@lowcoder-ee/util/editor";
const SetPropertyViewAvatarGroup1 =  React.lazy( async () => await import("./setProperty/avatarGroup").then(module => ({default: module.SetPropertyViewAvatarGroup1})))
const SetPropertyViewAvatarGroup2 =  React.lazy( async () => await import("./setProperty/avatarGroup").then(module => ({default: module.SetPropertyViewAvatarGroup2})))
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

const Container = styled.div<{ $style: AvatarContainerStyleType | undefined, alignment: string }>`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: ${props => props.alignment};
  cursor: pointer;
  background: ${props => props?.$style?.background};
  margin: ${props => props?.$style?.margin};
  padding: ${props => props?.$style?.padding};
  border: ${props => props?.$style?.border};
  border-style: ${props => props?.$style?.borderStyle};
  border-radius: ${props => props?.$style?.radius};
  border-width: ${props => props?.$style?.borderWidth};
`;

let DropdownOption = new MultiCompBuilder(
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
if (viewMode() === "edit") {
  DropdownOption.setPropertyViewFn((children) => <SetPropertyViewAvatarGroup1 {...children}></SetPropertyViewAvatarGroup1>);
}
const DropdownOptionBuilder = DropdownOption.build();

const EventOptions = [clickEvent, refreshEvent] as const;

export const alignOptions = [
  { label: <MultiIconDisplay identifier={AlignLeft} />, value: "flex-start" },
  { label: <MultiIconDisplay identifier={AlignCenter} />, value: "center" },
  { label: <MultiIconDisplay identifier={AlignRight} />, value: "flex-end" },
] as const;

const childrenMap = {
  avatar: styleControl(avatarGroupStyle , 'avatar'),
  style: styleControl(avatarContainerStyle , 'style'),
  maxCount: withDefault(NumberControl, 3),
  avatarSize: withDefault(NumberControl, 40),
  alignment: dropdownControl(alignOptions, "center"),
  autoColor: BoolControl.DEFAULT_TRUE,
  onEvent: eventHandlerControl(EventOptions),
  currentAvatar: stateComp<JSONObject>({}),
  avatars: optionsControl(DropdownOptionBuilder, {
    initOptions: [
      { src: "https://api.dicebear.com/7.x/miniavs/svg?seed=1", label: String.fromCharCode(65 + Math.ceil(Math.random() * 25)) },
      { AvatarIcon: "/icon:antd/startwotone" },
      { label: String.fromCharCode(65 + Math.ceil(Math.random() * 25)) },
      { label: String.fromCharCode(65 + Math.ceil(Math.random() * 25)) },
    ],
  })
};

const AvatarGroupView = (props: RecordConstructorToView<typeof childrenMap> & { dispatch: (action: CompAction) => void; }) => {
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
                      color: item.color ? item.color : (props.avatar.fill !== '#FFFFFF' ? props.avatar.fill : '#FFFFFF'),
                      backgroundColor: item.backgroundColor ? item.backgroundColor : (props.autoColor ? MacaroneList[index % MacaroneList.length] : props.avatar.background),
                    }}
                    size={props.avatarSize}
                    onClick={() => {
                      props.onEvent("click")
                      props.dispatch(changeChildAction("currentAvatar", item as JSONObject, false));
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
  );
};

let AvatarGroupBasicComp = (function () {
  let builder = new UICompBuilder(childrenMap, (props, dispatch) => {
    return( <AvatarGroupView {...props} dispatch={dispatch} />
)})
  if (viewMode() === "edit") {
    builder.setPropertyViewFn((children) => <SetPropertyViewAvatarGroup2 {...children}></SetPropertyViewAvatarGroup2>);
  }
      return builder
    .build();
})();

export const AvatarGroupComp = withExposingConfigs(AvatarGroupBasicComp, [
  new NameConfig("currentAvatar", trans("avatarGroup.currentAvatar")),
  NameConfigHidden,
]);
