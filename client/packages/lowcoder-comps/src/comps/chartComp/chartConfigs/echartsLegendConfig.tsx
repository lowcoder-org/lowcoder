import {
  AlignBottom,
  AlignTop,
  dropdownControl,
  MultiCompBuilder,
} from "lowcoder-sdk";
import { LegendComponentOption } from "echarts";
import { trans } from "i18n/comps";

const LegendPositionOptions = [
  {
    label: <AlignBottom />,
    value: "bottom",
  },
  {
    label: <AlignTop />,
    value: "top",
  },
] as const;

export const EchartsLegendConfig = (function () {
  return new MultiCompBuilder(
    {
      position: dropdownControl(LegendPositionOptions, "bottom"),
    },
    (props): LegendComponentOption => {
      const config: LegendComponentOption = {
        top: "bottom",
        type: "scroll",
      };
      config.top = props.position
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {children.position.propertyView({
          label: trans("echarts.legendPosition"),
          radioButton: true,
        })}
      </>
    ))
    .build();
})();
