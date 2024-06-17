import styled from "styled-components";
import { RecordConstructorToView } from "lowcoder-core";
import { styleControl } from "comps/controls/styleControl";
import _ from "lodash";
import {
  avatarContainerStyle,
  AvatarContainerStyleType,
  avatarLabelStyle,
  AvatarLabelStyleType,
  AvatarStyle,
  AvatarStyleType,
} from "comps/controls/styleControlConstants";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { withDefault } from "../generators";
import {
  NameConfig,
  NameConfigHidden,
  withExposingConfigs,
} from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { NumberControl } from "comps/controls/codeControl";
import { IconControl } from "comps/controls/iconControl";
import {
  clickEvent,
  eventHandlerControl,
} from "../controls/eventHandlerControl";
import { Avatar, AvatarProps, Badge, Dropdown, Menu } from "antd";
import { LeftRightControl, dropdownControl } from "../controls/dropdownControl";
import { stringExposingStateControl } from "../controls/codeStateControl";
import { BoolControl } from "../controls/boolControl";
import { BadgeBasicSection, badgeChildren } from "./badgeComp/badgeConstants";
import { DropdownOptionControl } from "../controls/optionsControl";
import { ReactElement, useContext } from "react";
import { CompNameContext, EditorContext } from "../editorState";

const AvatarWrapper = styled(Avatar) <AvatarProps & { $cursorPointer?: boolean, $style: AvatarStyleType }>`
  background: ${(props) => props.$style.background};
  color: ${(props) => props.$style.fill};
  cursor: ${(props) => props.$cursorPointer ? 'pointer' : ''};
`;

const Wrapper = styled.div <{ iconSize: number, labelPosition: string,$style: AvatarContainerStyleType}>`
display: flex;
width: 100%;
height: 100%;
align-items: center;
flex-direction: ${(props) => props.labelPosition === 'left' ? 'row' : 'row-reverse'};
${(props) => {
    return (
      props.$style && {
        ...props.$style,
        borderRadius: props.$style.radius,
      }
    );
  }}
`

const LabelWrapper = styled.div<{ iconSize: number, alignmentPosition: string }>`
width: calc(100% - ${(props) => props.iconSize}px);
display: flex;
padding-left: 5px;
padding-right: 5px;
flex-direction: column;
justify-content: flex-end;
align-items: ${(props) => props.alignmentPosition === 'left' ? 'flex-start' : 'flex-end'};
`
const LabelSpan = styled.span<{ $style:AvatarLabelStyleType }>`
max-width: 100%;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
font-weight: ${props=>props.$style.textWeight};
border-radius: ${props=>props.$style.radius};
font-size: ${props=>props.$style.textSize};
text-transform: ${props=>props.$style.textTransform};
color: ${props=>props.$style.text};
border: ${props => props.$style.border};
border-style: ${props=>props.$style.borderStyle};
border-width: ${props=>props.$style.borderWidth};
font-family: ${props=>props.$style.fontFamily};
font-style: ${props=>props.$style.fontStyle};
margin: ${props=>props.$style.margin};
padding: ${props=>props.$style.padding};
background: ${props=>props.$style.background};
text-decoration: ${props=>props.$style.textDecoration};
`
const CaptionSpan = styled.span<{ $style:AvatarLabelStyleType }>`
max-width: 100%;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
font-weight: ${props=>props.$style.textWeight};
border-radius: ${props=>props.$style.radius};
font-size: ${props=>props.$style.textSize};
text-transform: ${props=>props.$style.textTransform};
color: ${props=>props.$style.text};
border: ${props => props.$style.border};
border-style: ${props=>props.$style.borderStyle};
border-width: ${props=>props.$style.borderWidth};
font-family: ${props=>props.$style.fontFamily};
font-style: ${props=>props.$style.fontStyle};
margin: ${props=>props.$style.margin};
padding: ${props=>props.$style.padding};
background: ${props=>props.$style.background};
text-decoration: ${props => props.$style.textDecoration};
`
const EventOptions = [clickEvent] as const;
const sharpOptions = [
  { label: trans("avatarComp.square"), value: "square" },
  { label: trans("avatarComp.circle"), value: "circle" },
] as const;

const sideOptions = [
  { label: trans('labelProp.left'), value: "left" },
  { label: trans('labelProp.right'), value: "right" },
] as const;

const childrenMap = {
  style: styleControl(avatarContainerStyle),
  avatarStyle: styleControl(AvatarStyle),
  labelStyle: styleControl(avatarLabelStyle),
  captionStyle: styleControl(avatarLabelStyle),
  icon: withDefault(IconControl, "/icon:solid/user"),
  iconSize: withDefault(NumberControl, 40),
  onEvent: eventHandlerControl(EventOptions),
  shape: dropdownControl(sharpOptions, "circle"),
  title: stringExposingStateControl("title", ""),
  src: stringExposingStateControl("src", ""),
  avatarLabel: stringExposingStateControl("avatarLabel", "{{currentUser.name}}"),
  avatarCatption: stringExposingStateControl("avatarCatption", "{{currentUser.email}}"),
  labelPosition: dropdownControl(sideOptions, 'left'),
  alignmentPosition: withDefault(LeftRightControl, 'left'),
  enableDropdownMenu: BoolControl,
  options: DropdownOptionControl,
  ...badgeChildren,
};

