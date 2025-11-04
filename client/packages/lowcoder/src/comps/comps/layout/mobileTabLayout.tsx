import { MultiCompBuilder, withDefault, withViewFn } from "comps/generators";
import { trans } from "i18n";
import { Section, sectionNames } from "components/Section";
import { manualOptionsControl } from "comps/controls/optionsControl";
import { BoolCodeControl, StringControl, jsonControl, NumberControl } from "comps/controls/codeControl";
import { IconControl } from "comps/controls/iconControl";
import styled from "styled-components";
import React, { Suspense, useContext, useEffect, useMemo, useState } from "react";  
import { registerLayoutMap } from "comps/comps/uiComp";
import { AppSelectComp } from "comps/comps/layout/appSelectComp";
import { NameAndExposingInfo } from "comps/utils/exposingTypes";
import { ConstructorToComp, ConstructorToDataType } from "lowcoder-core";
import { CanvasContainer } from "comps/comps/gridLayoutComp/canvasView";
import { CanvasContainerID } from "constants/domLocators";
import { EditorContainer, EmptyContent } from "pages/common/styledComponent";
import { Layers } from "constants/Layers";
import { ExternalEditorContext } from "util/context/ExternalEditorContext";
import { default as Skeleton } from "antd/es/skeleton";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { dropdownControl } from "@lowcoder-ee/comps/controls/dropdownControl";
import { DataOption, DataOptionType, menuItemStyleOptions, mobileNavJsonMenuItems, MobileModeOptions, MobileMode, HamburgerPositionOptions, DrawerPlacementOptions } from "./navLayoutConstants";
import { styleControl } from "@lowcoder-ee/comps/controls/styleControl";
import { NavLayoutItemActiveStyle, NavLayoutItemActiveStyleType, NavLayoutItemHoverStyle, NavLayoutItemHoverStyleType, NavLayoutItemStyle, NavLayoutItemStyleType, NavLayoutStyle, NavLayoutStyleType } from "@lowcoder-ee/comps/controls/styleControlConstants";
import Segmented from "antd/es/segmented";
import { controlItem } from "components/control";
import { check } from "@lowcoder-ee/util/convertUtils";
import { JSONObject } from "@lowcoder-ee/util/jsonTypes";
import { isEmpty } from "lodash";
import { ThemeContext } from "@lowcoder-ee/comps/utils/themeContext";
import { AlignCenter } from "lowcoder-design";
import { AlignLeft } from "lowcoder-design";
import { AlignRight } from "lowcoder-design";
import { LayoutActionComp } from "./layoutActionComp";
import { defaultTheme } from "@lowcoder-ee/constants/themeConstants";
import { clickEvent, eventHandlerControl } from "@lowcoder-ee/comps/controls/eventHandlerControl";
import { childrenToProps } from "@lowcoder-ee/comps/generators/multi";
import { useAppPathParam } from "util/hooks";
import { ALL_APPLICATIONS_URL } from "constants/routesURL";

const TabBar = React.lazy(() => import("antd-mobile/es/components/tab-bar"));
const TabBarItem = React.lazy(() =>
  import("antd-mobile/es/components/tab-bar/tab-bar").then((module) => ({
    default: module.TabBarItem,
  }))
);
const Popup = React.lazy(() => import("antd-mobile/es/components/popup"));
const EventOptions = [clickEvent] as const;

const AppViewContainer = styled.div`
  position: absolute;
  width: 100%;
  top: 0;
  max-width: inherit;
  overflow: auto;
  height: 100%;
`;

const TabLayoutViewContainer = styled.div<{ 
    maxWidth: number; 
    tabBarHeight: string; 
    // verticalAlignment: string;
}>`
  margin: 0 auto;
  max-width: ${(props) => props.maxWidth}px;
  position: relative;
  height: calc(100% - ${(props) => props.tabBarHeight});
  display: flex;
  flex-direction: column;
`;

