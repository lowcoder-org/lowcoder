import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { UICompBuilder, withDefault } from "comps/generators";
import { Section, sectionNames } from "lowcoder-design";
import styled from "styled-components";
import { clickEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";
import { StringControl } from "comps/controls/codeControl";
import { alignWithJustifyControl } from "comps/controls/alignControl";
import { navListComp } from "./navItemComp";
import { menuPropertyView } from "./components/MenuItemList";
import { default as DownOutlined } from "@ant-design/icons/DownOutlined";
import { default as Dropdown } from "antd/es/dropdown";
import { default as Menu, MenuProps } from "antd/es/menu";
import { migrateOldData } from "comps/generators/simpleGenerators";
import { styleControl } from "comps/controls/styleControl";
import {
  AnimationStyle,
  AnimationStyleType,
  NavigationStyle,
} from "comps/controls/styleControlConstants";
import { hiddenPropertyView, showDataLoadingIndicatorsPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";

import { useContext } from "react";
import { EditorContext } from "comps/editorState";

type IProps = {
  $justify: boolean;
  $bgColor: string;
  $borderColor: string;
  $borderWidth: string;
  $borderRadius: string;
  $borderStyle: string;
  $animationStyle: AnimationStyleType;
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
`;

const NavInner = styled("div") <Pick<IProps, "$justify">>`
  // margin: 0 -16px;
  height: 100%;
  display: flex;
  justify-content: ${(props) => (props.$justify ? "space-between" : "left")};
`;

const Item = styled.div<{
  $active: boolean;
  $activeColor: string;
  $color: string;
  $fontFamily: string;
  $fontStyle: string;
  $textWeight: string;
  $textSize: string;
  $margin: string;
  $padding: string;
  $textTransform:string;
  $textDecoration:string;
}>`
  height: 30px;
  line-height: 30px;
  padding: ${(props) => props.$padding ? props.$padding : '0 16px'};
  color: ${(props) => (props.$active ? props.$activeColor : props.$color)};
  font-weight: ${(props) => (props.$textWeight ? props.$textWeight : 500)};
  font-family:${(props) => (props.$fontFamily ? props.$fontFamily : 'sans-serif')};
  font-style:${(props) => (props.$fontStyle ? props.$fontStyle : 'normal')};
  font-size:${(props) => (props.$textSize ? props.$textSize : '14px')};
  text-transform:${(props) => (props.$textTransform ? props.$textTransform : '')};
  text-decoration:${(props) => (props.$textDecoration ? props.$textDecoration : '')};
  margin:${(props) => props.$margin ? props.$margin : '0px'};
  
  &:hover {
    color: ${(props) => props.$activeColor};
    cursor: pointer;
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

const ItemList = styled.div<{ $align: string }>`
  flex: 1;
  display: flex;
  flex-direction: row;
  justify-content: ${(props) => props.$align};
`;

const StyledMenu = styled(Menu) <MenuProps>`
  &.ant-dropdown-menu {
    min-width: 160px;
  }
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

const childrenMap = {
  logoUrl: StringControl,
  logoEvent: withDefault(eventHandlerControl(logoEventHandlers), [{ name: "click" }]),
  horizontalAlignment: alignWithJustifyControl(),
  style: migrateOldData(styleControl(NavigationStyle, 'style'), fixOldStyleData),
  animationStyle: styleControl(AnimationStyle, 'animationStyle'),
  items: withDefault(navListComp(), [
    {
      label: trans("menuItem") + " 1",
    },
  ]),
};

const NavCompBase = new UICompBuilder(childrenMap, (props) => {
  const data = props.items;
  const items = (
    <>
      {data.map((menuItem, idx) => {
        const { hidden, label, items, active, onEvent } = menuItem.getView();
        if (hidden) {
          return null;
        }
        const visibleSubItems = items.filter((item) => !item.children.hidden.getView());
        const subMenuItems: Array<{ key: string; label: string }> = [];
        const subMenuSelectedKeys: Array<string> = [];
        visibleSubItems.forEach((subItem, index) => {
          const key = index + "";
          subItem.children.active.getView() && subMenuSelectedKeys.push(key);
          subMenuItems.push({
            key: key,
            label: subItem.children.label.getView(),
          });
        });
        const item = (
          <Item
            key={idx}
            $active={active || subMenuSelectedKeys.length > 0}
            $color={props.style.text}
            $activeColor={props.style.accent}
            $fontFamily={props.style.fontFamily}
            $fontStyle={props.style.fontStyle}
            $textWeight={props.style.textWeight}
            $textSize={props.style.textSize}
            $padding={props.style.padding}
            $textTransform={props.style.textTransform}
            $textDecoration={props.style.textDecoration}
            $margin={props.style.margin}
            onClick={() => onEvent("click")}
          >
            {label}
            {items.length > 0 && <DownOutlined />}
          </Item>
        );
        if (visibleSubItems.length > 0) {
          const subMenu = (
            <StyledMenu
              onClick={(e) => {
                const { onEvent: onSubEvent } = items[Number(e.key)]?.getView();
                onSubEvent("click");
              }}
              selectedKeys={subMenuSelectedKeys}
              items={subMenuItems}
            />
          );
          return (
            <Dropdown
              key={idx}
              dropdownRender={() => subMenu}
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

  return (
    <Wrapper
      $borderStyle={props.style.borderStyle}
      $animationStyle={props.animationStyle}
      $borderColor={props.style.border}
      $bgColor={props.style.background}
      $borderWidth={props.style.borderWidth}
      $borderRadius={props.style.radius}
    >
      <NavInner $justify={justify}>
        {props.logoUrl && (
          <LogoWrapper onClick={() => props.logoEvent("click")}>
            <img src={props.logoUrl} alt="LOGO" />
          </LogoWrapper>
        )}
        {!justify ? <ItemList $align={props.horizontalAlignment}>{items}</ItemList> : items}
      </NavInner>
    </Wrapper>
  );
})
  .setPropertyViewFn((children) => {
    return (
      <>
        <Section name={sectionNames.basic}>
          {menuPropertyView(children.items)}
        </Section>

        {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
          <Section name={sectionNames.interaction}>
            {hiddenPropertyView(children)}
            {showDataLoadingIndicatorsPropertyView(children)}
          </Section>
        )}

        {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
          <Section name={sectionNames.layout}>
            {children.horizontalAlignment.propertyView({
              label: trans("navigation.horizontalAlignment"),
              radioButton: true,
            })}
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
