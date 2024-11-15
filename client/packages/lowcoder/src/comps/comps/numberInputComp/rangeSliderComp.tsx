import { trans } from "i18n";
import { numberExposingStateControl } from "../../controls/codeStateControl";
import { UICompBuilder } from "../../generators";
import { CommonNameConfig, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import { SliderChildren, SliderStyled, SliderWrapper } from "./sliderCompConstants";
import { hasIcon } from "comps/utils";
import { BoolControl } from "comps/controls/boolControl";
import React from "react";
import {viewMode} from "@lowcoder-ee/util/editor";
const PropertyViewRangeSliderComp =  React.lazy( async () => await import("./propertyView").then(module => ({default: module.PropertyViewRangeSliderComp})))

const RangeSliderBasicComp = (function () {
  const childrenMap = {
    ...SliderChildren,
    start: numberExposingStateControl("start", 10),
    end: numberExposingStateControl("end", 60),
    vertical: BoolControl,
  };
  let builder = new UICompBuilder(childrenMap, (props, dispatch) => {
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
            range={true}
            value={[props.start.value, props.end.value]}
            $style={props.inputFieldStyle}
            style={{ margin: 0 }}
            $vertical={Boolean(props.vertical) || false}
            onChange={([start, end]) => {
              props.start.onChange(start);
              props.end.onChange(end);
              props.onEvent("change");
            }}
          />
          {hasIcon(props.suffixIcon) && props.suffixIcon}
        </SliderWrapper>
      ),
    });
  })
    if (viewMode() === "admin") {
        builder.setPropertyViewFn((children) => <PropertyViewRangeSliderComp {...children}></PropertyViewRangeSliderComp>);
    }
    return builder
        .build();
})();

export const RangeSliderComp = withExposingConfigs(RangeSliderBasicComp, [
  new NameConfig("start", trans("export.sliderStartDesc")),
  new NameConfig("end", trans("export.sliderEndDesc")),
  new NameConfig("max", trans("export.sliderMaxValueDesc")),
  new NameConfig("min", trans("export.sliderMinValueDesc")),
  ...CommonNameConfig,
]);
