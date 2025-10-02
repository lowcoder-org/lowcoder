import { default as Tabs } from "antd/es/tabs";
import { JSONObject, JSONValue } from "util/jsonTypes";
import { CompAction, CompActionTypes, deleteCompAction, wrapChildAction } from "lowcoder-core";
import { DispatchType, RecordConstructorToView, wrapDispatch } from "lowcoder-core";
import { AutoHeightControl } from "comps/controls/autoHeightControl";
import { stringExposingStateControl } from "comps/controls/codeStateControl";
import { eventHandlerControl } from "comps/controls/eventHandlerControl";
import { TabsOptionControl } from "comps/controls/optionsControl";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, AnimationStyleType, TabBodyStyleType, ContainerHeaderStyle, ContainerHeaderStyleType, TabBodyStyle, TabContainerStyle, TabContainerStyleType, heightCalculator, widthCalculator } from "comps/controls/styleControlConstants";
import { sameTypeMap, UICompBuilder, withDefault } from "comps/generators";
import { addMapChildAction } from "comps/generators/sameTypeMap";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { NameGenerator } from "comps/utils";
import { ScrollBar, Section, sectionNames } from "lowcoder-design";
import { HintPlaceHolder } from "lowcoder-design";
import _ from "lodash";
import React, {useContext, useMemo, useEffect } from "react";
import styled, { css } from "styled-components";
import { IContainer } from "../containerBase/iContainer";
import { SimpleContainerComp } from "../containerBase/simpleContainerComp";
import { CompTree, mergeCompTrees } from "../containerBase/utils";
import {
  ContainerBaseProps,
  gridItemCompToGridItems,
  InnerGrid,
} from "../containerComp/containerView";
import { BackgroundColorContext } from "comps/utils/backgroundColorContext";
import { disabledPropertyView, hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { BoolCodeControl, NumberControl } from "comps/controls/codeControl";
import { DisabledContext } from "comps/generators/uiCompBuilder";
import { EditorContext } from "comps/editorState";
import { checkIsMobile } from "util/commonUtils";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { BoolControl } from "comps/controls/boolControl";
import { PositionControl,dropdownControl } from "comps/controls/dropdownControl";
import { SliderControl } from "@lowcoder-ee/comps/controls/sliderControl";
import { getBackgroundStyle } from "@lowcoder-ee/util/styleUtils";

const EVENT_OPTIONS = [
  {
    label: trans("tabbedContainer.switchTab"),
    value: "change",
    description: trans("tabbedContainer.switchTabDesc"),
  },
] as const;

const TAB_BEHAVIOR_OPTIONS = [
  { label: trans("tabbedContainer.tabBehaviorLazy"), value: "lazy" },
  { label: trans("tabbedContainer.tabBehaviorKeepAlive"), value: "keep-alive" },
  { label: trans("tabbedContainer.tabBehaviorDestroy"), value: "destroy" },
] as const;

const TabBehaviorControl = dropdownControl(TAB_BEHAVIOR_OPTIONS, "lazy");

const childrenMap = {
  tabs: TabsOptionControl,
  selectedTabKey: stringExposingStateControl("key", "Tab1"),
  containers: withDefault(sameTypeMap(SimpleContainerComp), {
    0: { layout: {}, items: {} },
    1: { layout: {}, items: {} },
  }),
  autoHeight: AutoHeightControl,
  showVerticalScrollbar: withDefault(BoolControl, false),
  horizontalGridCells: SliderControl,
  scrollbars: withDefault(BoolControl, false),
  placement: withDefault(PositionControl, "top"),
  onEvent: eventHandlerControl(EVENT_OPTIONS),
  disabled: BoolCodeControl,
  showHeader: withDefault(BoolControl, true),
  tabBehavior: withDefault(TabBehaviorControl, "lazy"),
  style: styleControl(TabContainerStyle , 'style'),
  headerStyle: styleControl(ContainerHeaderStyle , 'headerStyle'),
  bodyStyle: styleControl(TabBodyStyle , 'bodyStyle'),
  animationStyle: styleControl(AnimationStyle , 'animationStyle'),
  tabsGutter: withDefault(NumberControl, 32),
  tabsCentered: withDefault(BoolControl, false),
};

type ViewProps = RecordConstructorToView<typeof childrenMap>;
type TabbedContainerProps = ViewProps & { dispatch: DispatchType };

const getStyle = (
  style: TabContainerStyleType,
  headerStyle: ContainerHeaderStyleType,
  bodyStyle: TabBodyStyleType,
) => {
  return css`
    &.ant-tabs {
      overflow: hidden;
      border: ${style.borderWidth} ${style.borderStyle} ${style.border};
      border-radius: ${style.radius};
      padding: ${style.padding};
      ${getBackgroundStyle(style)}

      > .ant-tabs-content-holder > .ant-tabs-content > .ant-tabs-tabpane {
        height: 100%;
        .react-grid-layout {
          border-radius: 0;
          padding: ${bodyStyle.containerBodyPadding};
          ${getBackgroundStyle(bodyStyle)}
        }
      }

      > .ant-tabs-nav {
        padding: ${headerStyle.containerHeaderPadding};
        ${getBackgroundStyle({
          background: headerStyle.headerBackground,
          backgroundImage: headerStyle.headerBackgroundImage,
          backgroundImageSize: headerStyle.headerBackgroundImageSize,
          backgroundImageRepeat: headerStyle.headerBackgroundImageRepeat,
          backgroundImageOrigin: headerStyle.headerBackgroundImageOrigin,
          backgroundImagePosition: headerStyle.headerBackgroundImagePosition,
        })}

        .ant-tabs-tab {
          div {
            color: #8b8fa3;
          }

          &.ant-tabs-tab-active div {
            color: ${style.accent};
          }
        }

        .ant-tabs-tab-btn {
          color: ${style.tabText} !important;
          font-size: ${style.textSize};
          font-family:${style.fontFamily};
          font-weight:${style.textWeight};
          text-transform:${style.textTransform};
          text-decoration:${style.textDecoration};
          font-style:${style.fontStyle};
        }

        .ant-tabs-ink-bar {
          background-color: ${style.accent};
        }

        ::before {
          border-color: ${style.border};
        }
      }
    }
  `;
};

const StyledTabs = styled(Tabs)<{
  $style: TabContainerStyleType;
  $headerStyle: ContainerHeaderStyleType;
  $bodyStyle: TabBodyStyleType;
  $isMobile?: boolean;
  $showHeader?: boolean;
  $animationStyle:AnimationStyleType;
  $isDestroyPane?: boolean;
}>`
  &.ant-tabs {
    height: 100%;
    ${props=>props.$animationStyle}
  }

  .ant-tabs-content-animated {
    transition-duration: 0ms;
  }

  .ant-tabs-content {
    height: 100%;
  }

  .ant-tabs-nav {
    display: ${(props) => (props.$showHeader ? "block" : "none")};
    padding: 0 ${(props) => (props.$isMobile ? 16 : 24)}px;
    margin: 0px;
  }

  .ant-tabs-tab + .ant-tabs-tab {
    margin: 0 0 0 20px;
  }

  .ant-tabs-nav-operations {
    margin-right: -24px;
  }

  ${(props) =>
    props.$style && getStyle(props.$style, props.$headerStyle, props.$bodyStyle)}

  /* Conditional styling for all modes except Destroy Inactive Pane */
  ${(props) => !props.$isDestroyPane && `
    .ant-tabs-content-holder { position: relative; }
 
    .ant-tabs-tabpane[aria-hidden="true"],
    .ant-tabs-tabpane-hidden {
      display: block !important;
      visibility: hidden !important;
      position: absolute !important;
      inset: 0;
      pointer-events: none;
    }
  `}
`;

const ContainerInTab = (props: ContainerBaseProps) => {
  return <InnerGrid {...props} emptyRows={15} hintPlaceholder={HintPlaceHolder} />;
};

type TabPaneContentProps = {
  autoHeight: boolean;
  showVerticalScrollbar: boolean;
  paddingWidth: number;
  horizontalGridCells: number;
  bodyBackground: string;
  layoutView: any;
  itemsView: any;
  positionParamsView: any;
  dispatch: DispatchType;
};

const TabPaneContent: React.FC<TabPaneContentProps> = ({
  autoHeight,
  showVerticalScrollbar,
  paddingWidth,
  horizontalGridCells,
  bodyBackground,
  layoutView,
  itemsView,
  positionParamsView,
  dispatch,
}) => {
  const gridItems = useMemo(() => gridItemCompToGridItems(itemsView), [itemsView]);

  return (
    <BackgroundColorContext.Provider value={bodyBackground}>
      <ScrollBar
        style={{ height: autoHeight ? "auto" : "100%", margin: "0px", padding: "0px" }}
        hideScrollbar={!showVerticalScrollbar}
        overflow={autoHeight ? "hidden" : "scroll"}
      >
        <ContainerInTab
          layout={layoutView}
          items={gridItems}
          horizontalGridCells={horizontalGridCells}
          positionParams={positionParamsView}
          dispatch={dispatch}
          autoHeight={autoHeight}
          containerPadding={[paddingWidth, 20]}
        />
      </ScrollBar>
    </BackgroundColorContext.Provider>
  );
};

const TabbedContainer = (props: TabbedContainerProps) => {
  let {
    tabs,
    containers,
    dispatch,
    style,
    headerStyle,
    bodyStyle,
    horizontalGridCells,
    tabBehavior,
  } = props;

  const visibleTabs = tabs.filter((tab) => !tab.hidden);
  const selectedTab = visibleTabs.find((tab) => tab.key === props.selectedTabKey.value);
  const activeKey = selectedTab? selectedTab.key: visibleTabs.length > 0 ? visibleTabs[0].key : undefined;

  useEffect(() => {
    if (activeKey && activeKey !== props.selectedTabKey.value) {
      props.selectedTabKey.onChange(activeKey);
    }
  }, [activeKey, props.selectedTabKey.value]);

  const editorState = useContext(EditorContext);
  const maxWidth = editorState.getAppSettings().maxWidth;
  const isMobile = checkIsMobile(maxWidth);
  const showHeader = props.showHeader.valueOf();
  const paddingWidth = isMobile ? 8 : 0;

  const tabItems = visibleTabs.map((tab) => {
    const id = String(tab.id);
    const childDispatch = wrapDispatch(wrapDispatch(dispatch, "containers"), id);
    const containerChildren = containers[id].children;
    const hasIcon = tab.icon.props.value;

    const label = (
      <>
        {tab.iconPosition === "left" && hasIcon && <span style={{ marginRight: 4 }}>{tab.icon}</span>}
        {tab.label}
        {tab.iconPosition === "right" && hasIcon && <span style={{ marginLeft: 4 }}>{tab.icon}</span>}
      </>
    );

    const forceRender = tabBehavior === "keep-alive";

    return {
      label,
      key: tab.key,
      forceRender,
      children: (
        <TabPaneContent
          autoHeight={props.autoHeight}
          showVerticalScrollbar={props.showVerticalScrollbar}
          paddingWidth={paddingWidth}
          horizontalGridCells={horizontalGridCells}
          bodyBackground={bodyStyle.background}
          layoutView={containerChildren.layout.getView()}
          itemsView={containerChildren.items.getView()}
          positionParamsView={containerChildren.positionParams.getView()}
          dispatch={childDispatch}
        />
      ),
    };
  });

  return (
      <div style={{padding: props.style.margin, height: props.autoHeight ? "auto" : "100%"}}>
      <BackgroundColorContext.Provider value={headerStyle.headerBackground}>
        <StyledTabs
          destroyOnHidden={tabBehavior === "destroy"}
          $animationStyle={props.animationStyle}
          tabPosition={props.placement}
          activeKey={activeKey}
          $style={style}
          $headerStyle={headerStyle}
          $bodyStyle={bodyStyle}
          $showHeader={showHeader}
          $isDestroyPane={tabBehavior === "destroy"}
          onChange={(key) => {
            if (key !== props.selectedTabKey.value) {
              props.selectedTabKey.onChange(key);
              props.onEvent("change");
            }
          }}
          animated
          $isMobile={isMobile}
          items={tabItems}
          tabBarGutter={props.tabsGutter}
          centered={props.tabsCentered}
        />
      </BackgroundColorContext.Provider>
    </div>
  );
};

export const TabbedContainerBaseComp = (function () {
  return new UICompBuilder(childrenMap, (props, dispatch) => {
    return (
      <DisabledContext.Provider value={props.disabled}>
        <TabbedContainer {...props} dispatch={dispatch} />
      </DisabledContext.Provider>
    );
  })
    .setPropertyViewFn((children) => {
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.tabs.propertyView({
              title: trans("tabbedContainer.tab"),
              newOptionLabel: "Tab",
            })}
            {children.selectedTabKey.propertyView({ label: trans("prop.defaultValue") })}
          </Section>

          {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <Section name={sectionNames.interaction}>
              {children.onEvent.getPropertyView()}
              {disabledPropertyView(children)}
              {hiddenPropertyView(children)}
              {children.showHeader.propertyView({ label: trans("tabbedContainer.showTabs") })}
              {children.tabBehavior.propertyView({
                label: trans("tabbedContainer.tabBehavior"),
                tooltip: (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div>
                      <b>{trans("tabbedContainer.tabBehaviorLazy")}:</b>
                      &nbsp;{trans("tabbedContainer.tabBehaviorLazyTooltip")}
                    </div>
                    <div>
                      <b>{trans("tabbedContainer.tabBehaviorKeepAlive")}:</b>
                      &nbsp;{trans("tabbedContainer.tabBehaviorKeepAliveTooltip")}
                    </div>
                    <div>
                      <b>{trans("tabbedContainer.tabBehaviorDestroy")}:</b>
                      &nbsp;{trans("tabbedContainer.tabBehaviorDestroyTooltip")}
                    </div>
                  </div>
                ),
              })}
            </Section>
          )}

          {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <>
              <Section name={sectionNames.layout}>
                {children.placement.propertyView({ label: trans("tabbedContainer.placement"), radioButton: true })}
                {children.tabsCentered.propertyView({ label: trans("tabbedContainer.tabsCentered")})}
                { children.tabsGutter.propertyView({ label: trans("tabbedContainer.gutter"), tooltip : trans("tabbedContainer.gutterTooltip") })}
                {children.horizontalGridCells.propertyView({
                  label: trans('prop.horizontalGridCells'),
                })}
                {children.autoHeight.getPropertyView()}
                {!children.autoHeight.getView() && (
                  children.showVerticalScrollbar.propertyView({
                    label: trans("prop.showVerticalScrollbar"),
                  })
                )}
              </Section>
              <Section name={sectionNames.style}>
                {children.style.getPropertyView()}
              </Section>
              {children.showHeader.getView() && (
                <Section name={"Header Style"}>
                  { children.headerStyle.getPropertyView() }
                </Section>
              )}
              <Section name={"Body Style"}>
                { children.bodyStyle.getPropertyView() }
              </Section>
              <Section name={sectionNames.animationStyle} hasTooltip={true}>
                { children.animationStyle.getPropertyView() }
              </Section>
            </>
          )}
        </>
      );
    })
    .build();
})();

