import { CompParams } from "lowcoder-core";
import { ToDataType } from "comps/generators/multi";
import { NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { NameGenerator } from "comps/utils/nameGenerator";
import { oldContainerParamsToNew } from "../containerBase";
import { toSimpleContainerData } from "../containerBase/simpleContainerComp";
import { TriContainer } from "../triContainerComp/triContainer";
import {
  ContainerChildren,
  ContainerCompBuilder,
} from "../triContainerComp/triContainerCompBuilder";
import { trans } from "i18n";
import { BoolCodeControl } from "comps/controls/codeControl";
import { DisabledContext } from "comps/generators/uiCompBuilder";
import React from "react";
import { AnimationStyle } from "@lowcoder-ee/comps/controls/styleControlConstants";
import { styleControl } from "@lowcoder-ee/comps/controls/styleControl";
import {viewMode, viewModeTriple} from "@lowcoder-ee/util/editor";
const PropertyViewContainerComp =  React.lazy( async () => await import("./propertyView").then(module => ({default: module.PropertyViewContainerComp})))

export const ContainerBaseComp = (function () {
  const childrenMap = {
    disabled: BoolCodeControl,
    animationStyle: styleControl(AnimationStyle),
  };
  let builder = new ContainerCompBuilder(childrenMap, (props, dispatch) => {
    return (
      <DisabledContext.Provider value={props.disabled}>
          <TriContainer {...props} />        
      </DisabledContext.Provider>
    );
  })

  if ((viewModeTriple() !== "admin")) {
    builder.setPropertyViewFn((children) => <PropertyViewContainerComp {...children}></PropertyViewContainerComp>);
  }
      return builder
    .build();
})(); 

// Compatible with old data
function convertOldContainerParams(params: CompParams<any>) {
  // convert older params to old params
  let tempParams = oldContainerParamsToNew(params);

  if (tempParams.value) {
    const container = tempParams.value.container;
    // old params
    if (container && (container.hasOwnProperty("layout") || container.hasOwnProperty("items"))) {
      const autoHeight = tempParams.value.autoHeight;
      const scrollbars = tempParams.value.showVerticalScrollbar;
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

export const ContainerComp = withExposingConfigs(ContainerTmpComp, [NameConfigHidden]);

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