const HamburgerButton = styled.button<{
  $size: string;
  $position: string; // bottom-right | bottom-left | top-right | top-left
  $zIndex: number;
}>`
  position: fixed;
  ${(props) => (props.$position.includes('bottom') ? 'bottom: 16px;' : 'top: 16px;')}
  ${(props) => (props.$position.includes('right') ? 'right: 16px;' : 'left: 16px;')}
  width: ${(props) => props.$size};
  height: ${(props) => props.$size};
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.1);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${(props) => props.$zIndex};
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(0,0,0,0.15);
`;

const BurgerIcon = styled.div<{
  $lineColor?: string;
}>`
  width: 60%;
  height: 2px;
  background: ${(p) => p.$lineColor || '#333'};
  position: relative;
  &::before, &::after {
    content: '';
    position: absolute;
    left: 0;
    width: 100%;
    height: 2px;
    background: inherit;
  }
  &::before { top: -6px; }
  &::after { top: 6px; }
`;

const DrawerContent = styled.div<{
  $background: string;
}>`
  background: ${(p) => p.$background};
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
  box-sizing: border-box;
`;

const DrawerList = styled.div<{
  $itemStyle: NavLayoutItemStyleType;
  $hoverStyle: NavLayoutItemHoverStyleType;
  $activeStyle: NavLayoutItemActiveStyleType;
}>`
  display: flex;
  flex-direction: column;
  gap: 8px;

  .drawer-item {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: ${(p) => p.$itemStyle.background};
    color: ${(p) => p.$itemStyle.text};
    border-radius: ${(p) => p.$itemStyle.radius};
    border: 1px solid ${(p) => p.$itemStyle.border};
    margin: ${(p) => p.$itemStyle.margin};
    padding: ${(p) => p.$itemStyle.padding};
    cursor: pointer;
    user-select: none;
  }
  .drawer-item:hover {
    background-color: ${(p) => p.$hoverStyle.background};
    color: ${(p) => p.$hoverStyle.text};
    border: 1px solid ${(p) => p.$hoverStyle.border};
  }
  .drawer-item.active {
    background-color: ${(p) => p.$activeStyle.background};
    color: ${(p) => p.$activeStyle.text};
    border: 1px solid ${(p) => p.$activeStyle.border};
  }
`;

const TabBarWrapper = styled.div<{
  $readOnly: boolean,
  $canvasBg: string,
  $tabBarHeight: string,
  $maxWidth: number,
  $verticalAlignment: string;
}>`
  max-width: inherit;
  background: ${(props) => (props.$canvasBg)};
  margin: 0 auto;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: ${(props) => props.$readOnly ? "100%" : `${props.$maxWidth - 30}px`};
  z-index: ${Layers.tabBar};
  padding-bottom: env(safe-area-inset-bottom, 0);

  .adm-tab-bar-wrap {
    overflow: auto;
    height: ${(props) => props.$tabBarHeight};
    display: flex;
    flex-wrap: wrap;
    align-content: ${(props) => props.$verticalAlignment };
  }
`;

