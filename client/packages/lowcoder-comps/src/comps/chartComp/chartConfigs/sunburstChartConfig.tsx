import {
  BoolControl,
  MultiCompBuilder,
  showLabelPropertyView,
} from "lowcoder-sdk";
import { SunburstSeriesOption } from "echarts";
import { trans } from "i18n/comps";

export const SunburstChartConfig = (function () {
  return new MultiCompBuilder(
    {
      showLabel: BoolControl,
    },
    (props): SunburstSeriesOption => {
      const config: SunburstSeriesOption = {
        type: "sunburst",
      };
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {showLabelPropertyView(children)}
        {children.type.propertyView({
          label: trans("sunburstChart.sunburstType"),
          radioButton: true,
        })}
      </>
    ))
    .build();
})();
