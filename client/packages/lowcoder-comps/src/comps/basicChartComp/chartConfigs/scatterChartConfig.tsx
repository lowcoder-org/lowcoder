import {
  MultiCompBuilder,
  dropdownControl,
  BoolControl,
  StringControl,
  NumberControl,
  ColorControl,
  withDefault,
  showLabelPropertyView,
} from "lowcoder-sdk";
import { ScatterSeriesOption } from "echarts";
import { trans } from "i18n/comps";

const ScatterShapeOptions = [
  {
    label: trans("chart.circle"),
    value: "circle",
  },
  {
    label: trans("chart.rect"),
    value: "rect",
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
] as const;

export const ScatterChartConfig = (function () {
  return new MultiCompBuilder(
    {
      showLabel: BoolControl,
      labelIndex: withDefault(NumberControl, 2),
      shape: dropdownControl(ScatterShapeOptions, "circle"),
      singleAxis: BoolControl,
      boundaryGap: withDefault(BoolControl, true),
      visualMap: BoolControl,
      visualMapMin: NumberControl,
      visualMapMax: NumberControl,
      visualMapDimension: NumberControl,
      visualMapColorMin: ColorControl,
      visualMapColorMax: ColorControl,
      polar: BoolControl,
      heatmap: BoolControl,
      heatmapMonth: withDefault(StringControl, "2021-09"),
    },
    (props): ScatterSeriesOption => {
      return {
        type: "scatter",
        symbol: props.shape,
        label: {
          show: props.showLabel,
          position: 'right',
          formatter: function (param) {
            return param.data[props.labelIndex];
          },
        },
        labelLayout: function () {
          return {
            x: '88%',
            moveOverlap: 'shiftY'
          };
        },
        labelLine: {
          show: true,
          length2: 5,
          lineStyle: {
            color: '#bbb'
          }
        },
        singleAxis: props.singleAxis,
        boundaryGap: props.boundaryGap,
        visualMapData: {
          visualMap: props.visualMap,
          visualMapMin: props.visualMapMin,
          visualMapMax: props.visualMapMax,
          visualMapDimension: props.visualMapDimension,
          visualMapColorMin: props.visualMapColorMin,
          visualMapColorMax: props.visualMapColorMax,
        },
        polar: props.polar,
        heatmap: props.heatmap,
        heatmapMonth: props.heatmapMonth,
      };
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {showLabelPropertyView(children)}
        {children.showLabel.getView() && children.labelIndex.propertyView({
          label: trans("scatterChart.labelIndex"),
        })}
        {children.boundaryGap.propertyView({
          label: trans("scatterChart.boundaryGap"),
        })}
        {children.shape.propertyView({
          label: trans("chart.scatterShape"),
        })}
        {children.singleAxis.propertyView({
          label: trans("scatterChart.singleAxis"),
        })}
        {children.visualMap.propertyView({
          label: trans("scatterChart.visualMap"),
        })}
        {children.visualMap.getView() && children.visualMapMin.propertyView({
          label: trans("scatterChart.visualMapMin"),
        })}
        {children.visualMap.getView() && children.visualMapMax.propertyView({
          label: trans("scatterChart.visualMapMax"),
        })}
        {children.visualMap.getView() && children.visualMapDimension.propertyView({
          label: trans("scatterChart.visualMapDimension"),
        })}
        {children.visualMap.getView() && children.visualMapColorMin.propertyView({
          label: trans("scatterChart.visualMapColorMin"),
        })}
        {children.visualMap.getView() && children.visualMapColorMax.propertyView({
          label: trans("scatterChart.visualMapColorMax"),
        })}
        {children.visualMap.getView() && children.heatmap.propertyView({
          label: trans("scatterChart.heatmap"),
        })}
        {children.visualMap.getView() && children.heatmapMonth.propertyView({
          label: trans("scatterChart.heatmapMonth"),
        })}
        {children.polar.propertyView({
          label: trans("scatterChart.polar"),
        })}
      </>
    ))
    .build();
})();
