import { default as Rate } from "antd/es/rate";
import styled, { css } from "styled-components";
import { NumberControl, BoolCodeControl } from "../controls/codeControl";
import { BoolControl } from "../controls/boolControl";
import { changeEvent, eventHandlerControl } from "../controls/eventHandlerControl";
import { LabelControl } from "../controls/labelControl";
import { numberExposingStateControl } from "../controls/codeStateControl";
import { UICompBuilder, withDefault } from "../generators";
import { CommonNameConfig, NameConfig, withExposingConfigs } from "../generators/withExposing";
import { formDataChildren } from "./formComp/formDataConstants";
import { styleControl } from "comps/controls/styleControl";
import {  AnimationStyle, InputFieldStyle, LabelStyle, RatingStyle, RatingStyleType } from "comps/controls/styleControlConstants";
import { migrateOldData } from "comps/generators/simpleGenerators";
import { trans } from "i18n";
import React, { useEffect, useRef } from "react";
import {viewMode} from "@lowcoder-ee/util/editor";
const PropertyView =  React.lazy( async () => await import("@lowcoder-ee/comps/comps/propertyView/ratingComp"));

const EventOptions = [changeEvent] as const;

/**
 * Compatible with old data 2022-08-23
 */
function fixOldData(oldData: any) {
  if (oldData && oldData.hasOwnProperty("unChecked")) {
    return {
      label: oldData.label,
      checked: oldData.checked,
      unchecked: oldData.unChecked,
    };
  }
  return oldData;
}

const RatingBasicComp = (function () {
  const childrenMap = {
    defaultValue: numberExposingStateControl("defaultValue"),
    value: numberExposingStateControl("value"),
    max: withDefault(NumberControl, "5"),
    label: LabelControl,
    allowHalf: BoolControl,
    disabled: BoolCodeControl,
    onEvent: eventHandlerControl(EventOptions),
    style: styleControl(InputFieldStyle, 'style') , 
    animationStyle: styleControl(AnimationStyle, 'animationStyle'),
    labelStyle: styleControl(
      LabelStyle.filter(
        (style) => ['accent', 'validate'].includes(style.name) === false
      ),
      'labelStyle',
    ),
    inputFieldStyle: migrateOldData(styleControl(RatingStyle, 'inputFieldStyle'), fixOldData),
    ...formDataChildren,
  };
  let builder = new UICompBuilder(childrenMap, (props) => {
    const defaultValue = { ...props.defaultValue }.value;
    const value = { ...props.value }.value;
    const changeRef = useRef(false);

    useEffect(() => {
      props.value.onChange(defaultValue);
    }, [defaultValue]);

    useEffect(() => {
      if (!changeRef.current) return;

      props.onEvent("change");
      changeRef.current = false;
    }, [value]);

    return props.label({
      style: props.style,
      labelStyle: props.labelStyle,
      inputFieldStyle:props.inputFieldStyle,
      animationStyle:props.animationStyle,
      children: (
        <RateStyled
          count={props.max}
          value={props.value.value}
          onChange={(e) => {
            props.value.onChange(e);
            changeRef.current = true;
          }}
          allowHalf={props.allowHalf}
          disabled={props.disabled}
          $style={props.inputFieldStyle}
        />
      ),
    });
  })
  if (viewMode() === "edit") {
    builder.setPropertyViewFn((children) => <PropertyView {...children}></PropertyView>);
  }
    return builder
    .build();
})();

export const RatingComp = withExposingConfigs(RatingBasicComp, [
  new NameConfig("value", trans("export.ratingValueDesc")),
  new NameConfig("max", trans("export.ratingMaxDesc")),
  ...CommonNameConfig,
]);

const getStyle = (style: RatingStyleType) => {
  return css`
    .ant-rate {
      color: ${style.checked};
    }

    .ant-rate-star-half .ant-rate-star-first,
    .ant-rate-star-full .ant-rate-star-second {
      color: ${style.checked};
    }

    .ant-rate-star-first,
    .ant-rate-star-second {
      color: ${style.unchecked};
    }
  `;
};

export const RateStyled = styled(Rate) <{ $style: RatingStyleType }>`
  ${(props) => props.$style && getStyle(props.$style)}
`;