class TabbedContainerImplComp extends TabbedContainerBaseComp implements IContainer {
  private syncContainers(): this {
    const tabs = this.children.tabs.getView();
    const ids: Set<string> = new Set(tabs.map((tab) => String(tab.id)));
    let containers = this.children.containers.getView();
    // delete
    const actions: CompAction[] = [];
    Object.keys(containers).forEach((id) => {
      if (!ids.has(id)) {
        actions.push(wrapChildAction("containers", wrapChildAction(id, deleteCompAction())));
      }
    });
    // new
    ids.forEach((id) => {
      if (!containers.hasOwnProperty(id)) {
        actions.push(
          wrapChildAction("containers", addMapChildAction(id, { layout: {}, items: {} }))
        );
      }
    });

    let instance = this;
    actions.forEach((action) => {
      instance = instance.reduce(action);
    });
    return instance;
  }

  override reduce(action: CompAction): this {
    if (action.type === CompActionTypes.CUSTOM) {
      const value = action.value as JSONObject;
      if (value.type === "push") {
        const itemValue = value.value as JSONObject;
        if (_.isEmpty(itemValue.key)) itemValue.key = itemValue.label;
        action = {
          ...action,
          value: {
            ...value,
            value: { ...itemValue },
          },
        } as CompAction;
      }
      const { path } = action;
      if (value.type === "delete" && path[0] === 'tabs' && this.children.tabs.getView().length <= 1) {
        messageInstance.warning(trans("tabbedContainer.atLeastOneTabError"));
        // at least one tab
        return this;
      }
    }

    let newInstance = super.reduce(action);
    if (action.type === CompActionTypes.UPDATE_NODES_V2) {
      // Need eval to get the value in StringControl
      newInstance = newInstance.syncContainers();
    }
    return newInstance;
  }

