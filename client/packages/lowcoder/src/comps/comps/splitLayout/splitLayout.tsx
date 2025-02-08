import React, { useRef, useState, useEffect } from "react";
import { Splitter } from "antd";
import styled from "styled-components";
import { DispatchType, RecordConstructorToView, wrapDispatch } from "lowcoder-core";
import { CompAction, CompActionTypes, deleteCompAction, wrapChildAction } from "lowcoder-core";
import { ColumnOptionControl } from "comps/controls/optionsControl";
import { NumberControl } from "comps/controls/codeControl";
import { BoolControl } from "comps/controls/boolControl";
import { styleControl } from "comps/controls/styleControl";
import { SplitLayoutColStyle, SplitLayoutColStyleType, AnimationStyle } from "comps/controls/styleControlConstants";
import { sameTypeMap, UICompBuilder, withDefault } from "comps/generators";
import { addMapChildAction } from "comps/generators/sameTypeMap";
import { BackgroundColorContext } from "comps/utils/backgroundColorContext";
import { Section, sectionNames } from "lowcoder-design";
import { trans } from "i18n";
import { SimpleContainerComp } from "../containerBase/simpleContainerComp";
import { ContainerBaseProps, gridItemCompToGridItems, InnerGrid } from "../containerComp/containerView";
import { DisabledContext } from "comps/generators/uiCompBuilder";
import { useScreenInfo } from "../../hooks/screenInfoComp";

const SplitPanelWrapper = styled(Splitter.Panel)<{ $collapsible: boolean }>`
  flex-grow: 1;
  ${(props) => props.$collapsible && `min-width: 50px;`}
`;

export interface SplitterLayoutTypes {
  orientation: "horizontal" | "vertical";
}

/* 

const childrenMap = {
  disabled: BoolControl,
  columns: ColumnOptionControl,
  containers: withDefault(sameTypeMap(SimpleContainerComp), {
    0: { view: {}, layout: {} },
    1: { view: {}, layout: {} },
  }),
  collapsiblePanels: BoolControl,
  orientation: withDefault(ColumnOptionControl, "horizontal"),
  panelCount: withDefault(NumberControl, 2),
  columnStyle: styleControl(SplitLayoutColStyle, "columnStyle"),
  animationStyle: styleControl(AnimationStyle, "animationStyle"),
};

type ViewProps = RecordConstructorToView<typeof childrenMap>;
type SplitLayoutProps = ViewProps & { dispatch: DispatchType };
type ColumnContainerProps = Omit<ContainerBaseProps, "style"> & {
  style: SplitLayoutColStyleType;
};

const ColumnContainer = (props: ColumnContainerProps) => {
  return (
    <InnerGrid
      {...props}
      emptyRows={15}
      radius={props.style.radius}
      style={props.style}
    />
  );
};

const SplitLayout = (props: SplitLayoutProps) => {
  const screenInfo = useScreenInfo();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [componentWidth, setComponentWidth] = useState<number | null>(null);

  let { columns, containers, dispatch, collapsiblePanels, orientation, panelCount, columnStyle } = props;

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

  return (
    <BackgroundColorContext.Provider value={props.style?.background}>
      <DisabledContext.Provider value={props.disabled}>
        <div ref={containerRef} style={{ height: "100%" }}>
          <Splitter layout={orientation}>
            {Array.from({ length: panelCount }, (_, index) => {
              const id = String(index);
              const childDispatch = wrapDispatch(wrapDispatch(dispatch, "containers"), id);
              if (!containers[id]) return null;
              const containerProps = containers[id].children;

              return (
                <SplitPanelWrapper key={id} $collapsible={collapsiblePanels}>
                  <ColumnContainer
                    layout={containerProps.layout.getView()}
                    items={gridItemCompToGridItems(containerProps.items.getView())}
                    positionParams={containerProps.positionParams.getView()}
                    dispatch={childDispatch}
                    style={columnStyle}
                  />
                </SplitPanelWrapper>
              );
            })}
          </Splitter>
        </div>
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
        <Section name={sectionNames.layout}>
          {children.panelCount.propertyView({ label: trans("splitLayout.panelCount") })}
          {children.collapsiblePanels.propertyView({ label: trans("splitLayout.collapsiblePanels") })}
          {children.orientation.propertyView({ label: trans("splitLayout.orientation") })}
        </Section>
        <Section name={sectionNames.style}>
          {children.columnStyle.getPropertyView()}
          {children.animationStyle.getPropertyView()}
        </Section>
      </>
    ))
    .build();
})();

class SplitLayoutImplComp extends SplitLayoutBaseComp {
  override reduce(action: CompAction): this {
    let newInstance = super.reduce(action);
    return newInstance;
  }
}

*/

export const SplitLayoutComp = null;
