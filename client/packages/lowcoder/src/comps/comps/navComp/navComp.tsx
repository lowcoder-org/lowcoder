import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { MultiCompBuilder } from "comps/generators/multi";
import { UICompBuilder, withDefault } from "comps/generators";
import { Section, sectionNames } from "lowcoder-design";
import styled from "styled-components";
import { clickEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";
import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { alignWithJustifyControl } from "comps/controls/alignControl";
import { navListComp } from "./navItemComp";
import { menuPropertyView } from "./components/MenuItemList";
import { default as DownOutlined } from "@ant-design/icons/DownOutlined";
import { default as MenuOutlined } from "@ant-design/icons/MenuOutlined";
import { default as Dropdown } from "antd/es/dropdown";
import { default as Menu, MenuProps } from "antd/es/menu";
import { default as Drawer } from "antd/es/drawer";
import { migrateOldData } from "comps/generators/simpleGenerators";
import { styleControl } from "comps/controls/styleControl";
import {
  AnimationStyle,
  AnimationStyleType,
  NavigationStyle,
  HamburgerButtonStyle,
  DrawerContainerStyle,
  NavLayoutItemStyle,
  NavLayoutItemHoverStyle,
  NavLayoutItemActiveStyle,
} from "comps/controls/styleControlConstants";
import { hiddenPropertyView, showDataLoadingIndicatorsPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";

import { useContext, useState } from "react";
import { EditorContext } from "comps/editorState";
import { createNavItemsControl } from "./components/NavItemsControl";
import { Layers } from "constants/Layers";

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
  height: 30px;
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

const StyledMenu = styled(Menu) <MenuProps>`
  &.ant-dropdown-menu {
    min-width: 160px;
  }
`;

const FloatingHamburgerButton = styled.button<{
  $size: string;
  $position: string; // top-right | top-left | bottom-right | bottom-left
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
  ${(props) => (props.$position.includes('bottom') ? 'bottom: 16px;' : 'top: 16px;')}
  ${(props) => (props.$position.includes('right') ? 'right: 16px;' : 'left: 16px;')}
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
    { label: "Top Right", value: "top-right" },
    { label: "Top Left", value: "top-left" },
    { label: "Bottom Right", value: "bottom-right" },
    { label: "Bottom Left", value: "bottom-left" },
  ], "top-right"),
  hamburgerSize: withDefault(StringControl, "56px"),
  drawerPlacement: dropdownControl([
    { label: "Left", value: "left" },
    { label: "Right", value: "right" },
  ], "right"),
  shadowOverlay: withDefault(BoolCodeControl, true),
  horizontalAlignment: alignWithJustifyControl(),
  style: migrateOldData(styleControl(NavigationStyle, 'style'), fixOldStyleData),
  navItemStyle: styleControl(NavLayoutItemStyle, 'navItemStyle'),
  navItemHoverStyle: styleControl(NavLayoutItemHoverStyle, 'navItemHoverStyle'),
  navItemActiveStyle: styleControl(NavLayoutItemActiveStyle, 'navItemActiveStyle'),
  hamburgerButtonStyle: styleControl(HamburgerButtonStyle, 'hamburgerButtonStyle'),
  drawerContainerStyle: styleControl(DrawerContainerStyle, 'drawerContainerStyle'),
  animationStyle: styleControl(AnimationStyle, 'animationStyle'),
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
        const active = !!view?.active;
        const onEvent = view?.onEvent;
        const disabled = !!view?.disabled;
        const subItems = isCompItem ? view?.items : [];

        const subMenuItems: Array<{ key: string; label: any; disabled?: boolean }> = [];
        const subMenuSelectedKeys: Array<string> = [];

        if (Array.isArray(subItems)) {
          subItems.forEach((subItem: any, originalIndex: number) => {
            if (subItem.children.hidden.getView()) {
              return;
            }
            const key = originalIndex + "";
            subItem.children.active.getView() && subMenuSelectedKeys.push(key);
            subMenuItems.push({
              key: key,
              label: subItem.children.label.getView(),
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
            {label}
            {Array.isArray(subItems) && subItems.length > 0 && <DownOutlined />}
          </Item>
        );
        if (subMenuItems.length > 0) {
          const subMenu = (
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
              items={subMenuItems}
            />
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
            $position={props.hamburgerPosition || "top-right"}
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
            <MenuOutlined />
          </FloatingHamburgerButton>
          <Drawer
            placement={(props.drawerPlacement as any) || "right"}
            closable={true}
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            mask={props.shadowOverlay}
            styles={{ body: { padding: "8px", background: props.drawerContainerStyle?.background } }}
            destroyOnClose
          >
            <ItemList $align={"flex-start"} $orientation={"vertical"}>{items}</ItemList>
          </Drawer>
        </>
      )}
    </Wrapper>
  );
})
  .setPropertyViewFn((children) => {
    return (
      <>
        <Section name={sectionNames.basic}>
          {children.items.propertyView()}
        </Section>

        {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
          <Section name={sectionNames.interaction}>
            {hiddenPropertyView(children)}
            {showDataLoadingIndicatorsPropertyView(children)}
          </Section>
        )}

        {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
          <Section name={sectionNames.layout}>
            {children.orientation.propertyView({ label: "Orientation", radioButton: true })}
            {children.displayMode.propertyView({ label: "Display Mode", radioButton: true })}
            {children.displayMode.getView() === 'hamburger' ? (
              [
                children.hamburgerPosition.propertyView({ label: "Hamburger Position" }),
                children.hamburgerSize.propertyView({ label: "Hamburger Size" }),
                children.drawerPlacement.propertyView({ label: "Drawer Placement", radioButton: true }),
                children.shadowOverlay.propertyView({ label: "Shadow Overlay" }),
              ]
            ) : (
              children.horizontalAlignment.propertyView({
                label: trans("navigation.horizontalAlignment"),
                radioButton: true,
              })
            )}
            {hiddenPropertyView(children)}
          </Section>
        )}

        {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
          <Section name={sectionNames.advanced}>
            {children.logoUrl.propertyView({ label: trans("navigation.logoURL"), tooltip: trans("navigation.logoURLDesc") })}
            {children.logoUrl.getView() && children.logoEvent.propertyView({ inline: true })}
          </Section>
        )}

        {(useContext(EditorContext).editorModeStatus === "layout" ||
          useContext(EditorContext).editorModeStatus === "both") && (
          <>
            <Section name={sectionNames.style}>
              {children.style.getPropertyView()}
            </Section>
            <Section name={"Item Style"}>
              {children.navItemStyle.getPropertyView()}
            </Section>
            <Section name={"Item Hover Style"}>
              {children.navItemHoverStyle.getPropertyView()}
            </Section>
            <Section name={"Item Active Style"}>
              {children.navItemActiveStyle.getPropertyView()}
            </Section>
            {children.displayMode.getView() === 'hamburger' && (
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
        )}
      </>
    );
  })
  .build();

export const NavComp = withExposingConfigs(NavCompBase, [
  new NameConfig("logoUrl", trans("navigation.logoURLDesc")),
  NameConfigHidden,
  new NameConfig("items", trans("navigation.itemsDesc")),
]);
