import {
  BoolControl,
  MultiCompBuilder,
  showLabelPropertyView,
} from "lowcoder-sdk";
import { TreemapSeriesOption } from "echarts";
import { trans } from "i18n/comps";

export const TreemapChartConfig = (function () {
  return new MultiCompBuilder(
    {
      showLabel: BoolControl,
    },
    (props): TreemapSeriesOption => {
      const config: TreemapSeriesOption = {
        type: "treemap",
      };
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {showLabelPropertyView(children)}
        {children.type.propertyView({
          label: trans("treemapChart.treemapType"),
          radioButton: true,
        })}
      </>
    ))
    .build();
})();
