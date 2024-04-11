import { styleControl } from "comps/controls/styleControl";
import { SelectStyle } from "comps/controls/styleControlConstants";
import { trans } from "i18n";
import { stringExposingStateControl } from "lowcoder-sdk";
import { UICompBuilder } from "lowcoder-sdk";
import { CommonNameConfig, NameConfig, withExposingConfigs , withMethodExposing} from "lowcoder-sdk";
import {
  baseSelectRefMethods,
  TourChildrenMap,
  TourPropertyView,
} from "./tourCompConstants";
import {
  TourInputCommonConfig,
  TourInputInvalidConfig,
} from "./tourInputConstants";
import { Tour, TourProps } from "antd";

let TourBasicComp = (function () {
  const childrenMap = {
    ...TourChildrenMap,
    defaultValue: stringExposingStateControl("defaultValue"),
    value: stringExposingStateControl("value"),
    style: styleControl(SelectStyle),
  };
  return new UICompBuilder(childrenMap, (props, dispatch) => {
  
    const steps: TourProps['steps'] = props.options.map((step) => {
      return {
        title: step.title,
        description: step.description,
        target: null,
      }
    })

    return (<Tour
      steps={steps}
      open={props.open.value} 
      onClose={() => props.open.onChange(false)}
    />)
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
      params: [],
    },
    execute: (comp, values) => {
      comp.children.open.getView().onChange(true)
    }
  }
])

export const TourComp = withExposingConfigs(TourBasicComp, [
  new NameConfig("value", trans("selectInput.valueDesc")),
  new NameConfig("inputValue", trans("select.inputValueDesc")),
  TourInputInvalidConfig,
  ...TourInputCommonConfig,
  ...CommonNameConfig,
]);