const StyledTabBar = styled(TabBar)<{
  $showSeparator: boolean,
  $tabStyle: NavLayoutStyleType,
  $tabItemStyle: NavLayoutItemStyleType,
  $tabItemHoverStyle: NavLayoutItemHoverStyleType,
  $tabItemActiveStyle: NavLayoutItemActiveStyleType,
  $navIconSize: string;
}>`
  width: ${(props) => `calc(100% - ${props.$tabStyle.margin} - ${props.$tabStyle.margin})`};
  border: ${(props) => props.$tabStyle.border};
  background: ${(props) => props.$tabStyle.background};
  border-radius: ${(props) => props.$tabStyle.radius };
  margin: ${(props) => props.$tabStyle.margin };
  padding: ${(props) => props.$tabStyle.padding };

  ${(props) => props.$showSeparator ? `
  .adm-tab-bar-item:not(:last-child) {
    border-right: ${props.$tabStyle.border};
  }
  ` : ''}

  .adm-tab-bar-item-icon, .adm-tab-bar-item-title {
    color: ${(props) => props.$tabStyle.text};
  }
  .adm-tab-bar-item-icon {
    font-size: ${(props) => props.$navIconSize};
  }
  
  .adm-tab-bar-item {
    background-color: ${(props) => props.$tabItemStyle?.background};
    color: ${(props) => props.$tabItemStyle?.text};
    border-radius: ${(props) => props.$tabItemStyle?.radius} !important;
    border: ${(props) => `1px solid ${props.$tabItemStyle?.border}`};
    margin: ${(props) => props.$tabItemStyle?.margin};
    padding: ${(props) => props.$tabItemStyle?.padding};
  }

  .adm-tab-bar-item:hover {
    background-color: ${(props) => props.$tabItemHoverStyle?.background} !important;
    color: ${(props) => props.$tabItemHoverStyle?.text} !important;
    border: ${(props) => `1px solid ${props.$tabItemHoverStyle?.border}`};
  }

  .adm-tab-bar-item.adm-tab-bar-item-active {
    background-color: ${(props) => props.$tabItemActiveStyle.background};
    // border: ${(props) => `1px solid ${props.$tabItemActiveStyle.border}`};
    .adm-tab-bar-item-icon, .adm-tab-bar-item-title {
      color: ${(props) => props.$tabItemActiveStyle.text};
    }
  }
`;

const defaultStyle = {
  radius: '0px',
  margin: '0px',
  padding: '0px',
}

const AlignTop = styled(AlignLeft)`
  transform: rotate(90deg);
`;
const AlignBottom = styled(AlignRight)`
  transform: rotate(90deg);
`;
const AlignVerticalCenter = styled(AlignCenter)`
  transform: rotate(90deg);
`;

const VerticalAlignmentOptions = [
  { label: <AlignTop />, value: "flex-start" },
  { label: <AlignVerticalCenter />, value: "stretch" },
  { label: <AlignBottom />, value: "flex-end" },
] as const;

type MenuItemStyleOptionValue = "normal" | "hover" | "active";

type JsonItemNode = {
  label: string;
  hidden?: boolean;
  icon?: any;
  app?: JSONObject,
}

type TabBarProps = {
  onEvent:any;
  tabs: Array<{
    title: string;
    icon?: React.ReactNode;
    key: number | string;
  }>;
  selectedKey: string;
  onChange: (key: string) => void;
  readOnly: boolean;
  canvasBg: string;
  tabStyle: NavLayoutStyleType;
  tabItemStyle: NavLayoutItemStyleType;
  tabItemHoverStyle: NavLayoutItemHoverStyleType;
  tabItemActiveStyle: NavLayoutItemActiveStyleType;
};

function checkDataNodes(value: any, key?: string): JsonItemNode[] | undefined {
  return check(value, ["array", "undefined"], key, (node, k) => {
    check(node, ["object"], k);
    check(node["label"], ["string"], "label");
    check(node["hidden"], ["boolean", "undefined"], "hidden");
    check(node["icon"], ["string", "undefined"], "icon");
    check(node["app"], ["object", "undefined"], "app");
    return node;
  });
}

function convertTreeData(data: any) {
  return data === "" ? [] : checkDataNodes(data) ?? [];
}

