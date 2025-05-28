import { trans } from "i18n";
import { Section, sectionNames } from "lowcoder-design";
import { numberExposingStateControl } from "../../controls/codeStateControl";
import { UICompBuilder } from "../../generators";
import { CommonNameConfig, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import { SliderChildren, SliderPropertyView, SliderStyled, SliderWrapper } from "./sliderCompConstants";
import { hasIcon } from "comps/utils";
import { BoolControl } from "comps/controls/boolControl";
import { NumberControl } from "comps/controls/codeControl";
import { useCallback, useRef, useEffect } from "react";

const RangeSliderBasicComp = (function () {
  const childrenMap = {
    ...SliderChildren,
    start: numberExposingStateControl("start", 10),
    end: numberExposingStateControl("end", 60),
    vertical: BoolControl,
    tabIndex: NumberControl,
  };

  return new UICompBuilder(childrenMap, (props, dispatch) => {
    const mountedRef = useRef(true);
    const startValueRef = useRef(props.start.value);
    const endValueRef = useRef(props.end.value);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        mountedRef.current = false;
        startValueRef.current = 0;
        endValueRef.current = 0;
      };
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      return false;
    }, []);

    const handleChange = useCallback((value: number | number[]) => {
      if (!mountedRef.current) return;
      if (Array.isArray(value)) {
        const [start, end] = value;
        startValueRef.current = start;
        endValueRef.current = end;
        props.start.onChange(start);
        props.end.onChange(end);
        props.onEvent("change");
      }
    }, [props.start, props.end, props.onEvent]);

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
            range={true}
            value={[props.start.value, props.end.value]}
            $style={props.inputFieldStyle}
            style={{ margin: 0 }}
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
            {children.start.propertyView({ label: trans("rangeSlider.start") })}
            {children.end.propertyView({ label: trans("rangeSlider.end") })}
            {children.max.propertyView({ label: trans("prop.maximum") })}
            {children.min.propertyView({ label: trans("prop.minimum") })}
            {children.step.propertyView({
              label: trans("rangeSlider.step"),
              tooltip: trans("rangeSlider.stepTooltip"),
            })}
            {children.vertical.propertyView({ label: trans("slider.vertical") })}
          </Section>

          <SliderPropertyView {...children} />
        </>
      );
    })
    .build();
})();

export const RangeSliderComp = withExposingConfigs(RangeSliderBasicComp, [
  new NameConfig("start", trans("export.sliderStartDesc")),
  new NameConfig("end", trans("export.sliderEndDesc")),
  new NameConfig("max", trans("export.sliderMaxValueDesc")),
  new NameConfig("min", trans("export.sliderMinValueDesc")),
  ...CommonNameConfig,
]);
