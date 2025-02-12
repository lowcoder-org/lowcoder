import { LineSeriesOption } from "echarts";
import {
  MultiCompBuilder,
  BoolControl,
  dropdownControl,
  showLabelPropertyView,
  withContext,
  StringControl,
  ColorOrBoolCodeControl,
} from "lowcoder-sdk";
import { trans } from "i18n/comps";

export const ItemColorComp = withContext(
  new MultiCompBuilder({ value: ColorOrBoolCodeControl }, (props) => props.value)
    .setPropertyViewFn((children) =>
      children.value.propertyView({
        label: trans("chart.pointColorLabel"),
        placeholder: "{{value < 25000}}",
        tooltip: trans("chart.pointColorTooltip"),
      })
    )
    .build(),
  ["seriesName", "value"] as const
);

export const LineChartConfig = (function () {
  return new MultiCompBuilder(
    {
      showLabel: BoolControl,
      stacked: BoolControl,
      area: BoolControl,
      smooth: BoolControl,
      itemColor: ItemColorComp,
    },
    (props): LineSeriesOption => {
      const config: LineSeriesOption = {
        type: "line",
        label: {
          show: props.showLabel,
        },
        itemStyle: {
          color: (params) => {
            if (!params.encode || !params.dimensionNames) {
              return params.color;
            }
            const dataKey = params.dimensionNames[params.encode["y"][0]];
            const color = (props.itemColor as any)({
              seriesName: params.seriesName,
              value: (params.data as any)[dataKey],
            });
            if (color === "true") {
              return "red";
            } else if (color === "false" || !color) {
              return params.color;
            }
            return color;
          },
        },
      };
      if (props.stacked) {
        config.stack = "stackValue";
      }
      if (props.area) {
        config.areaStyle = {};
      }
      if (props.smooth) {
        config.smooth = true;
      }
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {children.stacked.propertyView({
          label: trans("lineChart.stacked"),
        })}
        {children.area.propertyView({
          label: trans("lineChart.area"),
        })}
        {showLabelPropertyView(children)}
        {children.smooth.propertyView({ label: trans("chart.smooth") })}
        {children.itemColor.getPropertyView()}
      </>
    ))
    .build();
})();