function TabBarView(props: TabBarProps & { 
    tabBarHeight: string; 
    maxWidth: number;
    verticalAlignment: string;
    showSeparator: boolean;
    navIconSize: string;
  }
  ) {
  const {
    canvasBg, tabStyle, tabItemStyle, tabItemHoverStyle, tabItemActiveStyle,
  } = props;
  return (
    <Suspense fallback={<Skeleton />}>
      <TabBarWrapper
        $readOnly={props.readOnly}
        $canvasBg={canvasBg}
        $tabBarHeight={props.tabBarHeight}
        $maxWidth={props.maxWidth}
        $verticalAlignment={props.verticalAlignment} 
      >
        <StyledTabBar
          onChange={(key: string) => {
            console.log(key)
            if (key) {
              props.onChange(key);
              props.onEvent('click')
            }
          }}
          activeKey={props.selectedKey}
          $tabStyle={tabStyle}
          $tabItemStyle={tabItemStyle}
          $tabItemHoverStyle={tabItemHoverStyle}
          $tabItemActiveStyle={tabItemActiveStyle}
          $showSeparator={props.showSeparator}
          $navIconSize={props.navIconSize}
        >
          {props.tabs.map((tab) => {
            return (
              <TabBarItem key={tab.key} icon={tab.icon} title={tab.title} />
            );
          })}
        </StyledTabBar>
      </TabBarWrapper>
    </Suspense>
  );
}

const TabOptionComp = (function () {
  return new MultiCompBuilder(
    {
      app: AppSelectComp,
      action: LayoutActionComp,
      label: StringControl,
      icon: IconControl,
      hidden: BoolCodeControl,
    },
    (props) => {
      return props;
    }
  )
    .setPropertyViewFn((children, dispatch) => {
      return (
        <>
          {children.action.propertyView({
            onAppChange: (label:any) => {
              label && children.label.dispatchChangeValueAction(label);
            },
          })}
          {children.label.propertyView({ label: trans("label") })}
          {hiddenPropertyView(children)}
          {children.icon.propertyView({
            label: trans('icon'),
            tooltip: trans('aggregation.iconTooltip'),
          })}
        </>
      );
    })
    .build();
})();

function renderDataSection(children: any): any {
  return (
    <Section name={trans("aggregation.tabBar")}>
      {children.dataOptionType.propertyView({
        radioButton: true,
        type: "oneline",
      })}
      {children.dataOptionType.getView() === DataOption.Manual
        ? children.tabs.propertyView({})
        : children.jsonItems.propertyView({
            label: "Json Data",
          })}
    </Section>
  );
}

function renderEventHandlersSection(children: any): any {
  return (
    <Section name={trans("eventHandler.eventHandlers")}>
      {children.onEvent.getPropertyView()}
    </Section>
  );
}

function renderHamburgerLayoutSection(children: any): any {
  const drawerPlacement = children.drawerPlacement.getView();
  return (
    <>
      {children.hamburgerPosition.propertyView({ label: "Hamburger Position" })}
      {children.hamburgerSize.propertyView({ label: "Hamburger Size" })}
      {children.drawerPlacement.propertyView({ label: "Drawer Placement" })}
      {(drawerPlacement === 'top' || drawerPlacement === 'bottom') &&
        children.drawerHeight.propertyView({ label: "Drawer Height" })}
      {(drawerPlacement === 'left' || drawerPlacement === 'right') &&
        children.drawerWidth.propertyView({ label: "Drawer Width" })}
      {children.shadowOverlay.propertyView({ label: "Shadow Overlay" })}
      {children.backgroundImage.propertyView({
        label: `Background Image`,
        placeholder: 'https://temp.im/350x400',
      })}
    </>
  );
}

function renderVerticalLayoutSection(children: any): any {
  return (
    <>
      {children.backgroundImage.propertyView({
        label: `Background Image`,
        placeholder: 'https://temp.im/350x400',
      })}
      {children.showSeparator.propertyView({label: trans("navLayout.mobileNavVerticalShowSeparator")})}
      {children.tabBarHeight.propertyView({label: trans("navLayout.mobileNavBarHeight")})}
      {children.navIconSize.propertyView({label: trans("navLayout.mobileNavIconSize")})}
      {children.maxWidth.propertyView({label: trans("navLayout.mobileNavVerticalMaxWidth")})}
      {children.verticalAlignment.propertyView({
        label: trans("navLayout.mobileNavVerticalOrientation"),
        radioButton: true
      })}
    </>
  );
}

