import {
  BoolControl,
  MultiCompBuilder,
  showLabelPropertyView,
} from "lowcoder-sdk";
import { FunnelSeriesOption } from "echarts";
import { trans } from "i18n/comps";

export const FunnelChartConfig = (function () {
  return new MultiCompBuilder(
    {
      showLabel: BoolControl,
    },
    (props): FunnelSeriesOption => {
      const config: FunnelSeriesOption = {
        type: "funnel",
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
          label: trans("funnelChart.funnelType"),
          radioButton: true,
        })}
      </>
    ))
    .build();
})();
