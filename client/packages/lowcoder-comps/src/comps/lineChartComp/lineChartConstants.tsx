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
import { BarChartConfig } from "../basicChartComp/chartConfigs/barChartConfig";
import { XAxisConfig, YAxisConfig } from "../basicChartComp/chartConfigs/cartesianAxisConfig";
import { LegendConfig } from "../basicChartComp/chartConfigs/legendConfig";
import { EchartsLegendConfig } from "../basicChartComp/chartConfigs/echartsLegendConfig";
import { EchartsLabelConfig } from "../basicChartComp/chartConfigs/echartsLabelConfig";
import { LineChartConfig } from "../basicChartComp/chartConfigs/lineChartConfig";
import { PieChartConfig } from "../basicChartComp/chartConfigs/pieChartConfig";
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
    label: trans("chart.pie"),
    value: "pie",
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

export const defaultChartData = [
  { date: "Jan", sales: 320, growth: 250 },
  { date: "Feb", sales: 450, growth: 300 },
  { date: "Mar", sales: 380, growth: 340 },
  { date: "Apr", sales: 520, growth: 400 },
  { date: "May", sales: 480, growth: 450 },
  { date: "Jun", sales: 600, growth: 500 }
];
export const noDataAxisConfig = {
  animation: false,
  xAxis: {
    type: "category",
    name: "No Data Available",
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

export const noDataPieChartConfig = {
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
      type: "pie",
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
      type: "pie",
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

const areaPiecesChildrenMap = {
  color: ColorControl,
  from: StringControl,
  to: StringControl,
  // unique key, for sort
  dataIndex: valueComp<string>(""),
};
const AreaPiecesTmpComp = new MultiCompBuilder(areaPiecesChildrenMap, (props) => {
  return props;
})
  .setPropertyViewFn((children: any) => 
    (<>
      {children.color.propertyView({label: trans("lineChart.color")})}
      {children.from.propertyView({label: trans("lineChart.from")})}
      {children.to.propertyView({label: trans("lineChart.to")})}
    </>)
  )
  .build();

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
  bar: BarChartConfig,
  line: LineChartConfig,
  pie: PieChartConfig,
  scatter: ScatterChartConfig,
};

const EchartsOptionMap = {
  funnel: FunnelChartConfig,
  gauge: GaugeChartConfig,
};

const ChartOptionComp = withType(ChartOptionMap, "line");
const EchartsOptionComp = withType(EchartsOptionMap, "funnel");
export type CharOptionCompType = keyof typeof ChartOptionMap;

export const chartUiModeChildren = {
  title: withDefault(StringControl, trans("lineChart.defaultTitle")),
  data: jsonControl(toJSONObjectArray, defaultChartData),
  xAxisKey: valueComp<string>(""), // x-axis, key from data
  xAxisDirection: dropdownControl(XAxisDirectionOptions, "horizontal"),
  xAxisData: jsonControl(toArray, []),
  series: SeriesListComp,
  xConfig: XAxisConfig,
  yConfig: YAxisConfig,
  legendConfig: LegendConfig,
  chartConfig: ChartOptionComp,
  areaPieces: list(AreaPiecesTmpComp),
  animationDuration: withDefault(NumberControl, 1000),
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
  // pie or funnel
  itemName?: any;
  value?: any;
};

export type NonUIChartDataType = {
  name: string;
  value: any;
}

export const lineChartChildrenMap = {
  selectedPoints: stateComp<Array<UIChartDataType>>([]),
  lastInteractionData: stateComp<Array<UIChartDataType> | NonUIChartDataType>({}),
  onEvent: eventHandlerControl([clickEvent] as const),
  ...chartUiModeChildren,
  ...chartJsonModeChildren,
};

const chartUiChildrenMap = uiChildren(lineChartChildrenMap);
export type ChartCompPropsType = RecordConstructorToView<typeof chartUiChildrenMap>;
export type ChartCompChildrenType = RecordConstructorToComp<typeof chartUiChildrenMap>;
