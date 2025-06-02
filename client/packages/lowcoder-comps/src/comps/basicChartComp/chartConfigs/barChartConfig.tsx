import {
  BoolControl,
  NumberControl,
  StringControl,
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
      showLabel: withDefault(BoolControl, true),
      type: dropdownControl(BarTypeOptions, "basicBar"),
      barWidth: withDefault(NumberControl, 40),
      showBackground: withDefault(BoolControl, false),
      backgroundColor: withDefault(ColorControl, i18nObjs.defaultBarChartOption.barBg),
      radiusAxisMax: NumberControl,
      polarRadiusStart: withDefault(StringControl, '30'),
      polarRadiusEnd: withDefault(StringControl, '80%'),
      polarStartAngle: withDefault(NumberControl, 90),
      polarEndAngle: withDefault(NumberControl, -180),
      polarIsTangent: withDefault(BoolControl, false),
      stack: withDefault(BoolControl, false),
      race: withDefault(BoolControl, false),
      labelData: jsonControl(toArray, []),
    },
    (props): BarSeriesOption => {
      const config: BarSeriesOption = {
        type: "bar",
        subtype: props.type,
        realtimeSort: props.race,
        seriesLayoutBy: props.race?'column':undefined,
        label: {
          show: props.showLabel,
          position: "top",
          valueAnimation: props.race,
        },
        barWidth: `${props.barWidth}%`,
        showBackground: props.showBackground,
        backgroundStyle: {
          color: props.backgroundColor,
        },
        polarData: {
          radiusAxisMax: props.radiusAxisMax,
          polarRadiusStart: props.polarRadiusStart,
          polarRadiusEnd: props.polarRadiusEnd,
          polarStartAngle: props.polarStartAngle,
          polarEndAngle: props.polarEndAngle,
          labelData: props.labelData,
          polarIsTangent: props.polarIsTangent,
        },
        race: props.race,
      };
      if (props.stack) {
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
        {children.type.getView() !== "waterfall" && children.race.propertyView({
          label: trans("barChart.race"),
        })}
        {children.type.getView() !== "waterfall" && children.stack.propertyView({
          label: trans("barChart.stack"),
        })}
        {children.showBackground.propertyView({
          label: trans("barChart.showBg"),
        })}
        {children.showBackground.getView() && children.backgroundColor.propertyView({
          label: trans("barChart.bgColor"),
        })}
        {children.type.getView()  === "polar" && children.polarIsTangent.propertyView({
          label: trans("barChart.polarIsTangent"),
        })}
        {children.type.getView()  === "polar" && children.polarStartAngle.propertyView({
          label: trans("barChart.polarStartAngle"),
        })}
        {children.type.getView()  === "polar" && children.polarEndAngle.propertyView({
          label: trans("barChart.polarEndAngle"),
        })}
        {children.type.getView()  === "polar" && children.radiusAxisMax.propertyView({
          label: trans("barChart.radiusAxisMax"),
        })}
        {children.type.getView()  === "polar" && children.polarRadiusStart.propertyView({
          label: trans("barChart.polarRadiusStart"),
        })}
        {children.type.getView()  === "polar" && children.polarRadiusEnd.propertyView({
          label: trans("barChart.polarRadiusEnd"),
        })}
        {children.type.getView()  === "polar" && children.labelData.propertyView({
          label: trans("barChart.polarLabelData"),
        })}
      </>
    ))
    .build();
})();
