import { trans } from "i18n";
import { Section, sectionNames } from "lowcoder-design";
import { numberExposingStateControl } from "../../controls/codeStateControl";
import { UICompBuilder } from "../../generators";
import { CommonNameConfig, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import { formDataChildren, FormDataPropertyView } from "../formComp/formDataConstants";
import { SliderChildren, SliderPropertyView, SliderStyled, SliderWrapper } from "./sliderCompConstants";
import { hasIcon } from "comps/utils";
import { BoolControl } from "comps/controls/boolControl";

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
  return new UICompBuilder(childrenMap, (props) => {
    return props.label({
      style: props.style,
      labelStyle: props.labelStyle,
      inputFieldStyle:props.inputFieldStyle,
      animationStyle:props.animationStyle,
      children: (
        <SliderWrapper
          vertical={props.vertical}
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
            vertical={props.vertical || false}
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
    .setPropertyViewFn((children) => {
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.value.propertyView({ label: trans("prop.defaultValue") })}
            {children.max.propertyView({ label: trans("prop.maximum") })}
            {children.min.propertyView({ label: trans("prop.minimum") })}
            {children.step.propertyView({
              label: trans("slider.step"),
              tooltip: trans("slider.stepTooltip"),
            })}
            {children.vertical.propertyView({ label: trans("slider.vertical") })}
          </Section>
          <FormDataPropertyView {...children} />
          <SliderPropertyView {...children} />
        </>
      );
    })
    .build();
})();

export const SliderComp = withExposingConfigs(SliderBasicComp, [
  new NameConfig("value", trans("export.sliderValueDesc")),
  new NameConfig("max", trans("export.sliderMaxValueDesc")),
  new NameConfig("min", trans("export.sliderMinValueDesc")),
  ...CommonNameConfig,
]);
