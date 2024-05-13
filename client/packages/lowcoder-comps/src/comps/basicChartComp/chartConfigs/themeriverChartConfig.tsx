import {
  BoolControl,
  MultiCompBuilder,
  showLabelPropertyView,
} from "lowcoder-sdk";
import { ThemeRiverSeriesOption } from "echarts";
import { trans } from "i18n/comps";

export const ThemeriverChartConfig = (function () {
  return new MultiCompBuilder(
    {
      showLabel: BoolControl,
    },
    (props): ThemeRiverSeriesOption => {
      const config: ThemeRiverSeriesOption = {
        type: "themeRiver",
      };
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {showLabelPropertyView(children)}
        {children.type.propertyView({
          label: trans("themeriverChart.themeriverType"),
          radioButton: true,
        })}
      </>
    ))
    .build();
})();
