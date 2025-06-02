import { trans } from "i18n";
import { Section, sectionNames } from "lowcoder-design";
import { numberExposingStateControl } from "../../controls/codeStateControl";
import { UICompBuilder } from "../../generators";
import { CommonNameConfig, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import { formDataChildren, FormDataPropertyView } from "../formComp/formDataConstants";
import { SliderChildren, SliderPropertyView, SliderStyled, SliderWrapper } from "./sliderCompConstants";
import { hasIcon } from "comps/utils";
import { BoolControl } from "comps/controls/boolControl";
import { NumberControl } from "comps/controls/codeControl";
import { useCallback } from "react";

const SliderBasicComp = (function () {
  /**
   * FIXME: the range of setValue cannot exceed max
   */
  const childrenMap = {
    ...SliderChildren,
    value: numberExposingStateControl("value", 60),
    vertical: BoolControl,
    tabIndex: NumberControl,
    ...formDataChildren,
  };
  return new UICompBuilder(childrenMap, (props) => {
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
    }, []);

    const handleChange = useCallback((value: number) => {
      props.value.onChange(value);
      props.onEvent("change");
    }, [props.value, props.onEvent]);

    return props.label({
      style: props.style,
      labelStyle: props.labelStyle,
      inputFieldStyle: props.inputFieldStyle,
      animationStyle: props.animationStyle,
      children: (
        <SliderWrapper
          $vertical={Boolean(props.vertical)}
          onMouseDown={handleMouseDown}
        >
          {hasIcon(props.prefixIcon) && props.prefixIcon}
          <SliderStyled
            {...props}
            value={props.value.value}
            $style={props.inputFieldStyle}
            style={{margin: 0}}
            $vertical={Boolean(props.vertical) || false}
            tabIndex={typeof props.tabIndex === 'number' ? props.tabIndex : undefined}
            onChange={handleChange}
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
