import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { MultiCompBuilder } from "comps/generators/multi";
import { UICompBuilder, withDefault } from "comps/generators";
import { Section, sectionNames } from "lowcoder-design";
import styled from "styled-components";
import { clickEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";
import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { dropdownControl, PositionControl } from "comps/controls/dropdownControl";
import { alignWithJustifyControl } from "comps/controls/alignControl";
import { navListComp } from "./navItemComp";
import { menuPropertyView } from "./components/MenuItemList";
import { default as DownOutlined } from "@ant-design/icons/DownOutlined";
import { default as MenuOutlined } from "@ant-design/icons/MenuOutlined";
import { default as Dropdown } from "antd/es/dropdown";
import { default as Menu, MenuProps } from "antd/es/menu";
import Segmented from "antd/es/segmented";
import { Drawer, ScrollBar } from "lowcoder-design";
import { migrateOldData } from "comps/generators/simpleGenerators";
import { styleControl } from "comps/controls/styleControl";
import { IconControl } from "comps/controls/iconControl";
import { controlItem } from "components/control";
import { PreviewContainerID } from "constants/domLocators";
import {
  AnimationStyle,
  AnimationStyleType,
  NavigationStyle,
  HamburgerButtonStyle,
  DrawerContainerStyle,
  NavLayoutItemStyle,
  NavLayoutItemHoverStyle,
  NavLayoutItemActiveStyle,
  NavSubMenuItemStyle,
  NavSubMenuItemHoverStyle,
  NavSubMenuItemActiveStyle,
} from "comps/controls/styleControlConstants";
import { hiddenPropertyView, showDataLoadingIndicatorsPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";

import { useContext, useState, useCallback } from "react";
import { EditorContext } from "comps/editorState";
import { createNavItemsControl } from "./components/NavItemsControl";
import { Layers } from "constants/Layers";
import { CanvasContainerID } from "constants/domLocators";
import { isNumeric } from "util/stringUtils";
import { hasIcon } from "comps/utils";

type IProps = {
  $justify: boolean;
  $bgColor: string;
  $borderColor: string;
  $borderWidth: string;
  $borderRadius: string;
  $borderStyle: string;
  $animationStyle: AnimationStyleType;
  $orientation: "horizontal" | "vertical";
};

const Wrapper = styled("div")<
  Pick<IProps, "$bgColor" | "$borderColor" | "$borderWidth" | "$borderRadius"|"$borderStyle"|"$animationStyle">
  >`
${props=>props.$animationStyle}
  height: 100%;
  border-radius: ${(props) =>props.$borderRadius ? props.$borderRadius : '2px'};
  box-sizing: border-box;
  border: ${(props) => props.$borderWidth ? `${props.$borderWidth}` : '1px'} ${props=>props.$borderStyle} ${(props) => props.$borderColor};
  background: ${(props) => props.$bgColor};
  position: relative;
`;

const DEFAULT_SIZE = 378;

// If it is a number, use the px unit by default
function transToPxSize(size: string | number) {
  return isNumeric(size) ? size + "px" : (size as string);
}

type MenuItemStyleOptionValue = "normal" | "hover" | "active";
const menuItemStyleOptions = [
  { label: "Normal", value: "normal" },
  { label: "Hover", value: "hover" },
  { label: "Active", value: "active" },
] as const;

const NavInner = styled("div") <Pick<IProps, "$justify" | "$orientation">>`
  // margin: 0 -16px;
  height: 100%;
  display: flex;
  flex-direction: ${(props) => (props.$orientation === "vertical" ? "column" : "row")};
  justify-content: ${(props) => (props.$orientation === "vertical" ? "flex-start" : (props.$justify ? "space-between" : "left"))};
`;

const Item = styled.div<{
  $active: boolean;
  $activeColor: string;
  $hoverColor: string;
  $color: string;
  $fontFamily: string;
  $fontStyle: string;
  $textWeight: string;
  $textSize: string;
  $margin: string;
  $padding: string;
  $textTransform:string;
  $textDecoration:string;
  $bg?: string;
  $hoverBg?: string;
  $activeBg?: string;
  $border?: string;
  $hoverBorder?: string;
  $activeBorder?: string;
  $radius?: string;
  $disabled?: boolean;
}>`
  line-height: 30px;
  padding: ${(props) => props.$padding ? props.$padding : '0 16px'};
  color: ${(props) => props.$disabled ? `${props.$color}80` : (props.$active ? props.$activeColor : props.$color)};
  background-color: ${(props) => (props.$active ? (props.$activeBg || 'transparent') : (props.$bg || 'transparent'))};
  border: ${(props) => props.$border ? `1px solid ${props.$border}` : '1px solid transparent'};
  border-radius: ${(props) => props.$radius ? props.$radius : '0px'};
  font-weight: ${(props) => (props.$textWeight ? props.$textWeight : 500)};
  font-family:${(props) => (props.$fontFamily ? props.$fontFamily : 'sans-serif')};
  font-style:${(props) => (props.$fontStyle ? props.$fontStyle : 'normal')};
  font-size:${(props) => (props.$textSize ? props.$textSize : '14px')};
  text-transform:${(props) => (props.$textTransform ? props.$textTransform : '')};
  text-decoration:${(props) => (props.$textDecoration ? props.$textDecoration : '')};
  margin:${(props) => props.$margin ? props.$margin : '0px'};
  
  &:hover {
    color: ${(props) => props.$disabled ? (props.$active ? props.$activeColor : props.$color) : (props.$hoverColor || props.$activeColor)};
    background-color: ${(props) => props.$disabled ? (props.$active ? (props.$activeBg || 'transparent') : (props.$bg || 'transparent')) : (props.$hoverBg || props.$activeBg || props.$bg || 'transparent')};
    border: ${(props) => props.$hoverBorder ? `1px solid ${props.$hoverBorder}` : (props.$activeBorder ? `1px solid ${props.$activeBorder}` : (props.$border ? `1px solid ${props.$border}` : '1px solid transparent'))};
    cursor: ${(props) => props.$disabled ? 'not-allowed' : 'pointer'};
  }

  .anticon {
    margin-left: 5px;
  }
`;

const LogoWrapper = styled.div`
  cursor: pointer;
  height: 30px;
  line-height: 0;
  margin-left: 16px;

  img {
    height: 100%;
  }
`;

const ItemList = styled.div<{ $align: string, $orientation?: string }>`
  flex: 1;
  display: flex;
  flex-direction: ${(props) => (props.$orientation === "vertical" ? "column" : "row")};
  justify-content: ${(props) => props.$align};
`;

const StyledMenu = styled(Menu) <
  MenuProps & {
    $color: string;
    $hoverColor: string;
    $activeColor: string;
    $bg?: string;
    $hoverBg?: string;
    $activeBg?: string;
    $border?: string;
    $hoverBorder?: string;
    $activeBorder?: string;
    $radius?: string;
    $fontFamily?: string;
    $fontStyle?: string;
    $textWeight?: string;
    $textSize?: string;
    $padding?: string;
    $margin?: string;
    $textTransform?: string;
    $textDecoration?: string;
  }
>`
  /* Base submenu item styles */
  .ant-dropdown-menu-item{
    color: ${(p) => p.$color};
    background-color: ${(p) => p.$bg || "transparent"};
    border-radius: ${(p) => p.$radius || "0px"};
    font-weight: ${(p) => p.$textWeight || 500};
    font-family: ${(p) => p.$fontFamily || "sans-serif"};
    font-style: ${(p) => p.$fontStyle || "normal"};
    font-size: ${(p) => p.$textSize || "14px"};
    text-transform: ${(p) => p.$textTransform || "none"};
    text-decoration: ${(p) => p.$textDecoration || "none"};
    padding: ${(p) => p.$padding || "0 16px"};
    margin: ${(p) => p.$margin || "0px"};
    line-height: 30px;
  }
  /* Hover state */
  .ant-dropdown-menu-item:hover{
    color: ${(p) => p.$hoverColor || p.$activeColor};
    background-color: ${(p) => p.$hoverBg || "transparent"} !important;
    cursor: pointer;
  }
  /* Selected/active state */
  .ant-dropdown-menu-item-selected,
  .ant-menu-item-selected {
    color: ${(p) => p.$activeColor};
    background-color: ${(p) => p.$activeBg || p.$bg || "transparent"};
    border: ${(p) => (p.$activeBorder ? `1px solid ${p.$activeBorder}` : "1px solid transparent")};
  }
  /* Disabled state */
  .ant-dropdown-menu-item-disabled,
  .ant-menu-item-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FloatingHamburgerButton = styled.button<{
  $size: string;
  $position: string; // left | right
  $zIndex: number;
  $background?: string;
  $borderColor?: string;
  $radius?: string;
  $margin?: string;
  $padding?: string;
  $borderWidth?: string;
  $iconColor?: string;
}>`
  position: fixed;
  top: 16px;
  ${(props) => (props.$position === 'right' ? 'right: 16px;' : 'left: 16px;')}
  width: ${(props) => props.$size};
  height: ${(props) => props.$size};
  border-radius: ${(props) => props.$radius || '50%'};
  border: ${(props) => props.$borderWidth || '1px'} solid ${(props) => props.$borderColor || 'rgba(0,0,0,0.1)'};
  background: ${(props) => props.$background || 'white'};
  margin: ${(props) => props.$margin || '0px'};
  padding: ${(props) => props.$padding || '0px'};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${(props) => props.$zIndex};
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(0,0,0,0.15);
  color: ${(props) => props.$iconColor || 'inherit'};
`;

const DrawerContent = styled.div<{
  $background: string;
  $padding?: string;
  $borderColor?: string;
  $borderWidth?: string;
  $margin?: string;
}>`
  background: ${(p) => p.$background};
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: ${(p) => p.$padding || '12px'};
  margin: ${(p) => p.$margin || '0px'};
  box-sizing: border-box;
  border: ${(p) => p.$borderWidth || '1px'} solid ${(p) => p.$borderColor || 'transparent'};
`;

const DrawerHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

const DrawerCloseButton = styled.button<{
  $color: string;
}>`
  background: transparent;
  border: none;
  cursor: pointer;
  color: ${(p) => p.$color};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 16px;
`;

const logoEventHandlers = [clickEvent];

// Compatible with historical style data 2022-8-26
function fixOldStyleData(oldData: any) {
  if (
    oldData &&
    (oldData.hasOwnProperty("accentColor") ||
      oldData.hasOwnProperty("backgroundColor") ||
      oldData.hasOwnProperty("borderColor") ||
      oldData.hasOwnProperty("color"))
  ) {
    return {
      text: oldData.color,
      accent: oldData.accentColor,
      background: oldData.backgroundColor,
      border: oldData.borderColor,
    };
  }
  return oldData;
}

function fixOldItemsData(oldData: any) {
  if (Array.isArray(oldData)) {
    return {
      optionType: "manual",
      manual: oldData,
    };
  }
  if (oldData && !oldData.optionType && Array.isArray(oldData.manual)) {
    return {
      optionType: "manual",
      manual: oldData.manual,
    };
  }
  return oldData;
}

// Property View Helpers
function renderBasicSection(children: any) {
  return (
    <Section name={sectionNames.basic}>
      {children.items.propertyView()}
    </Section>
  );
}

function renderInteractionSection(children: any) {
  return (
    <Section name={sectionNames.interaction}>
      {hiddenPropertyView(children)}
      {showDataLoadingIndicatorsPropertyView(children)}
    </Section>
  );
}

function renderLayoutSection(children: any) {
  const isHamburger = children.displayMode.getView() === 'hamburger';
  const common = [
    children.displayMode.propertyView({ label: "Display Mode", radioButton: true }),
  ];
  const hamburger = [
    ...common,
    children.hamburgerPosition.propertyView({ label: "Hamburger Position", radioButton: true }),
    children.hamburgerSize.propertyView({ label: "Hamburger Size" }),
    children.placement.propertyView({ label: trans("drawer.placement"), radioButton: true }),
    ...(["top", "bottom"].includes(children.placement.getView())
      ? [children.drawerHeight.propertyView({
          label: trans("drawer.height"),
          tooltip: trans("drawer.heightTooltip"),
          placeholder: DEFAULT_SIZE + "",
        })]
      : [children.drawerWidth.propertyView({
          label: trans("drawer.width"),
          tooltip: trans("drawer.widthTooltip"),
          placeholder: DEFAULT_SIZE + "",
        })]),
    children.hamburgerIcon.propertyView({ label: "Menu Icon" }),
    children.drawerCloseIcon.propertyView({ label: "Close Icon" }),
    children.shadowOverlay.propertyView({ label: "Shadow Overlay" }),
  ];
  const bar = [
    ...common,
    children.orientation.propertyView({ label: "Orientation", radioButton: true }),
    children.horizontalAlignment.propertyView({
      label: trans("navigation.horizontalAlignment"),
      radioButton: true,
    }),
  ];

  return (
    <Section name={sectionNames.layout}>
      {isHamburger ? hamburger : bar}
    </Section>
  );
}

function renderAdvancedSection(children: any) {
  return (
    <Section name={sectionNames.advanced}>
      {children.logoUrl.propertyView({ label: trans("navigation.logoURL"), tooltip: trans("navigation.logoURLDesc") })}
      {children.logoUrl.getView() && children.logoEvent.propertyView({ inline: true })}
    </Section>
  );
}

function renderStyleSections(
  children: any,
  styleSegment: MenuItemStyleOptionValue,
  setStyleSegment: (k: MenuItemStyleOptionValue) => void,
  subStyleSegment: MenuItemStyleOptionValue,
  setSubStyleSegment: (k: MenuItemStyleOptionValue) => void
) {
  const isHamburger = children.displayMode.getView() === 'hamburger';
  return (
    <>
      {!isHamburger && (
        <Section name={sectionNames.style}>
          {children.style.getPropertyView()}
        </Section>
      )}
      <Section name={trans("navLayout.navItemStyle")}>
        {controlItem({}, (
          <Segmented
            block
            options={menuItemStyleOptions as any}
            value={styleSegment}
            onChange={(k) => setStyleSegment(k as MenuItemStyleOptionValue)}
          />
        ))}
        {styleSegment === "normal" && children.navItemStyle.getPropertyView()}
        {styleSegment === "hover" && children.navItemHoverStyle.getPropertyView()}
        {styleSegment === "active" && children.navItemActiveStyle.getPropertyView()}
      </Section>
      <Section name={"Submenu Item Style"}>
        {controlItem({}, (
          <Segmented
            block
            options={menuItemStyleOptions as any}
            value={subStyleSegment}
            onChange={(k) => setSubStyleSegment(k as MenuItemStyleOptionValue)}
          />
        ))}
        {subStyleSegment === "normal" && children.subNavItemStyle.getPropertyView()}
        {subStyleSegment === "hover" && children.subNavItemHoverStyle.getPropertyView()}
        {subStyleSegment === "active" && children.subNavItemActiveStyle.getPropertyView()}
      </Section>
      {isHamburger && (
        <>
          <Section name={"Hamburger Button Style"}>
            {children.hamburgerButtonStyle.getPropertyView()}
          </Section>
          <Section name={"Drawer Container Style"}>
            {children.drawerContainerStyle.getPropertyView()}
          </Section>
        </>
      )}
      <Section name={sectionNames.animationStyle} hasTooltip={true}>
        {children.animationStyle.getPropertyView()}
      </Section>
    </>
  );
}

const childrenMap = {
  logoUrl: StringControl,
  logoEvent: withDefault(eventHandlerControl(logoEventHandlers), [{ name: "click" }]),
  orientation: dropdownControl([
    { label: "Horizontal", value: "horizontal" },
    { label: "Vertical", value: "vertical" },
  ], "horizontal"),
  displayMode: dropdownControl([
    { label: "Bar", value: "bar" },
    { label: "Hamburger", value: "hamburger" },
  ], "bar"),
  hamburgerPosition: dropdownControl([
    { label: "Left", value: "left" },
    { label: "Right", value: "right" },
  ], "right"),
  hamburgerSize: withDefault(StringControl, "56px"),
  placement: PositionControl,
  drawerWidth: StringControl,
  drawerHeight: StringControl,
  hamburgerIcon: withDefault(IconControl, ""),
  drawerCloseIcon: withDefault(IconControl, ""),
  shadowOverlay: withDefault(BoolCodeControl, true),
  horizontalAlignment: alignWithJustifyControl(),
  style: migrateOldData(styleControl(NavigationStyle, 'style'), fixOldStyleData),
  navItemStyle: styleControl(NavLayoutItemStyle, 'navItemStyle'),
  navItemHoverStyle: styleControl(NavLayoutItemHoverStyle, 'navItemHoverStyle'),
  navItemActiveStyle: styleControl(NavLayoutItemActiveStyle, 'navItemActiveStyle'),
  hamburgerButtonStyle: styleControl(HamburgerButtonStyle, 'hamburgerButtonStyle'),
  drawerContainerStyle: styleControl(DrawerContainerStyle, 'drawerContainerStyle'),
  animationStyle: styleControl(AnimationStyle, 'animationStyle'),
  subNavItemStyle: styleControl(NavSubMenuItemStyle, 'subNavItemStyle'),
  subNavItemHoverStyle: styleControl(NavSubMenuItemHoverStyle, 'subNavItemHoverStyle'),
  subNavItemActiveStyle: styleControl(NavSubMenuItemActiveStyle, 'subNavItemActiveStyle'),
  items: withDefault(migrateOldData(createNavItemsControl(), fixOldItemsData), {
    optionType: "manual",
    manual: [
      {
        label: trans("menuItem") + " 1",
      },
    ],
  }),
};

const NavCompBase = new UICompBuilder(childrenMap, (props) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const getContainer = useCallback(() =>
    document.querySelector(`#${CanvasContainerID}`) || document.querySelector(`#${PreviewContainerID}`) || document.body,
    []
  );
  const data = props.items;
  const items = (
    <>
      {data.map((menuItem: any, idx: number) => {
        const isCompItem = typeof menuItem?.getView === "function";
        const view = isCompItem ? menuItem.getView() : menuItem;
        const hidden = !!view?.hidden;
        if (hidden) {
          return null;
        }

        const label = view?.label;
        const icon = hasIcon(view?.icon) ? view.icon : undefined;
        const active = !!view?.active;
        const onEvent = view?.onEvent;
        const disabled = !!view?.disabled;
        const subItems = isCompItem ? view?.items : [];

        const subMenuItems: Array<{ key: string; label: any; icon?: any; disabled?: boolean }> = [];
        const subMenuSelectedKeys: Array<string> = [];

        if (Array.isArray(subItems)) {
          subItems.forEach((subItem: any, originalIndex: number) => {
            if (subItem.children.hidden.getView()) {
              return;
            }
            const key = originalIndex + "";
            subItem.children.active.getView() && subMenuSelectedKeys.push(key);
            const subIcon = hasIcon(subItem.children.icon?.getView?.()) ? subItem.children.icon.getView() : undefined;
            subMenuItems.push({
              key: key,
              label: subItem.children.label.getView(),
              icon: subIcon,
              disabled: !!subItem.children.disabled.getView(),
            });
          });
        }

        const item = (
          <Item
            key={idx}
            $active={active || subMenuSelectedKeys.length > 0}
            $color={(props.navItemStyle && props.navItemStyle.text) || props.style.text}
            $hoverColor={(props.navItemHoverStyle && props.navItemHoverStyle.text) || props.style.accent}
            $activeColor={(props.navItemActiveStyle && props.navItemActiveStyle.text) || props.style.accent}
            $fontFamily={props.style.fontFamily}
            $fontStyle={props.style.fontStyle}
            $textWeight={props.style.textWeight}
            $textSize={props.style.textSize}
            $padding={(props.navItemStyle && props.navItemStyle.padding) || props.style.padding}
            $textTransform={props.style.textTransform}
            $textDecoration={props.style.textDecoration}
            $margin={(props.navItemStyle && props.navItemStyle.margin) || props.style.margin}
            $bg={(props.navItemStyle && props.navItemStyle.background) || undefined}
            $hoverBg={(props.navItemHoverStyle && props.navItemHoverStyle.background) || undefined}
            $activeBg={(props.navItemActiveStyle && props.navItemActiveStyle.background) || undefined}
            $border={(props.navItemStyle && props.navItemStyle.border) || undefined}
            $hoverBorder={(props.navItemHoverStyle && props.navItemHoverStyle.border) || undefined}
            $activeBorder={(props.navItemActiveStyle && props.navItemActiveStyle.border) || undefined}
            $radius={(props.navItemStyle && props.navItemStyle.radius) || undefined}
            $disabled={disabled}
            onClick={() => { if (!disabled && onEvent) onEvent("click"); }}
          >
            {icon && <span style={{ display: 'inline-flex', marginRight: '8px' }}>{icon}</span>}
            {label}
            {Array.isArray(subItems) && subItems.length > 0 && <DownOutlined />}
          </Item>
        );
        if (subMenuItems.length > 0) {
          const subMenu = (
            <ScrollBar style={{ height: "200px" }}>
              <StyledMenu
                onClick={(e) => {
                  if (disabled) return;
                  const subItem = subItems[Number(e.key)];
                  const isSubDisabled = !!subItem?.children?.disabled?.getView?.();
                  if (isSubDisabled) return;
                  const onSubEvent = subItem?.getView()?.onEvent;
                  onSubEvent && onSubEvent("click");
                }}
                selectedKeys={subMenuSelectedKeys}
                items={subMenuItems.map(item => ({
                  ...item,
                  icon: item.icon || undefined,
                }))}
                $color={(props.subNavItemStyle && props.subNavItemStyle.text) || props.style.text}
                $hoverColor={(props.subNavItemHoverStyle && props.subNavItemHoverStyle.text) || props.style.accent}
                $activeColor={(props.subNavItemActiveStyle && props.subNavItemActiveStyle.text) || props.style.accent}
                $bg={(props.subNavItemStyle && props.subNavItemStyle.background) || undefined}
                $hoverBg={(props.subNavItemHoverStyle && props.subNavItemHoverStyle.background) || undefined}
                $activeBg={(props.subNavItemActiveStyle && props.subNavItemActiveStyle.background) || undefined}
                $border={(props.subNavItemStyle && props.subNavItemStyle.border) || undefined}
                $hoverBorder={(props.subNavItemHoverStyle && props.subNavItemHoverStyle.border) || undefined}
                $activeBorder={(props.subNavItemActiveStyle && props.subNavItemActiveStyle.border) || undefined}
                $radius={(props.subNavItemStyle && props.subNavItemStyle.radius) || undefined}
                $fontFamily={props.style.fontFamily}
                $fontStyle={props.style.fontStyle}
                $textWeight={props.style.textWeight}
                $textSize={props.style.textSize}
                $padding={(props.subNavItemStyle && props.subNavItemStyle.padding) || props.style.padding}
                $margin={(props.subNavItemStyle && props.subNavItemStyle.margin) || props.style.margin}
                $textTransform={props.style.textTransform}
                $textDecoration={props.style.textDecoration}
              />
            </ScrollBar>
          );
          return (
            <Dropdown
              key={idx}
              popupRender={() => subMenu}
              disabled={disabled}
            >
              {item}
            </Dropdown>
          );
        }
        return item;
      })}
    </>
  );

  const justify = props.horizontalAlignment === "justify";
  const isVertical = props.orientation === "vertical";
  const isHamburger = props.displayMode === "hamburger";

  return (
    <Wrapper
      $borderStyle={props.style.borderStyle}
      $animationStyle={props.animationStyle}
      $borderColor={props.style.border}
      $bgColor={props.style.background}
      $borderWidth={props.style.borderWidth}
      $borderRadius={props.style.radius}
    >
      {!isHamburger && (
        <NavInner $justify={justify} $orientation={isVertical ? "vertical" : "horizontal"}>
          {props.logoUrl && (
            <LogoWrapper onClick={() => props.logoEvent("click")}>
              <img src={props.logoUrl} alt="LOGO" />
            </LogoWrapper>
          )}
          {!justify ? <ItemList $align={props.horizontalAlignment} $orientation={isVertical ? "vertical" : "horizontal"}>{items}</ItemList> : items}
        </NavInner>
      )}
      {isHamburger && (
        <>
          <FloatingHamburgerButton
            $size={props.hamburgerSize || "56px"}
            $position={props.hamburgerPosition || "right"}
            $zIndex={Layers.tabBar + 1}
            $background={props.hamburgerButtonStyle?.background}
            $borderColor={props.hamburgerButtonStyle?.border}
            $radius={props.hamburgerButtonStyle?.radius}
            $margin={props.hamburgerButtonStyle?.margin}
            $padding={props.hamburgerButtonStyle?.padding}
            $borderWidth={props.hamburgerButtonStyle?.borderWidth}
            $iconColor={props.hamburgerButtonStyle?.iconFill}
            onClick={() => setDrawerVisible(true)}
          >
            {hasIcon(props.hamburgerIcon) ? props.hamburgerIcon : <MenuOutlined />}
          </FloatingHamburgerButton>
          <Drawer
            placement={props.placement || "right"}
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            mask={props.shadowOverlay}
            maskClosable={true}
            closable={false}
            getContainer={getContainer}
            width={["left", "right"].includes(props.placement as any) ? transToPxSize(props.drawerWidth || DEFAULT_SIZE) : undefined as any}
            height={["top", "bottom"].includes(props.placement as any) ? transToPxSize(props.drawerHeight || DEFAULT_SIZE) : undefined as any}
            styles={{ body: { padding: 0 } }}
            destroyOnClose
          >
            <DrawerContent 
              $background={props.drawerContainerStyle?.background || '#FFFFFF'}
              $padding={props.drawerContainerStyle?.padding}
              $borderColor={props.drawerContainerStyle?.border}
              $borderWidth={props.drawerContainerStyle?.borderWidth}
              $margin={props.drawerContainerStyle?.margin}
            >
              <DrawerHeader>
                <DrawerCloseButton
                  aria-label="Close"
                  $color={props.style.text}
                  onClick={() => setDrawerVisible(false)}
                >
                  {hasIcon(props.drawerCloseIcon)
                    ? props.drawerCloseIcon
                    : <span style={{ fontSize: 20 }}>×</span>}
                </DrawerCloseButton>
              </DrawerHeader>
              <ItemList $align={"flex-start"} $orientation={"vertical"}>{items}</ItemList>
            </DrawerContent>
          </Drawer>
        </>
      )}
    </Wrapper>
  );
})
  .setPropertyViewFn((children) => {
    const mode = useContext(EditorContext).editorModeStatus;
    const showLogic = mode === "logic" || mode === "both";
    const showLayout = mode === "layout" || mode === "both";
    const [styleSegment, setStyleSegment] = useState<MenuItemStyleOptionValue>("normal");
    const [subStyleSegment, setSubStyleSegment] = useState<MenuItemStyleOptionValue>("normal");

    return (
      <>
        {renderBasicSection(children)}
        {showLogic && renderInteractionSection(children)}
        {showLayout && renderLayoutSection(children)}
        {showLogic && renderAdvancedSection(children)}
        {showLayout && renderStyleSections(children, styleSegment, setStyleSegment, subStyleSegment, setSubStyleSegment)}
      </>
    );
  })
  .build();

export const NavComp = withExposingConfigs(NavCompBase, [
  new NameConfig("logoUrl", trans("navigation.logoURLDesc")),
  NameConfigHidden,
  new NameConfig("items", trans("navigation.itemsDesc")),
]);
