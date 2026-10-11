import { LineSeriesOption } from "echarts";
import {
  MultiCompBuilder,
  BoolControl,
  dropdownControl,
  jsonControl,
  toArray,
  showLabelPropertyView,
  withContext,
  ColorControl,
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

export const BorderTypeOptions = [
  {
    label: trans("lineChart.solid"),
    value: "solid",
  },
  {
    label: trans("lineChart.dashed"),
    value: "dashed",
  },
  {
    label: trans("lineChart.dotted"),
    value: "dotted",
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
      polar: BoolControl,
      itemColor: ItemColorComp,
      symbol: dropdownControl(SymbolOptions, "emptyCircle"),
      symbolSize: withDefault(NumberControl, 4),
      radiusAxisMax: NumberControl,
      polarRadiusStart: withDefault(StringControl, '30'),
      polarRadiusEnd: withDefault(StringControl, '80%'),
      polarStartAngle: withDefault(NumberControl, 90),
      polarEndAngle: withDefault(NumberControl, -180),
      polarIsTangent: withDefault(BoolControl, false),
      labelData: jsonControl(toArray, []),
      //series-line.itemStyle
      borderColor: ColorControl,
      borderWidth: NumberControl,
      borderType: dropdownControl(BorderTypeOptions, 'solid'),
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
            const color = (props.itemColor as any)({
              seriesName: params.seriesName,
              value: params.data,
            });
            if (color === "true") {
              return "red";
            } else if (color === "false" || !color) {
              return params.color;
            }
            return color;
          },
          borderColor: props.borderColor,
          borderWidth: props.borderWidth,
          borderType: props.borderType,
        },
        polarData: {
          polar: props.polar,
          radiusAxisMax: props.radiusAxisMax,
          polarRadiusStart: props.polarRadiusStart,
          polarRadiusEnd: props.polarRadiusEnd,
          polarStartAngle: props.polarStartAngle,
          polarEndAngle: props.polarEndAngle,
          labelData: props.labelData,
          polarIsTangent: props.polarIsTangent,
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
      if (props.polar) {
        config.coordinateSystem = 'polar';
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
        {children.polar.propertyView({
          label: trans("lineChart.polar"),
        })}
        {children.polar.getView() && children.polarIsTangent.propertyView({
          label: trans("barChart.polarIsTangent"),
        })}
        {children.polar.getView() && children.polarStartAngle.propertyView({
          label: trans("barChart.polarStartAngle"),
        })}
        {children.polar.getView() && children.polarEndAngle.propertyView({
          label: trans("barChart.polarEndAngle"),
        })}
        {children.polar.getView() && children.radiusAxisMax.propertyView({
          label: trans("barChart.radiusAxisMax"),
        })}
        {children.polar.getView() && children.polarRadiusStart.propertyView({
          label: trans("barChart.polarRadiusStart"),
        })}
        {children.polar.getView() && children.polarRadiusEnd.propertyView({
          label: trans("barChart.polarRadiusEnd"),
        })}
        {children.polar.getView() && children.labelData.propertyView({
          label: trans("barChart.polarLabelData"),
        })}
        {showLabelPropertyView(children)}
        {children.showEndLabel.propertyView({
          label: trans("lineChart.showEndLabel"),
        })}
        {children.smooth.propertyView({ label: trans("chart.smooth") })}
        {children.symbol.propertyView({
          label: trans("lineChart.symbol"),
        })}
        {children.symbolSize.propertyView({
          label: trans("lineChart.symbolSize"),
        })}
        {children.itemColor.getPropertyView()}
        {children.borderColor.propertyView({
          label: trans("lineChart.borderColor"),
        })}
        {children.borderWidth.propertyView({
          label: trans("lineChart.borderWidth"),
        })}
        {children.borderType.propertyView({
          label: trans("lineChart.borderType"),
        })}
      </>
    ))
    .build();
})();
