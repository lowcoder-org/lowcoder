import { MultiCompBuilder, withDefault, withViewFn } from "comps/generators";
import { trans } from "i18n";
import { Section, sectionNames } from "components/Section";
import { manualOptionsControl } from "comps/controls/optionsControl";
import { BoolCodeControl, StringControl, jsonControl } from "comps/controls/codeControl";
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
import { DataOption, DataOptionType, ModeOptions, menuItemStyleOptions, mobileNavJsonMenuItems } from "./navLayoutConstants";
import { styleControl } from "@lowcoder-ee/comps/controls/styleControl";
import { NavLayoutItemActiveStyle, NavLayoutItemActiveStyleType, NavLayoutItemHoverStyle, NavLayoutItemHoverStyleType, NavLayoutItemStyle, NavLayoutItemStyleType, NavLayoutStyle, NavLayoutStyleType, defaultTheme } from "@lowcoder-ee/comps/controls/styleControlConstants";
import Segmented from "antd/es/segmented";
import { controlItem } from "components/control";
import { check } from "@lowcoder-ee/util/convertUtils";
import { JSONObject } from "@lowcoder-ee/util/jsonTypes";
import { isEmpty } from "lodash";
import { ThemeContext } from "@lowcoder-ee/comps/utils/themeContext";

const TabBar = React.lazy(() => import("antd-mobile/es/components/tab-bar"));
const TabBarItem = React.lazy(() =>
  import("antd-mobile/es/components/tab-bar/tab-bar").then((module) => ({
    default: module.TabBarItem,
  }))
);

const TabBarHeight = 56;
const MaxWidth = 450;
const AppViewContainer = styled.div`
  position: absolute;
  width: 100%;
  top: 0;
  max-width: inherit;
  overflow: auto;
  height: 100%;
`;

const TabLayoutViewContainer = styled.div`
  margin: 0 auto;
  max-width: ${MaxWidth}px;
  position: relative;
  height: calc(100% - ${TabBarHeight}px);
`;

const TabBarWrapper = styled.div<{
  $readOnly: boolean,
  $canvasBg: string,
}>`
  max-width: inherit;
  background: ${(props) => (props.$canvasBg)};
  margin: 0 auto;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: ${(props) => (props.$readOnly ? "100%" : "418px")};
  z-index: ${Layers.tabBar};
  padding-bottom: env(safe-area-inset-bottom, 0);

  .adm-tab-bar-wrap {
    overflow: auto;
    height: ${TabBarHeight}px;
  }
`;

