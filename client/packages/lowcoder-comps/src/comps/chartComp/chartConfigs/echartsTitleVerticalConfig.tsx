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
    label: <AlignTop />,
    value: "top",
  },
  {
    label: <AlignBottom />,
    value: "bottom",
  }
] as const;

export const EchartsTitleVerticalConfig = (function () {
  return new MultiCompBuilder(
    {
      position: dropdownControl(LegendPositionOptions, "top"),
    },
    (props): LegendComponentOption => {
      const config: LegendComponentOption = {
        top: "top",
        type: "scroll",
      };
      config.top = props.position
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {children.position.propertyView({
          label: trans("echarts.titlePositionVertical"),
          radioButton: true,
          tooltip: trans("echarts.changingLegend_x_Tooltip")
        })}
      </>
    ))
    .build();
})();
