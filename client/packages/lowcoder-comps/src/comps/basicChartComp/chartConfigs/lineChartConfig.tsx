import { LineSeriesOption } from "echarts";
import {
  MultiCompBuilder,
  BoolControl,
  dropdownControl,
  list,
  Option,
  valueComp,
  genRandomKey,
  showLabelPropertyView,
  withContext,
  RedButton,
  StringControl,
  NumberControl,
  withDefault,
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

export const SymbolOptions = [
  {
    label: trans("chart.rect"),
    value: "rect",
  },
  {
    label: trans("chart.circle"),
    value: "circle",
  },
  {
    label: trans("chart.roundRect"),
    value: "roundRect",
  },
  {
    label: trans("chart.triangle"),
    value: "triangle",
  },
  {
    label: trans("chart.diamond"),
    value: "diamond",
  },
  {
    label: trans("chart.pin"),
    value: "pin",
  },
  {
    label: trans("chart.arrow"),
    value: "arrow",
  },
  {
    label: trans("chart.none"),
    value: "none",
  },
  {
    label: trans("chart.emptyCircle"),
    value: "emptyCircle",
  },
] as const;

export const LineChartConfig = (function () {
  return new MultiCompBuilder(
    {
      showLabel: BoolControl,
      showEndLabel: BoolControl,
      stacked: BoolControl,
      area: BoolControl,
      smooth: BoolControl,
      itemColor: ItemColorComp,
      symbol: dropdownControl(SymbolOptions, "emptyCircle"),
      symbolSize: withDefault(NumberControl, 4),
    },
    (props): LineSeriesOption => {
      const config: LineSeriesOption = {
        type: "line",
        label: {
          show: props.showLabel,
        },
        symbol: props.symbol,
        symbolSize: props.symbolSize,
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
      if (props.showEndLabel) {
        config.endLabel = {
          show: true,
          formatter: '{a}',
          distance: 20
        }
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
        {children.showEndLabel.propertyView({
          label: trans("lineChart.showEndLabel"),
        })}
        {children.symbol.propertyView({
          label: trans("lineChart.symbol"),
        })}
        {children.symbolSize.propertyView({
          label: trans("lineChart.symbolSize"),
        })}
        {children.smooth.propertyView({ label: trans("chart.smooth") })}
        {children.itemColor.getPropertyView()}
      </>
    ))
    .build();
})();
