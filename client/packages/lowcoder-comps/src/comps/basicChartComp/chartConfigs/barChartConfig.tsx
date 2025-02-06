import {
  BoolControl,
  NumberControl,
  withDefault,
  dropdownControl,
  MultiCompBuilder,
  showLabelPropertyView,
  ColorControl,
  Dropdown,
  toArray,
  jsonControl,
} from "lowcoder-sdk";
import { changeChildAction, CompAction } from "lowcoder-core";
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
  {
    label: trans("chart.waterfallBar"),
    value: "waterfall",
  },
  {
    label: trans("chart.polar"),
    value: "polar",
  },
] as const;

export const BarChartConfig = (function () {
  return new MultiCompBuilder(
    {
      showLabel: BoolControl,
      type: dropdownControl(BarTypeOptions, "basicBar"),
      barWidth: withDefault(NumberControl, i18nObjs.defaultBarChartOption.barWidth),
      showBackground: BoolControl,
      backgroundColor: withDefault(ColorControl, i18nObjs.defaultBarChartOption.barBg),
      radiusAxisMax: withDefault(NumberControl, 4),
      polarRadiusDeg: withDefault(NumberControl, 30),
      polarRadiusSize: withDefault(NumberControl, 80),
      labelData: jsonControl(toArray, []),
    },
    (props): BarSeriesOption => {
      const config: BarSeriesOption = {
        type: "bar",
        subtype: props.type,
        label: {
          show: props.showLabel,
          position: "top",
        },
        barWidth: `${props.barWidth}%`,
        showBackground: props.showBackground,
        backgroundStyle: {
          color: props.backgroundColor,
        },
        polarData: {
          radiusAxisMax: props.radiusAxisMax,
          polarRadiusDeg: props.polarRadiusDeg,
          polarRadiusSize: props.polarRadiusSize,
          labelData: props.labelData,
        }

      };
      if (props.type === "stackedBar") {
        config.stack = "stackValue";
      }
      if (props.type === "waterfall") {
        config.label = undefined;
        config.stack = "stackValue";
      }
      if (props.type === "polar") {
        config.coordinateSystem = 'polar';
      }
      return config;
    }
  )
    .setPropertyViewFn((children, dispatch: (action: CompAction) => void) => (
      <>
        <Dropdown
          value={children.type.getView()}
          options={BarTypeOptions}
          label={trans("chart.barType")}
          onChange={(value) => {
            dispatch(changeChildAction("type", value));
          }}
        />
        {showLabelPropertyView(children)}
        {children.barWidth.propertyView({
          label: trans("barChart.barWidth"),
        })}
        {children.showBackground.propertyView({
          label: trans("barChart.showBg"),
        })}
        {children.showBackground.getView() && children.backgroundColor.propertyView({
          label: trans("barChart.bgColor"),
        })}
        {children.type.getView()  === "polar" && children.radiusAxisMax.propertyView({
          label: trans("barChart.radiusAxisMax"),
        })}
        {children.type.getView()  === "polar" && children.polarRadiusDeg.propertyView({
          label: trans("barChart.polarRadiusDeg"),
        })}
        {children.type.getView()  === "polar" && children.polarRadiusSize.propertyView({
          label: trans("barChart.polarRadiusSize"),
        })}
        {children.type.getView()  === "polar" && children.labelData.propertyView({
          label: trans("barChart.polarLabelData"),
        })}
      </>
    ))
    .build();
})();
