import {
  BoolControl,
  dropdownControl,
  MultiCompBuilder,
  showLabelPropertyView,
} from "lowcoder-sdk";
import { BarSeriesOption } from "echarts";
import { i18nObjs, trans } from "i18n/comps";

const BarTypeOptions = [
  {
    label: trans("chart.basicBar"),
    value: "basicBar",
  },
  {
    label: trans("chart.stackedBar"),
    value: "stackedBar",
  },
] as const;

export const BarChartConfig = (function () {
  return new MultiCompBuilder(
    {
      showLabel: BoolControl,
      type: dropdownControl(BarTypeOptions, "basicBar"),
    },
    (props): BarSeriesOption => {
      const config: BarSeriesOption = {
        type: "bar",
        label: {
          show: props.showLabel,
          position: "top",
        },
      };
      if (props.type === "stackedBar") {
        config.stack = "stackValue";
      }
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {showLabelPropertyView(children)}
        {children.type.propertyView({
          label: trans("chart.barType"),
          radioButton: true,
        })}
      </>
    ))
    .build();
})();
