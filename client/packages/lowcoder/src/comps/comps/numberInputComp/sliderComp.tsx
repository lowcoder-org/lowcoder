import { trans } from "i18n";
import { numberExposingStateControl } from "../../controls/codeStateControl";
import { UICompBuilder } from "../../generators";
import { CommonNameConfig, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import { formDataChildren } from "../formComp/formDataConstants";
import { SliderChildren, SliderStyled, SliderWrapper } from "./sliderCompConstants";
import { hasIcon } from "comps/utils";
import { BoolControl } from "comps/controls/boolControl";
import React from "react";
import {viewMode} from "@lowcoder-ee/util/editor";
const SetPropertyViewSliderComp =  React.lazy( async () => await import("./setProperty").then(module => ({default: module.SetPropertyViewSliderComp})))
const SliderBasicComp = (function () {
  /**
   * FIXME: the range of setValue cannot exceed max
   */
  const childrenMap = {
    ...SliderChildren,
    value: numberExposingStateControl("value", 60),
    vertical: BoolControl,
    ...formDataChildren,
  };
  let builder = new UICompBuilder(childrenMap, (props) => {
    return props.label({
      style: props.style,
      labelStyle: props.labelStyle,
      inputFieldStyle:props.inputFieldStyle,
      animationStyle:props.animationStyle,
      children: (
        <SliderWrapper
          $vertical={Boolean(props.vertical)}
          onMouseDown={(e: any) => {
            e.stopPropagation();
            return false;
          }}
        >
          {hasIcon(props.prefixIcon) && props.prefixIcon}
          <SliderStyled
            {...props}
            value={props.value.value}
            $style={props.inputFieldStyle}
            style={{margin: 0}}
            $vertical={Boolean(props.vertical) || false}
            onChange={(e) => {
              props.value.onChange(e);
              props.onEvent("change");
            }}
          />
          {hasIcon(props.suffixIcon) && props.suffixIcon}
        </SliderWrapper>
      ),
    });
  })
    if (viewMode() === "edit") {
        builder.setPropertyViewFn((children) => <SetPropertyViewSliderComp {...children}></SetPropertyViewSliderComp>);
    }
      return builder
    .build();
})();

export const SliderComp = withExposingConfigs(SliderBasicComp, [
  new NameConfig("value", trans("export.sliderValueDesc")),
  new NameConfig("max", trans("export.sliderMaxValueDesc")),
  new NameConfig("min", trans("export.sliderMinValueDesc")),
  ...CommonNameConfig,
]);
