import React, { useRef, useState, useEffect } from "react";
import { Splitter } from "antd";
import styled from "styled-components";
import { DispatchType, RecordConstructorToView, wrapDispatch } from "lowcoder-core";
import { CompAction, CompActionTypes, deleteCompAction, wrapChildAction } from "lowcoder-core";
import { SplitColumnOptionControl } from "comps/controls/optionsControl";
import { NumberControl, StringControl } from "comps/controls/codeControl";
import { BoolControl } from "comps/controls/boolControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { styleControl } from "comps/controls/styleControl";
import { SplitLayoutColStyle, SplitLayoutRowStyle, SplitLayoutRowStyleType, SplitLayoutColStyleType, AnimationStyle, heightCalculator } from "comps/controls/styleControlConstants";
import { sameTypeMap, UICompBuilder, withDefault } from "comps/generators";
import { addMapChildAction } from "comps/generators/sameTypeMap";
import { BackgroundColorContext } from "comps/utils/backgroundColorContext";
import { Section, sectionNames} from "lowcoder-design";
import { trans } from "i18n";
import { ContainerBaseProps, gridItemCompToGridItems, InnerGrid } from "../containerComp/containerView";
import { useContext } from "react";
import { EditorContext } from "comps/editorState";

import { disabledPropertyView, hiddenPropertyView } from "comps/utils/propertyUtils";
import { DisabledContext } from "comps/generators/uiCompBuilder";
import { JSONObject, JSONValue } from "util/jsonTypes";
import { IContainer } from "../containerBase/iContainer";
import { SimpleContainerComp } from "../containerBase/simpleContainerComp";
import { CompTree, mergeCompTrees } from "../containerBase/utils";
import { NameGenerator } from "comps/utils";
import { AutoHeightControl } from "comps/controls/autoHeightControl";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { SliderControl } from "@lowcoder-ee/comps/controls/sliderControl";
import { getBackgroundStyle } from "@lowcoder-ee/util/styleUtils";
import _ from "lodash";

import { 
  HorizontalIcon,
  VerticalIcon,
} from "lowcoder-design/src/icons";

const SplitPanelWrapper = styled(Splitter.Panel)`
  overflow: hidden;
`;

const SplitterWrapper = styled.div<{ $style: SplitLayoutRowStyleType }>`
  height: 100%;
  border-radius: ${(props) => props.$style?.radius || "0px"};
  border-width: ${(props) => props.$style?.borderWidth || "0px"};
  border-color: ${(props) => props.$style?.border || "transparent"};
  border-style: ${(props) => props.$style?.borderStyle || "solid"};
  margin: ${(props) => props.$style?.margin || "0px"};
  padding: ${(props) => props.$style?.padding || "0px"};
  ${(props) => (props.$style ? getBackgroundStyle(props.$style) : "")}
`;

const OrientationOptions = [
  {
    label: <HorizontalIcon />,
    value: "horizontal",
  },
  {
    label: <VerticalIcon />,
    value: "vertical",
  },
] as const;

const childrenMap = {
  disabled: BoolControl,
  columns: SplitColumnOptionControl,
  containers: withDefault(sameTypeMap(SimpleContainerComp), {
    0: { view: {}, layout: {} },
    1: { view: {}, layout: {} },
  }),
  autoHeight: AutoHeightControl,
  horizontalGridCells: SliderControl,
  verticalGridCells: SliderControl,
  orientation: dropdownControl(OrientationOptions, "horizontal"),
  matchColumnsHeight: withDefault(BoolControl, true),
  columnStyle: styleControl(SplitLayoutColStyle, "columnStyle"),
  bodyStyle: styleControl(SplitLayoutRowStyle, 'bodyStyle'),
  animationStyle: styleControl(AnimationStyle, "animationStyle"),
  mainScrollbar: withDefault(BoolControl, false),
};

type ViewProps = RecordConstructorToView<typeof childrenMap>;
type SplitLayoutProps = ViewProps & { dispatch: DispatchType };

type ColumnContainerProps = Omit<ContainerBaseProps, "style"> & {
  style: SplitLayoutColStyleType;
  matchColumnsHeight: boolean;
  backgroundColor: string;
  backgroundImage: string;
  padding: string;
  orientation: string;
  margin: string;
};

const ColumnContainer = (props: ColumnContainerProps) => {
  return (
    <InnerGrid
      {...props}
      radius={props.style.radius}
      bgColor={props.backgroundColor}
      style={{
        ...props.style,
        height: props.orientation === "horizontal"
          ? (props.matchColumnsHeight ? heightCalculator(props.margin) : "auto")
          : (props.autoHeight ? heightCalculator(props.margin) : heightCalculator(props.margin)),
        overflow: 'auto',
      }}
    />
  );
};

