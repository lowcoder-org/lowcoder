import { trans } from "i18n";
import {
  CommonNameConfig,
  MultiBaseComp,
  NameConfig,
  stringExposingStateControl,
  UICompBuilder,
  withExposingConfigs,
  withMethodExposing
} from "lowcoder-sdk";
import { baseSelectRefMethods, TourChildrenMap, TourPropertyView } from "./tourCompConstants";
import { TourInputCommonConfig } from "./tourInputConstants";
import { Tour, TourProps } from "antd";
import { PlacementType } from "@lowcoder-ee/comps/controls/tourStepControl";
import React, { Suspense, useContext } from "react";
import { EditorContext } from "@lowcoder-ee/comps/editorState";
import { GridItemComp } from "@lowcoder-ee/comps/comps/gridItemComp";
import { HookComp } from "@lowcoder-ee/comps/hooks/hookComp";
import { TemporaryStateItemComp } from "@lowcoder-ee/comps/comps/temporaryStateComp";

/**
 * This component builds the Property Panel and the fake 'UI' for the Tour component
 */
let TourBasicComp = (function() {
  const childrenMap = {
    ...TourChildrenMap,
    defaultValue: stringExposingStateControl("defaultValue"),
    value: stringExposingStateControl("value")
    // style: styleControl(SelectStyle),
  };
  return new UICompBuilder(childrenMap, (props, dispatch) => {
    const editorState = useContext(EditorContext);
    const compMap: (GridItemComp | HookComp | InstanceType<typeof TemporaryStateItemComp>)[] = Object.values(editorState.getAllUICompMap());

    const steps: TourProps["steps"] = props.options.map((step) => {
      const targetName = step.target;
      let target = undefined;
      const compListItem = compMap.find((compItem) => compItem.children.name.getView() === targetName);
      if (compListItem) {
        console.log(`setting selected comp to ${compListItem}`);
        try {
          target = ((compListItem as MultiBaseComp).children.comp as GridItemComp).getRef?.();
        } catch (e) {
          target = ((compListItem as MultiBaseComp).children.comp as HookComp).getRef?.();
        }
      }

      return {
        title: step.title,
        description: step.description,
        target: target?.current,
        arrow: step.arrow || true,
        placement: step.placement as PlacementType
      };
    });

    return (
      <Suspense fallback={<div>loading</div>}>
        <Tour
          steps={steps}
          open={props.open.value}
          onClose={() => props.open.onChange(false)}
        />
      </Suspense>
    );
  })
    .setPropertyViewFn((children) => <TourPropertyView {...children} />)
    .setExposeMethodConfigs(baseSelectRefMethods)
    .build();
})();

TourBasicComp = withMethodExposing(TourBasicComp, [
  {
    method: {
      name: "startTour",
      description: "Triggers the tour to start",
      params: []
    },
    execute: (comp, values) => {
      comp.children.open.getView().onChange(true);
    }
  }
]);

export const TourComp = withExposingConfigs(TourBasicComp, [
  new NameConfig("value", trans("selectInput.valueDesc")),
  new NameConfig("inputValue", trans("select.inputValueDesc")),
  ...TourInputCommonConfig,
  ...CommonNameConfig
]);
