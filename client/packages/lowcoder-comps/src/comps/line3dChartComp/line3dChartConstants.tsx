import {
  jsonControl,
  stateComp,
  toJSONObjectArray,
  toObject,
  BoolControl,
  ColorControl,
  withDefault,
  StringControl,
  NumberControl,
  dropdownControl,
  list,
  eventHandlerControl,
  valueComp,
  withType,
  uiChildren,
  clickEvent,
  toArray,
  styleControl,
  EchartDefaultTextStyle,
  EchartDefaultChartStyle,
  MultiCompBuilder,
} from "lowcoder-sdk";
import { RecordConstructorToComp, RecordConstructorToView } from "lowcoder-core";
import { XAxisConfig, YAxisConfig } from "../basicChartComp/chartConfigs/cartesianAxisConfig";
import { LegendConfig } from "../basicChartComp/chartConfigs/legendConfig";
import { EchartsLegendConfig } from "../basicChartComp/chartConfigs/echartsLegendConfig";
import { EchartsLabelConfig } from "../basicChartComp/chartConfigs/echartsLabelConfig";
import { EChartsOption } from "echarts";
import { i18nObjs, trans } from "i18n/comps";
import {EchartsTitleVerticalConfig} from "../chartComp/chartConfigs/echartsTitleVerticalConfig";
import {EchartsTitleConfig} from "../basicChartComp/chartConfigs/echartsTitleConfig";

export const UIEventOptions = [
  {
    label: trans("chart.select"),
    value: "select",
    description: trans("chart.selectDesc"),
  },
  {
    label: trans("chart.unSelect"),
    value: "unselect",
    description: trans("chart.unselectDesc"),
  },
] as const;

export const XAxisDirectionOptions = [
  {
    label: trans("chart.horizontal"),
    value: "horizontal",
  },
  {
    label: trans("chart.vertical"),
    value: "vertical",
  },
] as const;

export type XAxisDirectionType = ValueFromOption<typeof XAxisDirectionOptions>;

export const noDataAxisConfig = {
  animation: false,
  xAxis: {
    type: "category",
    name: trans("chart.noData"),
    nameLocation: "middle",
    data: [],
    axisLine: {
      lineStyle: {
        color: "#8B8FA3",
      },
    },
  },
  yAxis: {
    type: "value",
    axisLabel: {
      color: "#8B8FA3",
    },
    splitLine: {
      lineStyle: {
        color: "#F0F0F0",
      },
    },
  },
  tooltip: {
    show: false,
  },
  series: [
    {
      data: [700],
      type: "line",
      itemStyle: {
        opacity: 0,
      },
    },
  ],
} as EChartsOption;

export const noDataLine3DChartConfig = {
  animation: false,
  tooltip: {
    show: false,
  },
  legend: {
    formatter: trans("chart.unknown"),
    top: "bottom",
    selectedMode: false,
  },
  color: ["#B8BBCC", "#CED0D9", "#DCDEE6", "#E6E6EB"],
  series: [],
} as EChartsOption;

export type ChartSize = { w: number; h: number };

export const getDataKeys = (data: Array<JSONObject>) => {
  if (!data) {
    return [];
  }
  const dataKeys: Array<string> = [];
  data[0].forEach((key) => {
    if (!dataKeys.includes(key)) {
      dataKeys.push(key);
    }
  });
  return dataKeys;
};

export const chartUiModeChildren = {
  title: withDefault(StringControl, trans("echarts.defaultTitle")),
  data: jsonControl(toArray, i18nObjs.defaultDatasource3DGlobe),
  xAxisKey: valueComp<string>(""), // x-axis, key from data
  xAxisDirection: dropdownControl(XAxisDirectionOptions, "horizontal"),
  xAxisData: jsonControl(toArray, []),
  yAxisKey: valueComp<string>(""), // x-axis, key from data
  xConfig: XAxisConfig,
  yConfig: YAxisConfig,
  legendConfig: LegendConfig,
  environment: withDefault(StringControl, trans("line3dchart.defaultEnvironment")),
  baseTexture: withDefault(StringControl, trans("line3dchart.defaultBaseTexture")),
  heightTexture: withDefault(StringControl, trans("line3dchart.defaultHeightTexture")),
  background: withDefault(ColorControl, "black"),
  lineStyleWidth: withDefault(NumberControl, 1),
  lineStyleColor: withDefault(ColorControl, "rgb(50, 50, 150)"),
  lineStyleOpacity: withDefault(NumberControl, 0.1),
  effectShow: withDefault(BoolControl, true),
  effectWidth: withDefault(NumberControl, 2),
  effectLength: withDefault(NumberControl, 0.15),
  effectOpacity: withDefault(NumberControl, 1),
  effectColor: withDefault(ColorControl, 'rgb(30, 30, 60)'),
  onUIEvent: eventHandlerControl(UIEventOptions),
};

export type UIChartDataType = {
  seriesName: string;
  // coordinate chart
  x?: any;
  y?: any;
  // line3d or funnel
  itemName?: any;
  value?: any;
};

export type NonUIChartDataType = {
  name: string;
  value: any;
}

export const line3dChartChildrenMap = {
  selectedPoints: stateComp<Array<UIChartDataType>>([]),
  lastInteractionData: stateComp<Array<UIChartDataType> | NonUIChartDataType>({}),
  onEvent: eventHandlerControl([clickEvent] as const),
  ...chartUiModeChildren,
};

const chartUiChildrenMap = uiChildren(line3dChartChildrenMap);
export type ChartCompPropsType = RecordConstructorToView<typeof chartUiChildrenMap>;
export type ChartCompChildrenType = RecordConstructorToComp<typeof chartUiChildrenMap>;
