import {
  BoolControl,
  MultiCompBuilder,
  showLabelPropertyView,
} from "lowcoder-sdk";
import { TreeSeriesOption } from "echarts";
import { trans } from "i18n/comps";

export const TreeChartConfig = (function () {
  return new MultiCompBuilder(
    {
      showLabel: BoolControl,
    },
    (props): TreeSeriesOption => {
      const config: TreeSeriesOption = {
        type: "tree",
      };
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {showLabelPropertyView(children)}
        {children.type.propertyView({
          label: trans("treeChart.treeType"),
          radioButton: true,
        })}
      </>
    ))
    .build();
})();
