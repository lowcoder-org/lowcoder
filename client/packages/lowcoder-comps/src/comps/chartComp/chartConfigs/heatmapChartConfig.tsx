import {
  BoolControl,
  MultiCompBuilder,
  showLabelPropertyView,
} from "lowcoder-sdk";
import { HeatmapSeriesOption } from "echarts";
import { trans } from "i18n/comps";

export const HeatmapChartConfig = (function () {
  return new MultiCompBuilder(
    {
      showLabel: BoolControl,
    },
    (props): HeatmapSeriesOption => {
      const config: HeatmapSeriesOption = {
        type: "heatmap",
      };
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {showLabelPropertyView(children)}
        {children.type.propertyView({
          label: trans("heatmapChart.heatmapType"),
          radioButton: true,
        })}
      </>
    ))
    .build();
})();
