import { CompAction, RecordConstructorToView, changeChildAction } from "lowcoder-core";
import { styleControl } from "comps/controls/styleControl";
import { QRCodeStyle, QRCodeStyleType, avatarGroupStyle, AvatarGroupStyleType, avatarContainerStyle, AvatarContainerStyleType } from "comps/controls/styleControlConstants";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { AlignCenter, AlignLeft, AlignRight, Section, sectionNames } from "lowcoder-design";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { NumberControl, StringControl } from "comps/controls/codeControl";
import { Avatar, Tooltip } from "antd";
import { clickEvent, eventHandlerControl, refreshEvent } from "../controls/eventHandlerControl";
import styled from "styled-components";
import { useContext, ReactElement } from "react";
import { MultiCompBuilder, stateComp, withDefault } from "../generators";
import { EditorContext } from "comps/editorState";
import { IconControl } from "../controls/iconControl";
import { ColorControl } from "../controls/colorControl";
import { optionsControl } from "../controls/optionsControl";
import { BoolControl } from "../controls/boolControl";
import { dropdownControl } from "../controls/dropdownControl";
import { JSONObject } from "util/jsonTypes";

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
  .setPropertyViewFn((children) => (
    <>
      {children.src.propertyView({ label: trans("avatarComp.src"), placeholder: "", tooltip: trans("avatarComp.avatarCompTooltip") })}
      {children.label.propertyView({
        label: trans("avatarComp.title"),
        tooltip: trans("avatarComp.avatarCompTooltip"),
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
  ))
  .build();

const EventOptions = [clickEvent, refreshEvent] as const;

export const alignOptions = [
  { label: <AlignLeft />, value: "flex-start" },
  { label: <AlignCenter />, value: "center" },
  { label: <AlignRight />, value: "flex-end" },
] as const;

const childrenMap = {
  avatar: styleControl(avatarGroupStyle),
  style: styleControl(avatarContainerStyle),
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
  return new UICompBuilder(childrenMap, (props, dispatch) => <AvatarGroupView {...props} dispatch={dispatch} />)
    .setPropertyViewFn((children) => (
      <>
        {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <>
            <Section name={sectionNames.basic}>
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
                label: trans("avatarGroup.alignment"),
                radioButton: true,
              })}
            </Section>
            <Section name={sectionNames.interaction}>
              {hiddenPropertyView(children)}
              {children.onEvent.propertyView()}
            </Section>
          </>
        )}

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <>
          <Section name={sectionNames.avatarStyle}>
            {children.avatar.getPropertyView()}
          </Section>
          <Section name={sectionNames.style}>
            {children.style.getPropertyView()}
          </Section>
          </>
        )}
      </>
    ))
    .build();
})();

export const AvatarGroupComp = withExposingConfigs(AvatarGroupBasicComp, [
  new NameConfig("currentAvatar", trans("avatarGroup.currentAvatar")),
  NameConfigHidden,
]);
