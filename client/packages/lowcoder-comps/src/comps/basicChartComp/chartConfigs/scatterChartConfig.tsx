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
      shape: dropdownControl(ScatterShapeOptions, "circle"),
      singleAxis: BoolControl,
      divider: withDefault(NumberControl, 1000),
    },
    (props): ScatterSeriesOption => {
      return {
        type: "scatter",
        symbol: props.shape,
        label: {
          show: props.showLabel,
          position: 'right',
          formatter: function (param) {
            return param.data[2];
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
        divider: props.divider,
      };
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {showLabelPropertyView(children)}
        {children.shape.propertyView({
          label: trans("chart.scatterShape"),
        })}
        {children.singleAxis.propertyView({
          label: trans("scatterChart.singleAxis"),
        })}
        {children.singleAxis.getView() && children.divider.propertyView({
          label: trans("scatterChart.divider"),
        })}
      </>
    ))
    .build();
})();