const SplitLayout = (props: SplitLayoutProps) => {

  return (
    <BackgroundColorContext.Provider value={props.columnStyle.background}>
      <DisabledContext.Provider value={props.disabled}>
        <SplitterWrapper $style={props.bodyStyle}>
          <Splitter
            style={{
              overflow: props.mainScrollbar ? "auto" : "hidden",
              height: props.autoHeight && props.orientation === 'vertical' ? '500px' : '100%',
            }}
            layout={props.orientation}
          >
            {props.columns.map((col, index) => {
              const id = String(col.id);
              const childDispatch = wrapDispatch(wrapDispatch(props.dispatch, "containers"), id);
              const containerProps = props.containers[id]?.children;

              return (
                <SplitPanelWrapper 
                  key={id} 
                  collapsible={col.collapsible}
                  {...(col.minWidth !== undefined ? { min: col.minWidth } : {})}
                  {...(col.maxWidth !== undefined ? { max: col.maxWidth } : {})}
                  {...(col.width !== undefined ? { defaultSize: col.width } : {})}
                >
                  <ColumnContainer
                    layout={containerProps.layout.getView()}
                    items={gridItemCompToGridItems(containerProps.items.getView())}
                    positionParams={containerProps.positionParams.getView()}
                    dispatch={childDispatch}
                    style={props.columnStyle}
                    backgroundColor={col.backgroundColor}
                    backgroundImage={col.backgroundImage}
                    padding={col.padding}
                    autoHeight={props.autoHeight}
                    horizontalGridCells={props.horizontalGridCells}
                    emptyRows={props.verticalGridCells}
                    matchColumnsHeight={props.matchColumnsHeight}
                    orientation={props.orientation}
                    margin={props.columnStyle.margin}
                  />
                </SplitPanelWrapper>
              );
            })}
          </Splitter>
        </SplitterWrapper>
      </DisabledContext.Provider>
    </BackgroundColorContext.Provider>

  );
};

export const SplitLayoutBaseComp = (function () {
  return new UICompBuilder(childrenMap, (props, dispatch) => <SplitLayout {...props} dispatch={dispatch} />)
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.columns.propertyView({ title: trans("splitLayout.column") })}
        </Section>

        {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
            <Section name={sectionNames.interaction}>
              {disabledPropertyView(children)}
              {hiddenPropertyView(children)}
            </Section>
          )}
        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <>
            <Section name={sectionNames.layout}>
              {children.orientation.propertyView({
                label: trans("splitLayout.orientation"),
                radioButton: true,
                tooltip: trans("splitLayout.orientationTooltip"),
              })}
              {children.autoHeight.getPropertyView()}
              {(!children.autoHeight.getView()) && children.mainScrollbar.propertyView({
                label: trans("prop.mainScrollbar")
              })}
              {(children.orientation.getView() == "horizontal") && 
                children.matchColumnsHeight.propertyView({ label: trans("splitLayout.matchColumnsHeight") }
              )}
              {children.horizontalGridCells.propertyView({
                label: trans('prop.horizontalGridCells'),
              })}
              {children.verticalGridCells.propertyView({
                label: trans('prop.verticalGridCells'),
              })}
            </Section>
            <Section name={sectionNames.bodyStyle}> 
              {children.bodyStyle.getPropertyView()}
            </Section>
            <Section name={sectionNames.detailStyle}> 
              {children.columnStyle.getPropertyView()}
            </Section>
            <Section name={sectionNames.animationStyle} hasTooltip={true}>
              {children.animationStyle.getPropertyView()}
            </Section>
          </>
        )}
      </>
    ))
    .build();
})();

class SplitLayoutImplComp extends SplitLayoutBaseComp implements IContainer {
  private syncContainers(): this {
    const columns = this.children.columns.getView();
    const ids: Set<string> = new Set(columns.map((column) => String(column.id)));
    let containers = this.children.containers.getView();
    // delete
    const actions: CompAction[] = [];
    Object.keys(containers).forEach((id) => {
      if (!ids.has(id)) {
        // log.debug("syncContainers delete. ids=", ids, " id=", id);
        actions.push(wrapChildAction("containers", wrapChildAction(id, deleteCompAction())));
      }
    });
    // new
    ids.forEach((id) => {
      if (!containers.hasOwnProperty(id)) {
        // log.debug("syncContainers new containers: ", containers, " id: ", id);
        actions.push(
          wrapChildAction("containers", addMapChildAction(id, { layout: {}, items: {} }))
        );
      }
    });
    // log.debug("syncContainers. actions: ", actions);
    let instance = this;
    actions.forEach((action) => {
      instance = instance.reduce(action);
    });
    return instance;
  }

  override reduce(action: CompAction): this {
    const columns = this.children.columns.getView();
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
      if (value.type === "delete" && path[0] === 'columns' && columns.length <= 1) {
        messageInstance.warning(trans("responsiveLayout.atLeastOneColumnError"));
        // at least one column
        return this;
      }
    }
    // log.debug("before super reduce. action: ", action);
    let newInstance = super.reduce(action);
    if (action.type === CompActionTypes.UPDATE_NODES_V2) {
      // Need eval to get the value in StringControl
      newInstance = newInstance.syncContainers();
    }
    // log.debug("reduce. instance: ", this, " newInstance: ", newInstance);
    return newInstance;
  }

  realSimpleContainer(key?: string): SimpleContainerComp | undefined {
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

export const SplitLayoutComp = withExposingConfigs(
  SplitLayoutImplComp,
  [ NameConfigHidden]
);