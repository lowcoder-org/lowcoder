import {
  BoolControl,
  MultiCompBuilder,
  showLabelPropertyView,
} from "lowcoder-sdk";
import { CandlestickSeriesOption } from "echarts";
import { trans } from "i18n/comps";

export const CandleStickChartConfig = (function () {
  return new MultiCompBuilder(
    {
      showLabel: BoolControl,
    },
    (props): CandlestickSeriesOption => {
      const config: CandlestickSeriesOption = {
        type: "candlestick",
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
          label: trans("candleStickChart.candleStickType"),
          radioButton: true,
        })}
      </>
    ))
    .build();
})();
