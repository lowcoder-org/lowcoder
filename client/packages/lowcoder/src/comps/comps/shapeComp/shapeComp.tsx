import { CompParams } from "lowcoder-core";
import { ToDataType } from "comps/generators/multi";
import {
  NameConfigHidden,
  withExposingConfigs,
} from "comps/generators/withExposing";
import { NameGenerator } from "comps/utils/nameGenerator";
import { Section, sectionNames } from "lowcoder-design";
import { oldContainerParamsToNew } from "../containerBase";
import { toSimpleContainerData } from "../containerBase/simpleContainerComp";
import { ShapeTriContainer } from "./shapeTriContainer";
import { ShapeControl } from "comps/controls/shapeControl";
import { withDefault } from "../../generators";
import {
  ContainerChildren,
  ContainerCompBuilder,
} from "../triContainerComp/triContainerCompBuilder";
import {
  disabledPropertyView,
  hiddenPropertyView,
  showDataLoadingIndicatorsPropertyView,
} from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { BoolCodeControl } from "comps/controls/codeControl";
import { DisabledContext } from "comps/generators/uiCompBuilder";
import React, { useContext, useEffect, useState } from "react";
import { EditorContext } from "comps/editorState";

export const ContainerBaseComp = (function () {
  const childrenMap = {
    disabled: BoolCodeControl,
    icon: withDefault(ShapeControl, ""),
  };
  return new ContainerCompBuilder(childrenMap, (props, dispatch) => {

    
    return (
      <DisabledContext.Provider value={props.disabled}>
        <ShapeTriContainer {...props} />
      </DisabledContext.Provider>
    );
  })
    .setPropertyViewFn((children) => {
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.icon.propertyView({
              label: trans("iconComp.icon"),
              IconType: "All",
            })}
          </Section>
          {(useContext(EditorContext).editorModeStatus === "logic" ||
            useContext(EditorContext).editorModeStatus === "both") && (
            <Section name={sectionNames.interaction}>
              {disabledPropertyView(children)}
              {hiddenPropertyView(children)}
              {showDataLoadingIndicatorsPropertyView(children)}
            </Section>
          )}

          {(useContext(EditorContext).editorModeStatus === "layout" ||
            useContext(EditorContext).editorModeStatus === "both") && (
            <>
              <Section name={sectionNames.layout}>
                {children.container.getPropertyView()}
              </Section>
              <Section name={sectionNames.style}>
                {children.container.stylePropertyView()}
              </Section>
              {children.container.children.showBody.getView() && (
                <Section name={"Body Style"}>
                  {children.container.bodyStylePropertyView()}
                </Section>
              )}
            </>
          )}
        </>
      );
    })
    .build();
})();

// Compatible with old data
function convertOldContainerParams(params: CompParams<any>) {
  // convert older params to old params
  let tempParams = oldContainerParamsToNew(params);

  if (tempParams.value) {
    const container = tempParams.value.container;
    // old params
    if (
      container &&
      (container.hasOwnProperty("layout") || container.hasOwnProperty("items"))
    ) {
      const autoHeight = tempParams.value.autoHeight;
      const scrollbars = tempParams.value.scrollbars;
      return {
        ...tempParams,
        value: {
          container: {
            showHeader: true,
            body: { 0: { view: container } },
            showBody: true,
            showFooter: false,
            autoHeight: autoHeight,
            scrollbars: scrollbars,
          },
        },
      };
    }
  }
  return tempParams;
}

class ContainerTmpComp extends ContainerBaseComp {
  constructor(params: CompParams<any>) {
    super(convertOldContainerParams(params));
  }
}

export const ShapeComp = withExposingConfigs(ContainerTmpComp, [NameConfigHidden]);

type ContainerDataType = ToDataType<ContainerChildren<{}>>;

export function defaultContainerData(
  compName: string,
  nameGenerator: NameGenerator
): ContainerDataType {
  return {
    container: {
      header: toSimpleContainerData([
        {
          item: {
            compType: "text",
            name: nameGenerator.genItemName("containerTitle"),
            comp: {
              text: "### " + trans("container.title"),
            },
          },
          layoutItem: {
            i: "",
            h: 5,
            w: 24,
            x: 0,
            y: 0,
          },
        },
      ]),
    },
  };
}