const AvatarView = (props: RecordConstructorToView<typeof childrenMap>) => {
  const { shape, title, src, iconSize } = props;
  const comp = useContext(EditorContext).getUICompByName(useContext(CompNameContext));
  // const eventsCount = comp ? Object.keys(comp?.children.comp.children.onEvent.children).length : 0;
  const hasIcon = props.options.findIndex((option) => (option.prefixIcon as ReactElement)?.props.value) > -1;
  const items = props.options
    .filter((option) => !option.hidden)
    .map((option, index) => ({
      title: option.label,
      label: option.label,
      key: option.label + " - " + index,
      disabled: option.disabled,
      icon: hasIcon && <span>{option.prefixIcon}</span>,
      onEvent: option.onEvent,
    }));
  const menu = (
    <Menu
      items={items}
      onClick={({ key }) => items.find((o) => o.key === key)?.onEvent("click")}
    />
  );
  return (
    <Dropdown
      menu={{ items }}
      placement={props.labelPosition === 'left' ? "bottomLeft" : "bottomRight"}
      arrow
      disabled={!props.enableDropdownMenu}
      dropdownRender={() => menu}
    >
      <Wrapper iconSize={props.iconSize} labelPosition={props.labelPosition} $style={props.style}>
        <Badge
          count={props.badgeCount.value}
          dot={props.badgeType === 'dot'}
          size={props.badgeSize}
          overflowCount={props.overflowCount}
          title={props.badgeTitle}
          offset={props.shape === 'circle' ? [-2, 6] : [0, 0]}
        >
          <AvatarWrapper
            size={iconSize}
            icon={title.value !== '' ? null : props.icon}
            shape={shape}
            $style={props.avatarStyle}
            src={src.value}
            // $cursorPointer={eventsCount > 0}
            onClick={() => props.onEvent("click")}
          >
            {title.value}
          </AvatarWrapper>
        </Badge>
        <LabelWrapper iconSize={props.iconSize} alignmentPosition={props.alignmentPosition}>
          <LabelSpan $style={props.labelStyle}>{props.avatarLabel.value}</LabelSpan>
          <CaptionSpan $style={props.captionStyle}>{props.avatarCatption.value}</CaptionSpan>
        </LabelWrapper>
      </Wrapper>
    </Dropdown>
  );
};

let AvatarBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props) => <AvatarView {...props} />)
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.src.propertyView({
            label: trans("avatarComp.src"),
            placeholder: "http://xxxx/xx.jpg",
            tooltip: trans("avatarComp.avatarCompTooltip"),
          })}
          {children.title.propertyView({
            label: trans("avatarComp.title"),
            tooltip: trans("avatarComp.avatarCompTooltip"),
          })}
          {children.icon.propertyView({
            label: trans("avatarComp.icon"),
            IconType: "All",
            tooltip: trans("avatarComp.avatarCompTooltip"),
          })}
          {children.shape.propertyView({
            label: trans("avatarComp.shape"),
            radioButton: true,
          })}
          {
            children.iconSize.propertyView({
              label: trans("avatarComp.iconSize"),
            })}
          {
            children.enableDropdownMenu.propertyView({
              label: trans("avatarComp.enableDropDown")
            })}
          {children.enableDropdownMenu.getView() && children.options.propertyView({})}
        </Section>
        <Section name={trans('avatarComp.label')}>
          {
            children.avatarLabel.propertyView({
              label: trans("avatarComp.label"),
            })}
          {
            children.avatarCatption.propertyView({
              label: trans("avatarComp.caption"),
            })}
          {
            children.labelPosition.propertyView({
              label: trans("avatarComp.labelPosition"),
              radioButton: true,
            })}
          {
            children.alignmentPosition.propertyView({
              label: trans("avatarComp.alignmentPosition"),
              radioButton: true,
            })}
        </Section>
        {<BadgeBasicSection {...children} />}
        <Section name={sectionNames.interaction}>
          {children.onEvent.getPropertyView()}
        </Section>
        <Section name={sectionNames.layout}>
          {hiddenPropertyView(children)}
        </Section>
        <Section name={sectionNames.style}>
          {children.style.getPropertyView()}
        </Section>
        <Section name={sectionNames.avatarStyle}>
          {children.avatarStyle.getPropertyView()}
        </Section>
        <Section name={sectionNames.labelStyle}>
          {children.labelStyle.getPropertyView()}
        </Section>
        <Section name={sectionNames.captionStyle}>
          {children.captionStyle.getPropertyView()}
        </Section>
      </>
    ))
    .build();
})();


export const AvatarComp = withExposingConfigs(AvatarBasicComp, [
  NameConfigHidden,
  new NameConfig("badgeCount", trans("button.textDesc")),
]);
