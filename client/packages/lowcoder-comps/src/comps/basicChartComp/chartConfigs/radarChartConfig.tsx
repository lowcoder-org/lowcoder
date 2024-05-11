import {
  BoolControl,
  MultiCompBuilder,
  showLabelPropertyView,
} from "lowcoder-sdk";
import { RadarSeriesOption } from "echarts";
import { trans } from "i18n/comps";

export const RadarChartConfig = (function () {
  return new MultiCompBuilder(
    {
      showLabel: BoolControl,
    },
    (props): RadarSeriesOption => {
      const config: RadarSeriesOption = {
        type: "radar",
      };
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {showLabelPropertyView(children)}
        {children.type.propertyView({
          label: trans("radarChart.radarType"),
          radioButton: true,
        })}
      </>
    ))
    .build();
})();
