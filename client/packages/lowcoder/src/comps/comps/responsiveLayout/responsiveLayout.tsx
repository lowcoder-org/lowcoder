import { default as Row } from "antd/es/row";
import { default as Col } from "antd/es/col";
import { JSONObject, JSONValue } from "util/jsonTypes";
import { CompAction, CompActionTypes, deleteCompAction, wrapChildAction } from "lowcoder-core";
import { DispatchType, RecordConstructorToView, wrapDispatch } from "lowcoder-core";
import { AutoHeightControl } from "comps/controls/autoHeightControl";
import { ColumnOptionControl } from "comps/controls/optionsControl";
import { styleControl } from "comps/controls/styleControl";
import {
  ResponsiveLayoutRowStyle,
  ResponsiveLayoutRowStyleType,
  ResponsiveLayoutColStyle,
  ResponsiveLayoutColStyleType,
  AnimationStyle,
  AnimationStyleType
} from "comps/controls/styleControlConstants";
import { sameTypeMap, UICompBuilder, withDefault } from "comps/generators";
import { addMapChildAction } from "comps/generators/sameTypeMap";
import { NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { NameGenerator } from "comps/utils";
import { Section, controlItem, sectionNames } from "lowcoder-design";
import { HintPlaceHolder } from "lowcoder-design";
import _ from "lodash";
import React, { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import { IContainer } from "../containerBase/iContainer";
import { SimpleContainerComp } from "../containerBase/simpleContainerComp";
import { CompTree, mergeCompTrees } from "../containerBase/utils";
import {
  ContainerBaseProps,
  gridItemCompToGridItems,
  InnerGrid,
} from "../containerComp/containerView";
import { BackgroundColorContext } from "comps/utils/backgroundColorContext";
import { trans } from "i18n";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { BoolControl } from "comps/controls/boolControl";
import { BoolCodeControl, NumberControl } from "comps/controls/codeControl";

import { useContext } from "react";
import { EditorContext } from "comps/editorState";

import { disabledPropertyView, hiddenPropertyView } from "comps/utils/propertyUtils";
import { DisabledContext } from "comps/generators/uiCompBuilder";
import SliderControl from "@lowcoder-ee/comps/controls/sliderControl";
import { getBackgroundStyle } from "@lowcoder-ee/util/styleUtils";
import { useScreenInfo } from "../../hooks/screenInfoComp";


const RowWrapper = styled(Row)<{
  $style: ResponsiveLayoutRowStyleType;
  $animationStyle: AnimationStyleType;
  $showScrollbar: boolean;
  $columnCount: number;
}>`
  ${(props) => props.$animationStyle}
  height: 100%;
  border-radius: ${(props) => props.$style?.radius};
  border-width: ${(props) => props.$style?.borderWidth};
  border-color: ${(props) => props.$style?.border};
  border-style: ${(props) => props.$style?.borderStyle};
  padding: ${(props) => props.$style.padding};
  rotate: ${(props) => props.$style.rotation};
  overflow: ${(props) => (props.$showScrollbar ? 'auto' : 'hidden')};
  display: flex;
  flex-wrap: wrap; // Ensure columns wrap properly when rowBreak = true
  ::-webkit-scrollbar {
    display: ${(props) => (props.$showScrollbar ? 'block' : 'none')};
  }
  ${props => getBackgroundStyle(props.$style)}

  --columns: ${(props) => props.$columnCount || 3};
`;

const ColWrapper = styled(Col)<{
  $style: ResponsiveLayoutColStyleType | undefined;
  $minWidth?: string;
  $matchColumnsHeight: boolean;
  $rowBreak: boolean;
}>`
  display: flex;
  flex-direction: column;
  flex-grow: 1;

  // When rowBreak is true, columns are stretched evenly based on configured number
  // When rowBreak is false, they stay at minWidth but break only if necessary
  flex-basis: ${(props) =>
    props.$rowBreak
      ? `calc(100% / var(--columns))` // Force exact column distribution
      : `clamp(${props.$minWidth}, 100% / var(--columns), 100%)`}; // MinWidth respected

  min-width: ${(props) => props.$minWidth}; // Ensure minWidth is respected
  max-width: 100%; // Prevent more columns than allowed

  > div {
    height: ${(props) => (props.$matchColumnsHeight ? "100%" : "auto")};
    border-radius: ${(props) => props.$style?.radius};
    border-width: ${(props) => props.$style?.borderWidth}px;
    border-color: ${(props) => props.$style?.border};
    border-style: ${(props) => props.$style?.borderStyle};
    margin: ${(props) => props.$style?.margin};
    padding: ${(props) => props.$style?.padding};
    ${props => props.$style && getBackgroundStyle(props.$style)}
  }
`;



const childrenMap = { 
  disabled: BoolCodeControl,
  columns: ColumnOptionControl,
  containers: withDefault(sameTypeMap(SimpleContainerComp), {
    0: { view: {}, layout: {} },
    1: { view: {}, layout: {} },
  }),
  horizontalGridCells: SliderControl,
  verticalGridCells: SliderControl,
  autoHeight: AutoHeightControl,
  rowBreak: withDefault(BoolControl, true),
  useComponentWidth: withDefault(BoolControl, true),
  matchColumnsHeight: withDefault(BoolControl, true),
  style: styleControl(ResponsiveLayoutRowStyle , 'style'),
  columnStyle: styleControl(ResponsiveLayoutColStyle , 'columnStyle'),
  mainScrollbar: withDefault(BoolControl, false),
  animationStyle:styleControl(AnimationStyle , 'animationStyle'),
  columnPerRowLG: withDefault(NumberControl, 4),
  columnPerRowMD: withDefault(NumberControl, 2),
  columnPerRowSM: withDefault(NumberControl, 1),
  verticalSpacing: withDefault(NumberControl, 8),
  horizontalSpacing: withDefault(NumberControl, 8),
};

type ViewProps = RecordConstructorToView<typeof childrenMap>;
type ResponsiveLayoutProps = ViewProps & { dispatch: DispatchType };
type ColumnContainerProps = Omit<ContainerBaseProps, 'style'> & {
  style: ResponsiveLayoutColStyleType,
}

const ColumnContainer = React.memo((props: ColumnContainerProps) => {
  return (
    <InnerGrid
      {...props}
      hintPlaceholder={HintPlaceHolder}
      radius={props.style.radius}
      style={props.style}
    />
  );
});

const ResponsiveLayout = (props: ResponsiveLayoutProps) => {
  const screenInfo = useScreenInfo();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [componentWidth, setComponentWidth] = useState<number | null>(null);

  let {
    columns,
    containers,
    dispatch,
    rowBreak,
    useComponentWidth,
    matchColumnsHeight,
    style,
    columnStyle,
    columnPerRowLG,
    columnPerRowMD,
    columnPerRowSM,
    verticalSpacing,
    horizontalSpacing,
    animationStyle,
    horizontalGridCells,
    mainScrollbar,
    autoHeight
  } = props;

  // Ensure screenInfo is initialized properly
  const safeScreenInfo = screenInfo && screenInfo.width
    ? screenInfo
    : { width: window.innerWidth, height: window.innerHeight, deviceType: "desktop" };

  // Get device type based on width
  const getDeviceType = (width: number) => {
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  };

  // Observe component width dynamically
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setComponentWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const totalColumns = columns.length;

  // Decide between screen width or component width
  const effectiveWidth = useComponentWidth ? componentWidth ?? safeScreenInfo.width : safeScreenInfo.width;
  const effectiveDeviceType = useComponentWidth ? getDeviceType(effectiveWidth || 1000) : safeScreenInfo.deviceType;

  // Get columns per row based on device type
  let configuredColumnsPerRow = effectiveDeviceType === "mobile"
    ? columnPerRowSM
    : effectiveDeviceType === "tablet"
    ? columnPerRowMD
    : columnPerRowLG;

  // Calculate max columns that fit based on minWidth
  let maxColumnsThatFit = componentWidth
    ? Math.floor(componentWidth / Math.max(...columns.map((col) => parseFloat(col.minWidth || "0"))))
    : configuredColumnsPerRow;

  // Determine actual number of columns
  let numberOfColumns = rowBreak ? configuredColumnsPerRow : Math.min(maxColumnsThatFit, totalColumns);

  return (
    <BackgroundColorContext.Provider value={props.style.background}>
      <DisabledContext.Provider value={props.disabled}>
        <div ref={containerRef} style={{ padding: style.margin, height: "100%" }}>  
          <RowWrapper
            $style={{ ...style }}
            $animationStyle={animationStyle}
            $showScrollbar={mainScrollbar}
            $columnCount={numberOfColumns} 
            wrap={rowBreak}
            gutter={[horizontalSpacing, verticalSpacing]}
          >
            {columns.map((column) => {
              const id = String(column.id);
              const childDispatch = wrapDispatch(wrapDispatch(dispatch, "containers"), id);
              if (!containers[id]) return null;
              const containerProps = containers[id].children;

              const calculatedWidth = 100 / numberOfColumns;

              return (
                <ColWrapper
                  key={id}
                  lg={rowBreak ? 24 / numberOfColumns : undefined} 
                  md={rowBreak ? 24 / numberOfColumns : undefined}
                  sm={rowBreak ? 24 / numberOfColumns : undefined}
                  xs={rowBreak ? 24 / numberOfColumns : undefined}
                  $style={props.columnStyle}
                  $minWidth={`${calculatedWidth}px`}
                  $matchColumnsHeight={matchColumnsHeight}
                  $rowBreak={rowBreak}
                >
                  <ColumnContainer
                    layout={containerProps.layout.getView()}
                    items={gridItemCompToGridItems(containerProps.items.getView())}
                    positionParams={containerProps.positionParams.getView()}
                    dispatch={childDispatch}
                    autoHeight={props.autoHeight}
                    horizontalGridCells={horizontalGridCells}
                    style={columnStyle}
                    emptyRows={props.verticalGridCells}
                  />
                </ColWrapper>
              );
            })}
          </RowWrapper>
        </div>
      </DisabledContext.Provider>
    </BackgroundColorContext.Provider>
  );
};


export const ResponsiveLayoutBaseComp = (function () {
  return new UICompBuilder(childrenMap, (props, dispatch) => {  
    return (
      <ResponsiveLayout {...props} dispatch={dispatch} />
    );
  })
    .setPropertyViewFn((children) => {
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.columns.propertyView({
              title: trans("responsiveLayout.column"),
              newOptionLabel: "Column",
            })}
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
              {children.autoHeight.getPropertyView()}
              {(!children.autoHeight.getView()) && children.mainScrollbar.propertyView({
                label: trans("prop.mainScrollbar")
              })}
              {children.horizontalGridCells.propertyView({
                label: trans('prop.horizontalGridCells'),
              })}
              {children.verticalGridCells.propertyView({
                label: trans('prop.verticalGridCells'),
              })}
            </Section>
            <Section name={trans("responsiveLayout.rowLayout")}>
              {children.rowBreak.propertyView({
                label: trans("responsiveLayout.rowBreak")
              })}
              {children.useComponentWidth.propertyView({
                label: trans("responsiveLayout.useComponentWidth"),
                tooltip : trans("responsiveLayout.useComponentWidthDesc")
              })}
              {controlItem({}, (
                <div style={{ marginTop: '8px' }}>
                  {trans("responsiveLayout.columnsPerRow")}
                </div>
              ))}
              {children.columnPerRowLG.propertyView({
                label: trans("responsiveLayout.desktop")
              })}
              {children.columnPerRowMD.propertyView({
                label: trans("responsiveLayout.tablet")
              })}
              {children.columnPerRowSM.propertyView({
                label: trans("responsiveLayout.mobile")
              })}
            </Section>
            <Section name={trans("responsiveLayout.columnsLayout")}>
              {children.matchColumnsHeight.propertyView({
                label: trans("responsiveLayout.matchColumnsHeight")
              })}
              {controlItem({}, (
                <div style={{ marginTop: '8px' }}>
                  {trans("responsiveLayout.columnsSpacing")}
                </div>
              ))}
              {children.horizontalSpacing.propertyView({
                label: trans("responsiveLayout.horizontal")
              })}
              {children.verticalSpacing.propertyView({
                label: trans("responsiveLayout.vertical")
              })}
            </Section>
            <Section name={trans("responsiveLayout.rowStyle")}>
              {children.style.getPropertyView()}
            </Section>
            <Section name={trans("responsiveLayout.columnStyle")}>
              {children.columnStyle.getPropertyView()}
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
})();

class ResponsiveLayoutImplComp extends ResponsiveLayoutBaseComp implements IContainer {
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

export const ResponsiveLayoutComp = withExposingConfigs(
  ResponsiveLayoutImplComp,
  [ NameConfigHidden]
);
