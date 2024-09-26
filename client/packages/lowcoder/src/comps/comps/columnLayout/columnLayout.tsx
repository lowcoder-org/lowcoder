import { default as Row } from "antd/es/row";
import { default as Col } from "antd/es/col";
import { JSONObject, JSONValue } from "util/jsonTypes";
import { CompAction, CompActionTypes, deleteCompAction, wrapChildAction } from "lowcoder-core";
import { DispatchType, RecordConstructorToView, wrapDispatch } from "lowcoder-core";
import { AutoHeightControl } from "comps/controls/autoHeightControl";
import { ColumnOptionControl } from "comps/controls/optionsControl";
import { styleControl } from "comps/controls/styleControl";
import {
  ContainerStyle,
  ContainerStyleType,
  ResponsiveLayoutColStyleType,
  ResponsiveLayoutColStyle
} from "comps/controls/styleControlConstants";

import { sameTypeMap, UICompBuilder, withDefault } from "comps/generators";
import { addMapChildAction } from "comps/generators/sameTypeMap";
import { NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { NameGenerator } from "comps/utils";
import { ScrollBar, Section, controlItem, sectionNames } from "lowcoder-design";
import { HintPlaceHolder } from "lowcoder-design";
import _ from "lodash";
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
import { BoolCodeControl, NumberControl, StringControl } from "comps/controls/codeControl";

import { useContext, useEffect } from "react";
import { EditorContext } from "comps/editorState";

import { disabledPropertyView, hiddenPropertyView } from "comps/utils/propertyUtils";
import { DisabledContext } from "comps/generators/uiCompBuilder";
import SliderControl from "@lowcoder-ee/comps/controls/sliderControl";

const ContainWrapper = styled.div<{
  $style: ContainerStyleType & {
    display: string,
    gridTemplateColumns: string,
    columnGap: string,
    gridTemplateRows: string,
    rowGap: string,
  } | undefined;
}>`
  display: ${(props) => props.$style?.display};
  grid-template-columns: ${(props) => props.$style?.gridTemplateColumns};
  grid-template-rows: ${(props) => props.$style?.gridTemplateRows};
  column-gap: ${(props) => props.$style?.columnGap};
  row-gap: ${(props) => props.$style?.rowGap};

  background-color: ${(props) => props.$style?.background} !important;
  border-radius: ${(props) => props.$style?.radius};
  border-width: ${(props) => props.$style?.borderWidth};
  border-color: ${(props) => props.$style?.border};
  border-style: ${(props) => props.$style?.borderStyle};
  margin: ${(props) => props.$style?.margin};
  padding: ${(props) => props.$style?.padding};
`;

const ColWrapper = styled(Col)<{
  $style: ResponsiveLayoutColStyleType | undefined,
  $minWidth?: string,
  $matchColumnsHeight: boolean,
}>`
  > div {
    height: ${(props) => props.$matchColumnsHeight ? `calc(100% - ${props.$style?.padding || 0} - ${props.$style?.padding || 0})` : 'auto'};
    background-color: ${(props) => props.$style?.background} !important;
    border-radius: ${(props) => props.$style?.radius};
    border-width: ${(props) => props.$style?.borderWidth};
    border-color: ${(props) => props.$style?.border};
    border-style: ${(props) => props.$style?.borderStyle};
    margin: ${(props) => props.$style?.margin};
    padding: ${(props) => props.$style?.padding};
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
  autoHeight: AutoHeightControl,
  matchColumnsHeight: withDefault(BoolControl, true),
  templateRows: withDefault(StringControl, "1fr"),
  rowGap: withDefault(StringControl, "20px"),
  templateColumns: withDefault(StringControl, "1fr 1fr"),
  mainScrollbar: withDefault(BoolControl, false),
  columnGap: withDefault(StringControl, "20px"),
  style: styleControl(ContainerStyle, 'style'),
  columnStyle: styleControl(ResponsiveLayoutColStyle , 'columnStyle')
};

type ViewProps = RecordConstructorToView<typeof childrenMap>;
type ColumnLayoutProps = ViewProps & { dispatch: DispatchType };
type ColumnContainerProps = Omit<ContainerBaseProps, 'style'> & {
  style: ResponsiveLayoutColStyleType,
}

const ColumnContainer = (props: ColumnContainerProps) => {
  return (
    <InnerGrid
      {...props}
      emptyRows={15}
      hintPlaceholder={HintPlaceHolder}
      radius={"0"}
      style={props.style}
      enableGridLines={false}
    />
  );
};


const ColumnLayout = (props: ColumnLayoutProps) => {
  let {
    columns, 
    containers,
    dispatch,
    matchColumnsHeight,
    templateRows,
    rowGap,
    templateColumns,
    columnGap,
    columnStyle,
    horizontalGridCells,
    mainScrollbar
  } = props;

  return (
    <BackgroundColorContext.Provider value={props.style.background}>
      <DisabledContext.Provider value={props.disabled}>
        <div style={{ height: "inherit", overflow: "auto"}}>
        <ScrollBar style={{ margin: "0px", padding: "0px" }} overflow="scroll" hideScrollbar={!mainScrollbar}>
          <ContainWrapper $style={{
            ...props.style,
            display: "grid",
            gridTemplateColumns: templateColumns,
            columnGap,
            gridTemplateRows: templateRows,
            rowGap,
          }}>
            {columns.map(column => {
              const id = String(column.id);
              const childDispatch = wrapDispatch(wrapDispatch(dispatch, "containers"), id);
              if(!containers[id]) return null
              const containerProps = containers[id].children;
              const noOfColumns = columns.length;
              return (
                <BackgroundColorContext.Provider value={props.columnStyle.background}>
                  <ColWrapper
                    key={id}
                    $style={props.columnStyle}
                    $minWidth={column.minWidth}
                    $matchColumnsHeight={matchColumnsHeight}
                  >
                    <ColumnContainer
                      layout={containerProps.layout.getView()}
                      items={gridItemCompToGridItems(containerProps.items.getView())}
                      horizontalGridCells={horizontalGridCells}
                      positionParams={containerProps.positionParams.getView()}
                      dispatch={childDispatch}
                      autoHeight={props.autoHeight}
                      style={columnStyle}
                    />
                  </ColWrapper>
                </BackgroundColorContext.Provider>
              )
              })
            }
          </ContainWrapper>
        </ScrollBar>
        </div>
      </DisabledContext.Provider>
    </BackgroundColorContext.Provider>
  );
};

export const ResponsiveLayoutBaseComp = (function () {
  return new UICompBuilder(childrenMap, (props, dispatch) => {
    return (
      <ColumnLayout {...props} dispatch={dispatch} />
    );
  })
    .setPropertyViewFn((children) => {
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.columns.propertyView({
              title: trans("responsiveLayout.column"),
              newOptionLabel: trans("responsiveLayout.addColumn"),
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
            </Section>
            <Section name={trans("responsiveLayout.columnsLayout")}>
              {children.matchColumnsHeight.propertyView({ label: trans("responsiveLayout.matchColumnsHeight")
              })}
              {controlItem({}, (
                <div style={{ marginTop: '8px' }}>{trans("responsiveLayout.columnsSpacing")}</div>
              ))}
              {children.templateColumns.propertyView({label: trans("responsiveLayout.columnDefinition"), tooltip: trans("responsiveLayout.columnsDefinitionTooltip")})}
              {children.templateRows.propertyView({label: trans("responsiveLayout.rowDefinition"), tooltip: trans("responsiveLayout.rowsDefinitionTooltip")})}
              {children.columnGap.propertyView({label: trans("responsiveLayout.columnGap")})}
              {children.rowGap.propertyView({label: trans("responsiveLayout.rowGap")})}
            </Section>
            </>
          )}

          {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
            <>
              <Section name={sectionNames.style}>
                {children.style.getPropertyView()}
              </Section>
              <Section name={sectionNames.columnStyle}>
                {children.columnStyle.getPropertyView()}
              </Section>
            </>
          )}
        </>
      );
    })
    .build();
})();

class ColumnLayoutImplComp extends ResponsiveLayoutBaseComp implements IContainer {
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

export const ColumnLayoutComp = withExposingConfigs(
  ColumnLayoutImplComp,
  [ NameConfigHidden]
);