  realSimpleContainer(key?: string): SimpleContainerComp | undefined {
    let selectedTabKey = this.children.selectedTabKey.getView().value;
    const tabs = this.children.tabs.getView();
    const selectedTab = tabs.find((tab) => tab.key === selectedTabKey) ?? tabs[0];
    const id = String(selectedTab.id);
    if (_.isNil(key)) return this.children.containers.children[id];
    return Object.values(this.children.containers.children).find((container) =>
      container.realSimpleContainer(key)
    );
  }

  getCompTree(): CompTree {
    const containerMap = this.children.containers.getView();
    const compTrees = Object.values(containerMap).map((container) => container.getCompTree());
    return mergeCompTrees(compTrees);
  }

  findContainer(key: string): IContainer | undefined {
    const containerMap = this.children.containers.getView();
    for (const container of Object.values(containerMap)) {
      const foundContainer = container.findContainer(key);
      if (foundContainer) {
        return foundContainer === container ? this : foundContainer;
      }
    }
    return undefined;
  }

  getPasteValue(nameGenerator: NameGenerator): JSONValue {
    const containerMap = this.children.containers.getView();
    const containerPasteValueMap = _.mapValues(containerMap, (container) =>
      container.getPasteValue(nameGenerator)
    );

    return { ...this.toJsonValue(), containers: containerPasteValueMap };
  }

  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
}

export const TabbedContainerComp = withExposingConfigs(TabbedContainerImplComp, [
  new NameConfig("selectedTabKey", trans("tabbedContainer.selectedTabKeyDesc")),
  NameConfigHidden,
]);
