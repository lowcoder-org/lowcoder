import {
  jsonControl,
  JSONObject,
  stateComp,
  toJSONObjectArray,
  toObject,
  BoolControl,
  withDefault,
  StringControl,
  NumberControl,
  FunctionControl,
  dropdownControl,
  eventHandlerControl,
  valueComp,
  withType,
  uiChildren,
  clickEvent,
  styleControl,
  SankeyLineStyle,
  EchartDefaultChartStyle,
  EchartDefaultTextStyle,
  RadarLabelStyle,
  toArray
} from "lowcoder-sdk";
import { RecordConstructorToComp, RecordConstructorToView } from "lowcoder-core";
import { BarChartConfig } from "../chartComp/chartConfigs/barChartConfig";
import { XAxisConfig, YAxisConfig } from "../chartComp/chartConfigs/cartesianAxisConfig";
import { LegendConfig } from "../chartComp/chartConfigs/legendConfig";
import { EchartsLegendConfig } from "../chartComp/chartConfigs/echartsLegendConfig";
import { EchartsLabelConfig } from "../chartComp/chartConfigs/echartsLabelConfig";
import { LineChartConfig } from "../chartComp/chartConfigs/lineChartConfig";
import { PieChartConfig } from "../chartComp/chartConfigs/pieChartConfig";
import { ScatterChartConfig } from "../chartComp/chartConfigs/scatterChartConfig";
import { SeriesListComp } from "../chartComp/seriesComp";
import { EChartsOption } from "echarts";
import { i18nObjs, trans } from "i18n/comps";
import { SankeyChartConfig } from "../chartComp/chartConfigs/sankeyChartConfig";
import {EchartsTitleVerticalConfig} from "../chartComp/chartConfigs/echartsTitleVerticalConfig";
import {EchartsTitleConfig} from "../chartComp/chartConfigs/echartsTitleConfig";

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

export const MapEventOptions = [
  {
    label: trans("chart.mapReady"),
    value: "mapReady",
    description: trans("chart.mapReadyDesc"),
  },
  {
    label: trans("chart.zoomLevelChange"),
    value: "zoomLevelChange",
    description: trans("chart.zoomLevelChangeDesc"),
  },
  {
    label: trans("chart.centerPositionChange"),
    value: "centerPositionChange",
    description: trans("chart.centerPositionChangeDesc"),
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
  sankey: SankeyChartConfig,
};

const ChartOptionComp = withType(ChartOptionMap, "bar");
const EchartsOptionComp = withType(EchartsOptionMap, "sankey");
export type CharOptionCompType = keyof typeof ChartOptionMap;

export const chartUiModeChildren = {
  title: StringControl,
  data: jsonControl(toJSONObjectArray, i18nObjs.defaultDataSource),
  xAxisKey: valueComp<string>(""), // x-axis, key from data
  xAxisDirection: dropdownControl(XAxisDirectionOptions, "horizontal"),
  series: SeriesListComp,
  xConfig: XAxisConfig,
  yConfig: YAxisConfig,
  legendConfig: LegendConfig,
  chartConfig: ChartOptionComp,
  onUIEvent: eventHandlerControl(UIEventOptions),
};

let chartJsonModeChildren: any = {
  echartsData: jsonControl(toArray, i18nObjs.defaultSankeyChartOption.data),
  echartsLinks: jsonControl(toArray, i18nObjs.defaultSankeyChartOption.links),
  echartsOption: jsonControl(toObject, i18nObjs.defaultSankeyChartOption),
  echartsTitle: withDefault(StringControl, trans("sankeyChart.defaultTitle")),
  echartsLegendConfig: EchartsLegendConfig,
  echartsLabelConfig: EchartsLabelConfig,
  echartsTitleVerticalConfig: EchartsTitleVerticalConfig,
  echartsTitleConfig:EchartsTitleConfig,
  echartsConfig: EchartsOptionComp,

  left:withDefault(NumberControl,trans('sankeyChart.defaultLeft')),
  right:withDefault(NumberControl,trans('sankeyChart.defaultRight')),
  top:withDefault(NumberControl,trans('sankeyChart.defaultTop')),
  bottom:withDefault(NumberControl,trans('sankeyChart.defaultBottom')),
  curveness:withDefault(NumberControl,trans('sankeyChart.defaultCurveness')),
  opacity:withDefault(NumberControl,trans('sankeyChart.defaultOpacity')),
  nodeWidth:withDefault(NumberControl,trans('sankeyChart.defaultNodeWidth')),
  nodeGap:withDefault(NumberControl,trans('sankeyChart.defaultNodeGap')),

  draggable: withDefault(BoolControl, true),
  focus: withDefault(BoolControl, true),
  tooltip: withDefault(BoolControl, true),
  legendVisibility: withDefault(BoolControl, true),
  labelVisibility: withDefault(BoolControl, true),
}

if (EchartDefaultChartStyle && EchartDefaultTextStyle && RadarLabelStyle && SankeyLineStyle) {
  chartJsonModeChildren = {
    ...chartJsonModeChildren,
    chartStyle: styleControl(EchartDefaultChartStyle, 'chartStyle'),
    titleStyle: styleControl(EchartDefaultTextStyle, 'titleStyle'),
    lineStyle: styleControl(SankeyLineStyle, 'lineStyle'),
    detailStyle: styleControl(RadarLabelStyle, 'detailStyle'),
  }
}

const chartMapModeChildren = {
  mapInstance: stateComp(),
  getMapInstance: FunctionControl,
  mapApiKey: withDefault(StringControl, ''),
  mapZoomLevel: withDefault(NumberControl, 3),
  mapCenterLng: withDefault(NumberControl, 15.932644),
  mapCenterLat: withDefault(NumberControl, 50.942063),
  mapOptions: jsonControl(toObject, i18nObjs.defaultMapJsonOption),
  onMapEvent: eventHandlerControl(MapEventOptions),
  showCharts: withDefault(BoolControl, true),
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

export const sankeyChartChildrenMap = {
  selectedPoints: stateComp<Array<UIChartDataType>>([]),
  lastInteractionData: stateComp<Array<UIChartDataType> | NonUIChartDataType>({}),
  onEvent: eventHandlerControl([clickEvent] as const),
  ...chartUiModeChildren,
  ...chartJsonModeChildren,
  ...chartMapModeChildren,
};

const chartUiChildrenMap = uiChildren(sankeyChartChildrenMap);
export type ChartCompPropsType = RecordConstructorToView<typeof chartUiChildrenMap>;
export type ChartCompChildrenType = RecordConstructorToComp<typeof chartUiChildrenMap>;