let MobileTabLayoutTmp = (function () {
  const childrenMap = {
    onEvent: eventHandlerControl(EventOptions),
    dataOptionType: dropdownControl(DataOptionType, DataOption.Manual),
    jsonItems: jsonControl<JsonItemNode[]>(convertTreeData, mobileNavJsonMenuItems),
    tabs: manualOptionsControl(TabOptionComp, {
      initOptions: [
        {
          label: trans("optionsControl.optionI", { i: 1 }),
          icon: "/icon:solid/1",
        },
        {
          label: trans("optionsControl.optionI", { i: 2 }),
          icon: "/icon:solid/2",
        },
        {
          label: trans("optionsControl.optionI", { i: 3 }),
          icon: "/icon:solid/3",
        },
      ],
    }),
    jsonTabs: manualOptionsControl(TabOptionComp, {
      initOptions: [],
    }),
    // Mode & hamburger/drawer config
    menuMode: dropdownControl(MobileModeOptions, MobileMode.Vertical),
    hamburgerPosition: dropdownControl(HamburgerPositionOptions, "bottom-right"),
    hamburgerSize: withDefault(StringControl, "56px"),
    drawerPlacement: dropdownControl(DrawerPlacementOptions, "bottom"),
    drawerHeight: withDefault(StringControl, "60%"),
    drawerWidth: withDefault(StringControl, "250px"),
    shadowOverlay: withDefault(BoolCodeControl, true),
    backgroundImage: withDefault(StringControl, ""),
    tabBarHeight: withDefault(StringControl, "56px"), 
    navIconSize: withDefault(StringControl, "32px"), 
    maxWidth: withDefault(NumberControl, 450),
    verticalAlignment: dropdownControl(VerticalAlignmentOptions, "stretch"),
    showSeparator: withDefault(BoolCodeControl, true),
    navStyle: styleControl(NavLayoutStyle, 'navStyle'),
    navItemStyle: styleControl(NavLayoutItemStyle, 'navItemStyle'),
    navItemHoverStyle: styleControl(NavLayoutItemHoverStyle, 'navItemHoverStyle'),
    navItemActiveStyle: styleControl(NavLayoutItemActiveStyle, 'navItemActiveStyle'),
  };
  return new MultiCompBuilder(childrenMap, (props, dispatch) => {
    return null;
  })
    .setPropertyViewFn((children) => {
      const [styleSegment, setStyleSegment] = useState('normal');
      const isHamburgerMode = children.menuMode.getView() === MobileMode.Hamburger;

      return (
        <>
          {renderDataSection(children)}
          {renderEventHandlersSection(children)}
          <Section name={sectionNames.layout}>
            {children.menuMode.propertyView({ label: "Mode", radioButton: true })}
            {isHamburgerMode
              ? renderHamburgerLayoutSection(children)
              : renderVerticalLayoutSection(children)}
          </Section>
          <Section name={trans("navLayout.navStyle")}>
            {children.navStyle.getPropertyView()}
          </Section>
          <Section name={trans("navLayout.navItemStyle")}>
            {controlItem({}, (
              <Segmented
                block
                options={menuItemStyleOptions}
                value={styleSegment}
                onChange={(k) => setStyleSegment(k as MenuItemStyleOptionValue)}
              />
            ))}
            {styleSegment === 'normal' && children.navItemStyle.getPropertyView()}
            {styleSegment === 'hover' && children.navItemHoverStyle.getPropertyView()}
            {styleSegment === 'active' && children.navItemActiveStyle.getPropertyView()}
          </Section>
        </>
      );
    })
    .build();
})();

