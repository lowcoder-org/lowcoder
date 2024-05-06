import {
  BoolControl,
  MultiCompBuilder,
  showLabelPropertyView,
} from "lowcoder-sdk";
import { GaugeSeriesOption } from "echarts";
import { trans } from "i18n/comps";

export const GaugeChartConfig = (function () {
  return new MultiCompBuilder(
    {
      showLabel: BoolControl,
    },
    (props): GaugeSeriesOption => {
      const config: GaugeSeriesOption = {
        type: "gauge",
      };
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {showLabelPropertyView(children)}
        {children.type.propertyView({
          label: trans("gaugeChart.gaugeType"),
          radioButton: true,
        })}
      </>
    ))
    .build();
})();
