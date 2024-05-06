import {
  BoolControl,
  MultiCompBuilder,
  showLabelPropertyView,
} from "lowcoder-sdk";
import { GraphSeriesOption } from "echarts";
import { trans } from "i18n/comps";

export const GraphChartConfig = (function () {
  return new MultiCompBuilder(
    {
      showLabel: BoolControl,
    },
    (props): GraphSeriesOption => {
      const config: GraphSeriesOption = {
        type: "graph",
      };
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {showLabelPropertyView(children)}
        {children.type.propertyView({
          label: trans("graphChart.graphType"),
          radioButton: true,
        })}
      </>
    ))
    .build();
})();
