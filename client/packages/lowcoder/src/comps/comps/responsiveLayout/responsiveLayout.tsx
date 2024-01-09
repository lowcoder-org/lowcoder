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
  ResponsiveLayoutColStyleType,
  ResponsiveLayoutColStyle
} from "comps/controls/styleControlConstants";
import { sameTypeMap, UICompBuilder, withDefault } from "comps/generators";
import { addMapChildAction } from "comps/generators/sameTypeMap";
import { NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { NameGenerator } from "comps/utils";
import { Section, controlItem, sectionNames } from "lowcoder-design";
import { HintPlaceHolder } from "lowcoder-design";
import _ from "lodash";
import React from "react";
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
import { messageInstance } from "lowcoder-design";
import { BoolControl } from "comps/controls/boolControl";
import { NumberControl } from "comps/controls/codeControl";

import { useContext } from "react";
import { EditorContext } from "comps/editorState";

const RowWrapper = styled(Row)<{$style: ResponsiveLayoutRowStyleType}>`
  height: 100%;
  border: 1px solid ${(props) => props.$style.border};
  border-radius: ${(props) => props.$style.radius};
  padding: ${(props) => props.$style.padding};
  background-color: ${(props) => props.$style.background};
  overflow-x: auto;
`;

const ColWrapper = styled(Col)<{
  $style: ResponsiveLayoutColStyleType,
  $minWidth?: string,
  $matchColumnsHeight: boolean,
}>`
  display: flex;
  flex-direction: column;
  flex-basis: ${(props) => props.$minWidth};
  max-width: ${(props) => props.$minWidth};

  > div {
    height: ${(props) => props.$matchColumnsHeight ? '100%' : 'auto'};
  }
`;

const childrenMap = {
  columns: ColumnOptionControl,
  containers: withDefault(sameTypeMap(SimpleContainerComp), {
    0: { view: {}, layout: {} },
    1: { view: {}, layout: {} },
  }),
  autoHeight: AutoHeightControl,
  rowBreak: withDefault(BoolControl, false),
  matchColumnsHeight: withDefault(BoolControl, true),
  rowStyle: withDefault(styleControl(ResponsiveLayoutRowStyle), {}),
  columnStyle: withDefault(styleControl(ResponsiveLayoutColStyle), {}),
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

const ColumnContainer = (props: ColumnContainerProps) => {
  return (
    <InnerGrid
      {...props}
      emptyRows={15}
      hintPlaceholder={HintPlaceHolder}
      radius={props.style.radius}
      style={props.style}
    />
  );
};


const ResponsiveLayout = (props: ResponsiveLayoutProps) => {
  let {
    columns,
    containers,
    dispatch,
    rowBreak,
    matchColumnsHeight,
    rowStyle,
    columnStyle,
    columnPerRowLG,
    columnPerRowMD,
    columnPerRowSM,
    verticalSpacing,
    horizontalSpacing,
  } = props;

  return (
    <BackgroundColorContext.Provider value={props.rowStyle.background}>
      <div style={{padding: rowStyle.margin, height: '100%'}}>
        <RowWrapper
          $style={rowStyle}
          wrap={rowBreak}
          gutter={[horizontalSpacing, verticalSpacing]}
        >
          {columns.map(column => {
            const id = String(column.id);
            const childDispatch = wrapDispatch(wrapDispatch(dispatch, "containers"), id);
            if(!containers[id]) return null
            const containerProps = containers[id].children;

            const columnCustomStyle = {
              margin: !_.isEmpty(column.margin) ? column.margin : columnStyle.margin,
              padding: !_.isEmpty(column.padding) ? column.padding : columnStyle.padding,
              radius: !_.isEmpty(column.radius) ? column.radius : columnStyle.radius,
              border: `1px solid ${!_.isEmpty(column.border) ? column.border : columnStyle.border}`,
              background: !_.isEmpty(column.background) ? column.background : columnStyle.background,
            }
            const noOfColumns = columns.length;
            let backgroundStyle = columnCustomStyle.background;
            if(!_.isEmpty(column.backgroundImage))  {
              backgroundStyle = `center / cover url('${column.backgroundImage}') no-repeat, ${backgroundStyle}`;
            }
            return (
              <ColWrapper
                key={id}
                lg={24/(noOfColumns < columnPerRowLG ? noOfColumns : columnPerRowLG)}
                md={24/(noOfColumns < columnPerRowMD ? noOfColumns : columnPerRowMD)}
                sm={24/(noOfColumns < columnPerRowSM ? noOfColumns : columnPerRowSM)}
                xs={24/(noOfColumns < columnPerRowSM ? noOfColumns : columnPerRowSM)}
                $style={columnCustomStyle}
                $minWidth={column.minWidth}
                $matchColumnsHeight={matchColumnsHeight}
              >
                <ColumnContainer
                  layout={containerProps.layout.getView()}
                  items={gridItemCompToGridItems(containerProps.items.getView())}
                  positionParams={containerProps.positionParams.getView()}
                  dispatch={childDispatch}
                  autoHeight={props.autoHeight}
                  style={{
                    ...columnCustomStyle,
                    background: backgroundStyle,
                  }}
                />
              </ColWrapper>
            )
            })
          }
        </RowWrapper>
      </div>
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

          {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <>
            <Section name={sectionNames.layout}>
              {children.autoHeight.getPropertyView()}
            </Section>
            <Section name={trans("responsiveLayout.rowLayout")}>
              {children.rowBreak.propertyView({
                label: trans("responsiveLayout.rowBreak")
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
              {children.rowStyle.getPropertyView()}
            </Section>
            <Section name={trans("responsiveLayout.columnStyle")}>
              {children.columnStyle.getPropertyView()}
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
