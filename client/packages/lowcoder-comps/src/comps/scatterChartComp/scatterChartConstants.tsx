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
import { ScatterChartConfig } from "../basicChartComp/chartConfigs/scatterChartConfig";
import { SeriesListComp } from "./seriesComp";
import { EChartsOption } from "echarts";
import { i18nObjs, trans } from "i18n/comps";
import { GaugeChartConfig } from "../basicChartComp/chartConfigs/gaugeChartConfig";
import { FunnelChartConfig } from "../basicChartComp/chartConfigs/funnelChartConfig";
import {EchartsTitleVerticalConfig} from "../chartComp/chartConfigs/echartsTitleVerticalConfig";
import {EchartsTitleConfig} from "../basicChartComp/chartConfigs/echartsTitleConfig";

export const ChartTypeOptions = [
  {
    label: trans("chart.bar"),
    value: "bar",
  },
  {
    label: trans("chart.line"),
    value: "line",
  },
  {
    label: trans("chart.scatter"),
    value: "scatter",
  },
  {
    label: trans("chart.scatter"),
    value: "scatter",
  },
] as const;

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

export const noDataScatterChartConfig = {
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
  series: [
    {
      type: "scatter",
      radius: "35%",
      center: ["25%", "50%"],
      silent: true,
      label: {
        show: false,
      },
      data: [
        {
          name: "1",
          value: 70,
        },
        {
          name: "2",
          value: 68,
        },
        {
          name: "3",
          value: 48,
        },
        {
          name: "4",
          value: 40,
        },
      ],
    },
    {
      type: "scatter",
      radius: "35%",
      center: ["75%", "50%"],
      silent: true,
      label: {
        show: false,
      },
      data: [
        {
          name: "1",
          value: 70,
        },
        {
          name: "2",
          value: 68,
        },
        {
          name: "3",
          value: 48,
        },
        {
          name: "4",
          value: 40,
        },
      ],
    },
  ],
} as EChartsOption;

export type ChartSize = { w: number; h: number };

export const getDataKeys = (data: Array<JSONObject>) => {
  if (!data) {
    return [];
  }
  const dataKeys: Array<string> = [];
  data.slice(0, 50).forEach((d) => {
    Object.keys(d).forEach((key) => {
      if (!dataKeys.includes(key)) {
        dataKeys.push(key);
      }
    });
  });
  return dataKeys;
};

const ChartOptionMap = {
  scatter: ScatterChartConfig,
};

const EchartsOptionMap = {
  funnel: FunnelChartConfig,
  gauge: GaugeChartConfig,
};

const ChartOptionComp = withType(ChartOptionMap, "scatter");
const EchartsOptionComp = withType(EchartsOptionMap, "funnel");
export type CharOptionCompType = keyof typeof ChartOptionMap;

export const SCATTER_CHART_DEMO_DATA = [
 
    { hours: 1.5, score: 62, student: "Alex M." },
    { hours: 2.0, score: 65, student: "Sarah P." },
    { hours: 2.5, score: 71, student: "James W." },
    { hours: 2.8, score: 69, student: "Emma L." },
    { hours: 3.0, score: 75, student: "Michael R." },
    { hours: 3.2, score: 73, student: "Lisa K." },
    { hours: 3.5, score: 78, student: "David H." },
    { hours: 3.8, score: 77, student: "Sophie T." },
    { hours: 4.0, score: 82, student: "Ryan B." },
    { hours: 4.2, score: 84, student: "Nina C." },
    { hours: 4.5, score: 86, student: "Thomas G." },
    { hours: 4.8, score: 88, student: "Maria S." },
    { hours: 5.0, score: 89, student: "Daniel F." },
    { hours: 5.2, score: 91, student: "Anna D." },
    { hours: 5.5, score: 90, student: "Kevin P." },
    { hours: 5.8, score: 93, student: "Rachel M." },
    { hours: 6.0, score: 95, student: "John L." },
    { hours: 6.2, score: 94, student: "Emily W." },
    { hours: 3.0, score: 68, student: "Chris B." },  // outlier - lower performance
    { hours: 5.0, score: 96, student: "Jessica H." } // outlier - higher performance
  
]

export const chartUiModeChildren = {
  title: withDefault(StringControl, trans("echarts.defaultTitle")),
  data: jsonControl(toJSONObjectArray, SCATTER_CHART_DEMO_DATA),
  xAxisKey: valueComp<string>(""), // x-axis, key from data
  xAxisDirection: dropdownControl(XAxisDirectionOptions, "horizontal"),
  xAxisData: jsonControl(toArray, []),
  series: SeriesListComp,
  xConfig: XAxisConfig,
  yConfig: YAxisConfig,
  legendConfig: LegendConfig,
  chartConfig: ChartOptionComp,
  onUIEvent: eventHandlerControl(UIEventOptions),
};

let chartJsonModeChildren: any = {
  echartsOption: jsonControl(toObject, i18nObjs.defaultEchartsJsonOption),
  echartsTitle: withDefault(StringControl, trans("echarts.defaultTitle")),
  echartsLegendConfig: EchartsLegendConfig,
  echartsLabelConfig: EchartsLabelConfig,
  echartsConfig: EchartsOptionComp,
  echartsTitleVerticalConfig: EchartsTitleVerticalConfig,
  echartsTitleConfig:EchartsTitleConfig,

  left:withDefault(NumberControl,trans('chart.defaultLeft')),
  right:withDefault(NumberControl,trans('chart.defaultRight')),
  top:withDefault(NumberControl,trans('chart.defaultTop')),
  bottom:withDefault(NumberControl,trans('chart.defaultBottom')),

  tooltip: withDefault(BoolControl, true),
  legendVisibility: withDefault(BoolControl, true),
}

if (EchartDefaultChartStyle && EchartDefaultTextStyle) {
  chartJsonModeChildren = {
    ...chartJsonModeChildren,
    chartStyle: styleControl(EchartDefaultChartStyle, 'chartStyle'),
    titleStyle: styleControl(EchartDefaultTextStyle, 'titleStyle'),
    xAxisStyle: styleControl(EchartDefaultTextStyle, 'xAxis'),
    yAxisStyle: styleControl(EchartDefaultTextStyle, 'yAxisStyle'),
    legendStyle: styleControl(EchartDefaultTextStyle, 'legendStyle'),
  }
}

export type UIChartDataType = {
  seriesName: string;
  // coordinate chart
  x?: any;
  y?: any;
  // scatter or funnel
  itemName?: any;
  value?: any;
};

export type NonUIChartDataType = {
  name: string;
  value: any;
}

export const scatterChartChildrenMap = {
  selectedPoints: stateComp<Array<UIChartDataType>>([]),
  lastInteractionData: stateComp<Array<UIChartDataType> | NonUIChartDataType>({}),
  onEvent: eventHandlerControl([clickEvent] as const),
  ...chartUiModeChildren,
  ...chartJsonModeChildren,
};

const chartUiChildrenMap = uiChildren(scatterChartChildrenMap);
export type ChartCompPropsType = RecordConstructorToView<typeof chartUiChildrenMap>;
export type ChartCompChildrenType = RecordConstructorToComp<typeof chartUiChildrenMap>;
