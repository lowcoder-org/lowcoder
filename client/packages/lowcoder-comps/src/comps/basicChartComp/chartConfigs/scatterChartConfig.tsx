import {
  MultiCompBuilder,
  dropdownControl,
  BoolControl,
  NumberControl,
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
      </>
    ))
    .build();
})();
