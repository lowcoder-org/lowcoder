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
  EchartDefaultChartStyle,
  EchartDefaultTextStyle,
  ColorControl,
  EchartDefaultDetailStyle,
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
import { GaugeChartConfig } from "../chartComp/chartConfigs/gaugeChartConfig";
import { EchartsTitleConfig } from "comps/chartComp/chartConfigs/echartsTitleConfig";

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
  gauge: GaugeChartConfig,
};

const ChartTypeOptions = [
  {
    label: trans("chart.default"),
    value: "default",
  },
  {
    label: trans("chart.stageGauge"),
    value: "stageGauge",
  },
  {
    label: trans("chart.gradeGauge"),
    value: "gradeGauge",
  },
  {
    label: trans("chart.temperatureGauge"),
    value: "temperatureGauge",
  },
  {
    label: trans("chart.multiGauge"),
    value: "multiGauge",
  },
  {
    label: trans("chart.ringGauge"),
    value: "ringGauge",
  },
  {
    label: trans("chart.barometerGauge"),
    value: "barometerGauge",
  },
  {
    label: trans("chart.clockGauge"),
    value: "clockGauge",
  },
] as const;

const ChartOptionComp = withType(ChartOptionMap, "bar");
const EchartsOptionComp = withType(EchartsOptionMap, "gauge");
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
  echartsData: jsonControl(toArray),
  echartsOption: jsonControl(toObject, i18nObjs.defaultGaugeChartOption),
  stageGaugeOption: jsonControl(toObject, i18nObjs.defaultStageGaugeChartOption),
  gradeGaugeOption: jsonControl(toObject, i18nObjs.defaultGradeGaugeChartOption),
  temperatureGaugeOption: jsonControl(toObject, i18nObjs.defaultTemperatureGaugeChartOption),
  multiTitleGaugeOption: jsonControl(toObject, i18nObjs.defaultMultiTitleGaugeChartOption),
  ringGaugeOption: jsonControl(toObject, i18nObjs.defaultRingGaugeChartOption),
  clockGaugeOption: jsonControl(toObject, i18nObjs.defaultClockGaugeChartOption),
  barometerGaugeOption: jsonControl(toObject, i18nObjs.defaultBarometerGaugeChartOption),

  stageGaugeData:jsonControl(toArray),
  gradeGaugeData:jsonControl(toArray),
  temperatureGaugeData:jsonControl(toArray),
  multiTitleGaugeData:jsonControl(toArray),
  ringGaugeData:jsonControl(toArray),
  clockGaugeData:jsonControl(toArray),
  barometerGaugeData:jsonControl(toArray),

  chartType: dropdownControl(ChartTypeOptions, trans("chart.default")),
  echartsTitle: withDefault(StringControl, trans("gaugeChart.defaultTitle")),
  echartsLegendConfig: EchartsLegendConfig,
  echartsLabelConfig: EchartsLabelConfig,
  echartsConfig: EchartsOptionComp,
  echartsTitleConfig:EchartsTitleConfig,
  // style: styleControl(EchartsStyle, 'style'),
  tooltip: withDefault(BoolControl, true),
  legendVisibility: withDefault(BoolControl, true),
  label: withDefault(BoolControl, true),
  progressBar: withDefault(BoolControl, true),
  roundCap: withDefault(BoolControl, true),
  left:withDefault(NumberControl,trans('gaugeChart.defaultLeft')),
  top:withDefault(NumberControl,trans('gaugeChart.defaultTop')),
  bottom:withDefault(NumberControl,trans('gaugeChart.defaultBottom')),
  width:withDefault(NumberControl,trans('gaugeChart.defaultWidth')),
  radius:withDefault(NumberControl,trans('gaugeChart.defaultRadius')),
  temperatureRadius:withDefault(NumberControl,trans('gaugeChart.defaultTemperatureRadius')),
  min:withDefault(NumberControl,trans('gaugeChart.defaultMin')),
  max:withDefault(NumberControl,trans('gaugeChart.defaultMax')),
  gap:withDefault(NumberControl,trans('gaugeChart.defaultGap')),
  position_x:withDefault(NumberControl,trans('gaugeChart.defaultPosition_X')),
  position_y:withDefault(NumberControl,trans('gaugeChart.defaultPosition_Y')),
  startAngle:withDefault(NumberControl,trans('gaugeChart.defaultStartAngle')),
  endAngle:withDefault(NumberControl,trans('gaugeChart.defaultEndAngle')),
  splitNumber:withDefault(NumberControl,trans('gaugeChart.defaultSplitNumber')),
  pointerLength:withDefault(NumberControl,trans('gaugeChart.defaultPointerLength')),
  barometerPointerLength:withDefault(NumberControl,trans('gaugeChart.defaultBarometerPointerLength')),
  pointerWidth:withDefault(NumberControl,trans('gaugeChart.defaultPointerWidth')),
  barometerPointerWidth:withDefault(NumberControl,trans('gaugeChart.defaultBarometerPointerWidth')),
  pointer_Y:withDefault(NumberControl,trans('gaugeChart.defaultPointer_Y')),
  barometerPointer_Y:withDefault(NumberControl,trans('gaugeChart.defaultBarometerPointer_Y')),
  pointerIcon:withDefault(StringControl),
  gradePointerIcon:withDefault(StringControl, trans('gaugeChart.gradeDefaultPointerIcon')),
  clockPointerIcon:withDefault(StringControl, trans('gaugeChart.clockDefaultPointerIcon')),
  barometerPointerIcon:withDefault(StringControl, trans('gaugeChart.defaultBarometerPointerIcon')),
  multiTitlePointerIcon:withDefault(StringControl, trans('gaugeChart.defaultMultiTitlePointerIcon')),
  progressBarWidth:withDefault(NumberControl,trans('gaugeChart.defaultProgressBarWidth')),
  axisTickWidth: withDefault(NumberControl, trans('gaugeChart.defaultAxisTickWidth')),
  axisTickLength: withDefault(NumberControl, trans('gaugeChart.defaultAxisTickLength')),
  axisLabelDistance: withDefault(NumberControl, trans('gaugeChart.defaultAxisLabelDistance')),
  axisTickColor: withDefault(ColorControl, trans('gaugeChart.defaultAxisTickColor')),

  gradeGaugePointerLength:withDefault(NumberControl,trans('gaugeChart.defaultGradeGaugePointerLength')),
  gradeGaugePointerWidth:withDefault(NumberControl,trans('gaugeChart.defaultGradeGaugePointerWidth')),
  gradeGaugePointer_Y:withDefault(NumberControl,trans('gaugeChart.defaultGradeGaugePointer_Y')),
  stageProgressBarWidth:withDefault(NumberControl,trans('gaugeChart.defaultStageProgressBarWidth')),
  temperatureProgressBarWidth:withDefault(NumberControl,trans('gaugeChart.defaultTemperatureProgressBarWidth')),
  ringProgressBarWidth:withDefault(NumberControl,trans('gaugeChart.defaultRingProgressBarWidth')),
  temperatureAxisLabelDistance:withDefault(NumberControl,trans('gaugeChart.defaultTemperatureAxisLabelDistance')),
  stageAxisTickColor: withDefault(ColorControl, trans('gaugeChart.defaultStageAxisTickColor')),
  gradeAxisTickColor: withDefault(ColorControl),

}

