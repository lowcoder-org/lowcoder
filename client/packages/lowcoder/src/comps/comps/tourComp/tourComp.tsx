
import { trans } from "i18n";
import { withMethodExposing } from "../../generators/withMethodExposing";
import { UICompBuilder } from "../../generators";
import { stringExposingStateControl } from "comps/controls/codeStateControl";
import { CommonNameConfig, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import { MultiBaseComp } from "lowcoder-core";

// FALK TODO: Check imports
// import { MultiBaseComp } from "lowcoder-core";
// import { UICompBuilder } from "comps/generators/uiCompBuilder";
// import { stringExposingStateControl } from "comps/controls/codeStateControl";
// import { withMethodExposing } from "comps/generators/withMethodExposing";

import { TourChildrenMap, TourPropertyView } from "./tourPropertyView";
import { Tour, TourProps } from "antd";
import React, { useContext } from "react";
import { EditorContext } from "comps/editorState";
import { GridItemComp } from "comps/comps/gridItemComp";
import { HookComp } from "comps/hooks/hookComp";
import { TemporaryStateItemComp } from "comps/comps/temporaryStateComp";

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
        // console.log(`setting selected comp to ${compListItem}`);
        try {
          target = ((compListItem as MultiBaseComp).children.comp as GridItemComp).getRef?.();
        } catch (e) {
          target = ((compListItem as MultiBaseComp).children.comp as HookComp).getRef?.();
        }
      }

      return {
        /**
         * I'm pretty sure it's safe to use dangerouslySetInnerHTML here as any creator of an app
         * will have unrestricted access to the data of any user anyway. E.g. have a button that
         * just sends the current cookies wherever, thus the developer of the app must be trusted
         * in all cases
         * This even applies to things like <b onmouseover="alert('mouseover');">, because the
         * app creator might desire functionality like this.
         */
        title: (<div dangerouslySetInnerHTML={{ __html: step.title }} />),
        description: (<div dangerouslySetInnerHTML={{ __html: step.description }} />),
        target: target?.current,
        arrow: step.arrow,
        placement: step.placement === "" ? undefined : step.placement,
        mask: step.mask,
        cover: step.cover ? (<img src={step.cover} />) : undefined,
        type: step.type === "" ? undefined : step.type,
      };
    });

    return (
      <Tour
        steps={steps}
        open={props.open.value}
        onClose={() => props.open.onChange(false)}
        // indicatorsRender={(current, total) => props.indicatorsRender(current, total)} // todo enable later
        disabledInteraction={props.disabledInteraction}
        arrow={props.arrow}
        placement={props.placement === "" ? undefined : props.placement}
        type={props.type === "" ? undefined : props.type}
        mask={props.mask}
      />
    );
  })
    .setPropertyViewFn((children) => <TourPropertyView {...children} />)
    .build();
})();

export const TourComp = withMethodExposing(TourBasicComp, [
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