const StyledTabBar = styled(TabBar)<{
  $tabStyle: NavLayoutStyleType,
  $tabItemStyle: NavLayoutItemStyleType,
  $tabItemHoverStyle: NavLayoutItemHoverStyleType,
  $tabItemActiveStyle: NavLayoutItemActiveStyleType,
}>`
  width: ${(props) => `calc(100% - ${props.$tabStyle.margin} - ${props.$tabStyle.margin})`};
  border: ${(props) => props.$tabStyle.border};
  background: ${(props) => props.$tabStyle.background};
  border-radius: ${(props) => props.$tabStyle.radius };
  margin: ${(props) => props.$tabStyle.margin };
  padding: ${(props) => props.$tabStyle.padding };
  
  .adm-tab-bar-item:not(:last-child) {
    border-right: ${(props) => props.$tabStyle.border};
  }
  .adm-tab-bar-item-icon, .adm-tab-bar-item-title {
    color: ${(props) => props.$tabStyle.text};
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

type MenuItemStyleOptionValue = "normal" | "hover" | "active";

type JsonItemNode = {
  label: string;
  hidden?: boolean;
  icon?: any;
  app?: JSONObject,
}

type TabBarProps = {
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

function TabBarView(props: TabBarProps) {
  const {
    canvasBg, tabStyle, tabItemStyle, tabItemHoverStyle, tabItemActiveStyle,
  } = props;
  return (
    <Suspense fallback={<Skeleton />}>
      <TabBarWrapper
        $readOnly={props.readOnly}
        $canvasBg={canvasBg}
      >
        <StyledTabBar
          onChange={(key: string) => {
            if (key) {
              props.onChange(key);
            }
          }}
          activeKey={props.selectedKey}
          $tabStyle={tabStyle}
          $tabItemStyle={tabItemStyle}
          $tabItemHoverStyle={tabItemHoverStyle}
          $tabItemActiveStyle={tabItemActiveStyle}
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
          {children.app.propertyView({})}
          {children.label.propertyView({ label: trans("label") })}
          {hiddenPropertyView(children)}
          {children.icon.propertyView({
            label: trans("icon"),
            tooltip: trans("aggregation.iconTooltip"),
          })}
        </>
      );
    })
    .build();
})();

let MobileTabLayoutTmp = (function () {
  const childrenMap = {
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
    backgroundImage: withDefault(StringControl, ""),
    navStyle: withDefault(styleControl(NavLayoutStyle), defaultStyle),
    navItemStyle: withDefault(styleControl(NavLayoutItemStyle), defaultStyle),
    navItemHoverStyle: withDefault(styleControl(NavLayoutItemHoverStyle), {}),
    navItemActiveStyle: withDefault(styleControl(NavLayoutItemActiveStyle), {}),
  };
  return new MultiCompBuilder(childrenMap, (props) => {
    return null;
  })
    .setPropertyViewFn((children) => {
      const [styleSegment, setStyleSegment] = useState('normal')
      return (
        <div style={{overflowY: 'auto'}}>
          <Section name={trans("aggregation.tabBar")}>
            {children.dataOptionType.propertyView({
              radioButton: true,
              type: "oneline",
            })}
            {
              children.dataOptionType.getView() === DataOption.Manual
                ? children.tabs.propertyView({})
                : children.jsonItems.propertyView({
                  label: "Json Data",
                })
            }
          </Section>
          <Section name={sectionNames.layout}>
            {children.backgroundImage.propertyView({
              label: `Background Image`,
              placeholder: 'https://temp.im/350x400',
            })}
          </Section>
          <Section name={trans("navLayout.navStyle")}>
            { children.navStyle.getPropertyView() }
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
            {styleSegment === 'normal' && (
              children.navItemStyle.getPropertyView()
            )}
            {styleSegment === 'hover' && (
              children.navItemHoverStyle.getPropertyView()
            )}
            {styleSegment === 'active' && (
              children.navItemActiveStyle.getPropertyView()
            )}
          </Section>
        </div>
      );
    })
    .build();
})();

MobileTabLayoutTmp = withViewFn(MobileTabLayoutTmp, (comp) => {
  const [tabIndex, setTabIndex] = useState(0);
  const { readOnly } = useContext(ExternalEditorContext);
  const navStyle = comp.children.navStyle.getView();
  const navItemStyle = comp.children.navItemStyle.getView();
  const navItemHoverStyle = comp.children.navItemHoverStyle.getView();
  const navItemActiveStyle = comp.children.navItemActiveStyle.getView();
  const backgroundImage = comp.children.backgroundImage.getView();
  const jsonItems = comp.children.jsonItems.getView();
  const dataOptionType = comp.children.dataOptionType.getView();
  const bgColor = (useContext(ThemeContext)?.theme || defaultTheme).canvas;

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

    return (currentTab &&
      currentTab.children.app.getAppId() &&
      currentTab.children.app.getView()) || (
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
      tabs={tabViews.map((tab, index) => ({
        key: index,
        title: tab.children.label.getView(),
        icon: tab.children.icon.toJsonValue()
          ? tab.children.icon.getView()
          : undefined,
      }))}
      selectedKey={tabIndex + ""}
      onChange={(key) => setTabIndex(Number(key))}
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
    />
  );

  if (readOnly) {
    return (
      <TabLayoutViewContainer>
        <AppViewContainer>{appView}</AppViewContainer>
        {tabBarView}
      </TabLayoutViewContainer>
    );
  }

  return (
    <CanvasContainer $maxWidth={MaxWidth} id={CanvasContainerID}>
      <EditorContainer>{appView}</EditorContainer>
      {tabBarView}
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