if (EchartDefaultChartStyle && EchartDefaultTextStyle && EchartDefaultDetailStyle) {
  chartJsonModeChildren = {
    ...chartJsonModeChildren,
    chartStyle: styleControl(EchartDefaultChartStyle, 'chartStyle'),
    titleStyle: styleControl(EchartDefaultTextStyle, 'titleStyle'),
    labelStyle: styleControl(EchartDefaultTextStyle, 'labelStyle'),
    legendStyle: styleControl(EchartDefaultDetailStyle, 'legendStyle'),
    axisLabelStyle: styleControl(EchartDefaultTextStyle, 'axisLabelStyle'),
    axisLabelStyleOutline: styleControl(EchartDefaultTextStyle, 'axisLabelStyleOutline'),
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

export const gaugeChartChildrenMap = {
  selectedPoints: stateComp<Array<UIChartDataType>>([]),
  lastInteractionData: stateComp<Array<UIChartDataType> | NonUIChartDataType>({}),
  onEvent: eventHandlerControl([clickEvent] as const),
  ...chartUiModeChildren,
  ...chartJsonModeChildren,
  ...chartMapModeChildren,
};

const chartUiChildrenMap = uiChildren(gaugeChartChildrenMap);
export type ChartCompPropsType = RecordConstructorToView<typeof chartUiChildrenMap>;
export type ChartCompChildrenType = RecordConstructorToComp<typeof chartUiChildrenMap>;
