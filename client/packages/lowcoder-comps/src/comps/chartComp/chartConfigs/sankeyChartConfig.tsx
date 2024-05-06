import {
  BoolControl,
  MultiCompBuilder,
  showLabelPropertyView,
} from "lowcoder-sdk";
import { SankeySeriesOption } from "echarts";
import { trans } from "i18n/comps";

export const SankeyChartConfig = (function () {
  return new MultiCompBuilder(
    {
      showLabel: BoolControl,
    },
    (props): SankeySeriesOption => {
      const config: SankeySeriesOption = {
        type: "sankey",
        label: {
          show: props.showLabel,
          position: "top",
        },
      };
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {showLabelPropertyView(children)}
        {children.type.propertyView({
          label: trans("sankeyChart.sankeyType"),
          radioButton: true,
        })}
      </>
    ))
    .build();
})();
