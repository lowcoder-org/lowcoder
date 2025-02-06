import {
  BoolControl,
  NumberControl,
  withDefault,
  dropdownControl,
  MultiCompBuilder,
  showLabelPropertyView,
  ColorControl,
  Dropdown,
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
] as const;

export const BarChartConfig = (function () {
  return new MultiCompBuilder(
    {
      showLabel: BoolControl,
      type: dropdownControl(BarTypeOptions, "basicBar"),
      barWidth: withDefault(NumberControl, i18nObjs.defaultBarChartOption.barWidth),
      showBackground: BoolControl,
      backgroundColor: withDefault(ColorControl, i18nObjs.defaultBarChartOption.barBg),
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
        }

      };
      if (props.type === "stackedBar") {
        config.stack = "stackValue";
      }
      if (props.type === "waterfall") {
        config.label = undefined;
        config.stack = "stackValue";
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
      </>
    ))
    .build();
})();
