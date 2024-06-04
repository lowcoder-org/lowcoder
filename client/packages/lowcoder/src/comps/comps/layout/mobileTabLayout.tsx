import { MultiCompBuilder, withDefault, withViewFn } from "comps/generators";
import { trans } from "i18n";
import { Section, sectionNames } from "components/Section";
import { manualOptionsControl } from "comps/controls/optionsControl";
import { BoolCodeControl, StringControl, jsonControl } from "comps/controls/codeControl";
import { IconControl } from "comps/controls/iconControl";
import styled from "styled-components";
import React, { Suspense, useContext, useMemo, useState } from "react";  
import { registerLayoutMap } from "comps/comps/uiComp";
import { AppSelectComp } from "comps/comps/layout/appSelectComp";
import { NameAndExposingInfo } from "comps/utils/exposingTypes";
import { ConstructorToComp } from "lowcoder-core";
import { CanvasContainer } from "comps/comps/gridLayoutComp/canvasView";
import { CanvasContainerID } from "constants/domLocators";
import { EditorContainer, EmptyContent } from "pages/common/styledComponent";
import { Layers } from "constants/Layers";
import { ExternalEditorContext } from "util/context/ExternalEditorContext";
import { default as Skeleton } from "antd/es/skeleton";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { dropdownControl } from "@lowcoder-ee/comps/controls/dropdownControl";
import { DataOption, DataOptionType, ModeOptions, jsonMenuItems, menuItemStyleOptions, mobileNavJsonMenuItems } from "./navLayoutConstants";
import { styleControl } from "@lowcoder-ee/comps/controls/styleControl";
import { NavLayoutItemActiveStyle, NavLayoutItemHoverStyle, NavLayoutItemStyle, NavLayoutStyle } from "@lowcoder-ee/comps/controls/styleControlConstants";
import Segmented from "antd/es/segmented";
import { controlItem } from "components/control";
import { MenuItemNode } from "./navLayout";
import { check } from "@lowcoder-ee/util/convertUtils";
import { JSONObject } from "@lowcoder-ee/util/jsonTypes";
import { getCompContainer, useCompContainer, useCompInstance } from "@lowcoder-ee/comps/utils/useCompInstance";
import { ModuleComp } from "../moduleComp/moduleComp";
import { evalAndReduceWithExposing } from "comps/utils";

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

const TabBarWrapper = styled.div<{ $readOnly: boolean }>`
  max-width: inherit;
  background: white;
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
  console.log(props);
  return (
    <Suspense fallback={<Skeleton />}>
      <TabBarWrapper $readOnly={props.readOnly}>
        <TabBar
          onChange={(key: string) => {
            if (key) {
              props.onChange(key);
            }
          }}
          style={{ width: "100%" }}
          activeKey={props.selectedKey}
        >
          {props.tabs.map((tab) => {
            return (
              <TabBarItem key={tab.key} icon={tab.icon} title={tab.title} />
            );
          })}
        </TabBar>
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
    backgroundImage: withDefault(StringControl, ""),
    mode: dropdownControl(ModeOptions, "inline"),
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
            {/* {children.tabs.propertyView({})} */}
            {
              children.dataOptionType.getView() === DataOption.Manual
                ? children.tabs.propertyView({})
                : children.jsonItems.propertyView({
                  label: "Json Data",
                })
            }
          </Section>
          <Section name={sectionNames.layout}>
            { children.mode.propertyView({
              label: trans("labelProp.position"),
              radioButton: true
            })}
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
  const tabs = comp.children.tabs.getView();
  const navMode = comp.children.mode.getView();
  const navStyle = comp.children.navStyle.getView();
  const navItemStyle = comp.children.navItemStyle.getView();
  const navItemHoverStyle = comp.children.navItemHoverStyle.getView();
  const navItemActiveStyle = comp.children.navItemActiveStyle.getView();
  const backgroundImage = comp.children.backgroundImage.getView();
  const jsonItems = comp.children.jsonItems.getView();
  const dataOptionType = comp.children.dataOptionType.getView();
  // const tabViews = (
  //   comp.children.tabs.children.manual.getView() as unknown as Array<
  //     ConstructorToComp<typeof TabOptionComp>
  //   >
  // ).filter((tab) => !tab.children.hidden.getView());
  const tabViews = useMemo(() => {
    if (dataOptionType === DataOption.Manual) {
      return (comp.children.tabs.children.manual.getView() as unknown as Array<
        ConstructorToComp<typeof TabOptionComp>
        >
      ).filter((tab) => !tab.children.hidden.getView());
    }
    return jsonItems.filter(item => !Boolean(item.hidden)).map((item) => {
      const container = getCompContainer({
        Comp: TabOptionComp,
        initialValue: {
          ...item, 
        }
      })
      if (container) {
        container.initialized = true;
        container.comp = evalAndReduceWithExposing(container.comp);
      }
      return container!.comp as unknown as ConstructorToComp<typeof TabOptionComp>
    })
  }, [dataOptionType])

  console.log(tabViews);

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
  }, [tabIndex]);

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
    />
  );

  //console.log("appView", appView);

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