MobileTabLayoutTmp = withViewFn(MobileTabLayoutTmp, (comp) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { readOnly } = useContext(ExternalEditorContext);
  const pathParam = useAppPathParam();
  const navStyle = comp.children.navStyle.getView();
  const navItemStyle = comp.children.navItemStyle.getView();
  const navItemHoverStyle = comp.children.navItemHoverStyle.getView();
  const navItemActiveStyle = comp.children.navItemActiveStyle.getView();
  const backgroundImage = comp.children.backgroundImage.getView();
  const jsonItems = comp.children.jsonItems.getView();
  const dataOptionType = comp.children.dataOptionType.getView();
  const menuMode = comp.children.menuMode.getView();
  const hamburgerPosition = comp.children.hamburgerPosition.getView();
  const hamburgerSize = comp.children.hamburgerSize.getView();
  const drawerPlacement = comp.children.drawerPlacement.getView();
  const drawerHeight = comp.children.drawerHeight.getView();
  const drawerWidth = comp.children.drawerWidth.getView();
  const shadowOverlay = comp.children.shadowOverlay.getView();
  const tabBarHeight = comp.children.tabBarHeight.getView();
  const navIconSize = comp.children.navIconSize.getView();
  const maxWidth = comp.children.maxWidth.getView();
  const verticalAlignment = comp.children.verticalAlignment.getView();
  const showSeparator = comp.children.showSeparator.getView();
  const bgColor = (useContext(ThemeContext)?.theme || defaultTheme).canvas;
  const onEvent = comp.children.onEvent.getView();

  useEffect(() => {
    comp.children.jsonTabs.dispatchChangeValueAction({
      manual: jsonItems as unknown as Array<ConstructorToDataType<typeof TabOptionComp>>
    });
  }, [jsonItems]);

  const tabViews = useMemo(() => {
    if (dataOptionType === DataOption.Manual) {
      return (comp.children.tabs.children.manual.getView() as unknown as Array<
        ConstructorToComp<typeof TabOptionComp>
        >
      ).filter((tab) => !tab.children.hidden.getView());
    }
    if (dataOptionType === DataOption.Json) {
      return (comp.children.jsonTabs.children.manual.getView() as unknown as Array<
        ConstructorToComp<typeof TabOptionComp>
        >
      ).filter((tab) => !tab.children.hidden.getView());
    }
    return [];
  }, [dataOptionType, jsonItems, comp.children.tabs, comp.children.jsonTabs])

  const appView = useMemo(() => {
    const currentTab = tabViews[tabIndex];

    if (dataOptionType === DataOption.Json) {
      return (currentTab &&
        currentTab.children.app.getAppId() &&
        currentTab.children.app.getView()) || (
        <EmptyContent
          text={readOnly ? "" : trans("aggregation.emptyTabTooltip")}
          style={{ height: "100%", backgroundColor: "white" }}
        />
      );
    }

    return (currentTab &&
      // currentTab.children.app.getAppId() &&
      currentTab.children.action.getView()) || (
      <EmptyContent
        text={readOnly ? "" : trans("aggregation.emptyTabTooltip")}
        style={{ height: "100%", backgroundColor: "white" }}
      />
      )
  }, [tabIndex, tabViews, dataOptionType]);

  let backgroundStyle = navStyle.background;
  if(!isEmpty(backgroundImage))  {
    backgroundStyle = `center / cover url('${backgroundImage}') no-repeat, ${backgroundStyle}`;
  }

  const tabBarView = (
    <TabBarView
      onEvent={onEvent}
      tabs={tabViews.map((tab, index) => ({
        key: index,
        title: tab.children.label.getView(),
        icon: tab.children.icon.toJsonValue()
          ? tab.children.icon.getView()
          : undefined,
      }))}
      selectedKey={tabIndex + ""}
      onChange={(key) => {
        const nextIndex = Number(key);
        setTabIndex(nextIndex);
        // push URL with query/hash params
        if (dataOptionType === DataOption.Manual) {
          const selectedTab = tabViews[nextIndex];
          if (selectedTab) {
            const url = [
              ALL_APPLICATIONS_URL,
              pathParam.applicationId,
              pathParam.viewMode,
              nextIndex,
            ].join("/");
            selectedTab.children.action.act(url);
          }
        }
      }}
      readOnly={!!readOnly}
      canvasBg={bgColor}
      tabStyle={{
        border: `1px solid ${navStyle.border}`,
        radius: navStyle.radius,
        text: navStyle.text,
        margin: navStyle.margin,
        padding: navStyle.padding,
        background: backgroundStyle,
      }}
      tabItemStyle={navItemStyle}
      tabItemHoverStyle={navItemHoverStyle}
      tabItemActiveStyle={navItemActiveStyle}
      tabBarHeight={tabBarHeight}
      navIconSize={navIconSize}
      maxWidth={maxWidth}
      verticalAlignment={verticalAlignment}
      showSeparator={showSeparator}
    />
  );

  const containerTabBarHeight = menuMode === MobileMode.Hamburger ? '0px' : tabBarHeight;

  const hamburgerButton = (
    <HamburgerButton
      $size={hamburgerSize}
      $position={hamburgerPosition}
      $zIndex={Layers.tabBar + 1}
      onClick={() => setDrawerVisible(true)}
    >
      <BurgerIcon $lineColor={navStyle.text} />
    </HamburgerButton>
  );

  const drawerBodyStyle = useMemo(() => {
    if (drawerPlacement === 'left' || drawerPlacement === 'right') {
      return { width: drawerWidth } as React.CSSProperties;
    }
    return { height: drawerHeight } as React.CSSProperties;
  }, [drawerPlacement, drawerHeight, drawerWidth]);

  const drawerView = (
    <Suspense fallback={<Skeleton />}>
      <Popup
        visible={drawerVisible}
        onMaskClick={() => setDrawerVisible(false)}
        onClose={() => setDrawerVisible(false)}
        position={drawerPlacement as any}
        mask={shadowOverlay}
        bodyStyle={drawerBodyStyle}
      >
        <DrawerContent $background={backgroundStyle}>
          <DrawerList
            $itemStyle={navItemStyle}
            $hoverStyle={navItemHoverStyle}
            $activeStyle={navItemActiveStyle}
          >
            {tabViews.map((tab, index) => (
              <div
                key={index}
                className={`drawer-item ${tabIndex === index ? 'active' : ''}`}
                onClick={() => {
                  setTabIndex(index);
                  setDrawerVisible(false);
                  onEvent('click');
                }}
              >
                {tab.children.icon.toJsonValue() ? (
                  <span style={{ display: 'inline-flex' }}>{tab.children.icon.getView()}</span>
                ) : null}
                <span>{tab.children.label.getView()}</span>
              </div>
            ))}
          </DrawerList>
        </DrawerContent>
      </Popup>
    </Suspense>
  );

  if (readOnly) {
    return (
      <TabLayoutViewContainer maxWidth={maxWidth} tabBarHeight={containerTabBarHeight}>
        <AppViewContainer>{appView}</AppViewContainer>
        {menuMode === MobileMode.Hamburger ? (
          <>
            {hamburgerButton}
            {drawerView}
          </>
        ) : (
          tabBarView
        )}
      </TabLayoutViewContainer>
    );
  }

  return (
    <CanvasContainer $maxWidth={maxWidth} id={CanvasContainerID}>
      <EditorContainer>{appView}</EditorContainer>
      {menuMode === MobileMode.Hamburger ? (
        <>
          {hamburgerButton}
          {drawerView}
        </>
      ) : (
        tabBarView
      )}
    </CanvasContainer>
  );
});

export class MobileTabLayout extends MobileTabLayoutTmp {
  getAllCompItems() {
    return {};
  }

  nameAndExposingInfo(): NameAndExposingInfo {
    return {};
  }
}

registerLayoutMap({ compType: "mobileTabLayout", comp: MobileTabLayout });
