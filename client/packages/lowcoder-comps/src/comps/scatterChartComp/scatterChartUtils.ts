import {
  CharOptionCompType,
  ChartCompPropsType,
  ChartSize,
  noDataAxisConfig,
  noDataScatterChartConfig,
} from "comps/scatterChartComp/scatterChartConstants";
import { EChartsOptionWithMap } from "../basicChartComp/reactEcharts/types";
import _ from "lodash";
import { chartColorPalette, isNumeric, JSONObject, loadScript } from "lowcoder-sdk";
import { calcXYConfig } from "comps/basicChartComp/chartConfigs/cartesianAxisConfig";
import Big from "big.js";
import { googleMapsApiUrl } from "../basicChartComp/chartConfigs/chartUrls";
import opacityToHex from "../../util/opacityToHex";
import parseBackground from "../../util/gradientBackgroundColor";
import {ba, s} from "@fullcalendar/core/internal-common";
import {chartStyleWrapper, styleWrapper} from "../../util/styleWrapper";

export function transformData(
  originData: JSONObject[],
  xAxis: string,
  seriesColumnNames: string[]
) {
  // aggregate data by x-axis
  const transformedData: JSONObject[] = [];
  originData.reduce((prev, cur) => {
    if (cur === null || cur === undefined) {
      return prev;
    }
    const groupValue = cur[xAxis] as string;
    if (!prev[groupValue]) {
      // init as 0
      const initValue: any = {};
      seriesColumnNames.forEach((name) => {
        initValue[name] = 0;
      });
      prev[groupValue] = initValue;
      transformedData.push(prev[groupValue]);
    }
    // remain the x-axis data
    prev[groupValue][xAxis] = groupValue;
    seriesColumnNames.forEach((key) => {
      if (key === xAxis) {
        return;
      } else if (isNumeric(cur[key])) {
        const bigNum = Big(cur[key]);
        prev[groupValue][key] = bigNum.add(prev[groupValue][key]).toNumber();
      } else {
        prev[groupValue][key] += 1;
      }
    });
    return prev;
  }, {} as any);
  return transformedData;
}

export const echartsConfigOmitChildren = [
  "hidden",
  "selectedPoints",
  "onUIEvent",
  "mapInstance"
] as const;
type EchartsConfigProps = Omit<ChartCompPropsType, typeof echartsConfigOmitChildren[number]>;

export function getSeriesConfig(props: EchartsConfigProps) {
  let visibleSeries = props.series.filter((s) => !s.getView().hide).map(s => s.toJsonValue());
  return visibleSeries.map((s, index) => {
    let config = {
      ...props.chartConfig,
      name: s.seriesName,
      encode: {
        itemName: props.xAxisKey,
        value: s.columnName,
      },
      itemStyle: {
        borderRadius: s.borderRadius,
        color: s.itemColor,
        shadowColor: s.itemShadowColor,
        shadowBlur: s.itemShadowBlur,
      },
    }
    let fromArr = [0,0];
    let toArr = [0,0];
    try {
      fromArr = JSON.parse(s.markLineFrom);
    } catch {}
    try {
      toArr = JSON.parse(s.markLineTo);
    } catch {}
    if(s.showMarkLine) {
      config.markLine = {
        animation: false,
        label: {
          formatter: s.markLineDesc,
          align: 'right'
        },
        lineStyle: {
          type: 'solid'
        },
        tooltip: {
          formatter: s.markLineDesc
        },
        data: [
          [
            {
              coord: fromArr,
              symbol: 'none'
            },
            {
              coord: toArr,
              symbol: 'none'
            }
          ]
        ]
      };
    }
    if(props.chartConfig.singleAxis) {
      config.coordinateSystem = 'singleAxis';
      config.singleAxisIndex = index;
      config.data = [];
    }
    if(props.chartConfig.polar) {
      config.coordinateSystem = 'polar';
    }
    if(props.chartConfig.heatmap) {
      config.coordinateSystem = 'calendar';
      config.type = 'heatmap';
    }
    if(s.effect) config.type = "effectScatter";
    if(s.symbolSize) config.symbolSize = s.symbolSize;
    if(s.dynamicSize) config.symbolSize = function(dataItem) {
        return dataItem[s.dynamicIndex] / s.divider;
      }
    return config;
  });
}

// https://echarts.apache.org/en/option.html
export function getEchartsConfig(
  props: EchartsConfigProps,
  chartSize?: ChartSize,
  theme?: any,
): EChartsOptionWithMap {
  const gridPos = {
    left: `${props?.left}%`,
    right: `${props?.right}%`,
    bottom: `${props?.bottom}%`,
    top: `${props?.top}%`,
  };

  let config: any = {
    title: {
      text: props.title,
      top: props.echartsTitleVerticalConfig.top,
      left:props.echartsTitleConfig.top,
      textStyle: {
        ...styleWrapper(props?.titleStyle, theme?.titleStyle)
      }
    },
    backgroundColor: parseBackground( props?.chartStyle?.background || theme?.chartStyle?.backgroundColor || "#FFFFFF"),
    legend: {
      ...props.legendConfig,
      textStyle: {
        ...styleWrapper(props?.legendStyle, theme?.legendStyle, 15)
      }
    },
    tooltip: props.tooltip && {
      trigger: "axis",
      axisPointer: {
        type: "line",
        lineStyle: {
          color: "rgba(0,0,0,0.2)",
          width: 2,
          type: "solid"
        }
      }
    },
    grid: {
      ...gridPos,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: props.chartConfig.boundaryGap,
      splitLine: {
        show: !props.chartConfig.boundaryGap,
      },
      axisLine: {
        show: props.chartConfig.boundaryGap,
      },
      axisLabel: {
        ...styleWrapper(props?.xAxisStyle, theme?.xAxisStyle, 11)
      }
    },
    yAxis: {
      type: "category",
      axisLabel: {
        ...styleWrapper(props?.yAxisStyle, theme?.yAxisStyle, 11)
      }
    },
  };

  if (props.data.length <= 0) {
    // no data
    return {
      ...config,
      ...noDataScatterChartConfig,
    };
  }
  const yAxisConfig = props.yConfig();
  const seriesColumnNames = props.series
    .filter((s) => !s.getView().hide)
    .map((s) => s.getView().columnName);
  // y-axis is category and time, data doesn't need to aggregate
  let transformedData = props.data;
  const seriesConfig = getSeriesConfig(props);
  const singleAxis = seriesConfig.map((series, idx) => ({
    left: 100,
    type: 'category',
    boundaryGap: false,
    top: (idx * 100) / seriesConfig.length + (100/seriesConfig.length/2) + '%',
    height: - 100 / seriesConfig.length / 4 + '%',
  }));
  
  config = {
    ...config,
    series: seriesConfig.map(series => ({
      ...series,
      itemStyle: {
        ...series.itemStyle,
        ...chartStyleWrapper(props?.chartStyle, theme?.chartStyle)
      },
      lineStyle: {
        ...chartStyleWrapper(props?.chartStyle, theme?.chartStyle)
      },
      data: transformedData.map(d => [d[props.xAxisKey], d[series.encode.value], ...Object.values(d)]),
    })),
  };

  if(props.chartConfig.singleAxis) {
    config.singleAxis = singleAxis;
    delete config.xAxis;
    delete config.yAxis;
    
    config.title = seriesConfig.map((series, idx) => ({
      textBaseline: 'middle',
      top: ((idx + 0.5) * 100) / seriesConfig.length + '%',
      text: series.name,
    }));
  }

  if(props.chartConfig.visualMapData.visualMap) {
    config.visualMap = {
      min: props.chartConfig.visualMapData.visualMapMin,
      max: props.chartConfig.visualMapData.visualMapMax,
      dimension: props.chartConfig.visualMapData.visualMapDimension,
      orient: 'vertical',
      right: 10,
      top: 'center',
      text: ['HIGH', 'LOW'],
      calculable: true,
      inRange: {
        color: [props.chartConfig.visualMapData.visualMapColorMin, props.chartConfig.visualMapData.visualMapColorMax]
      }
    }
  }
  if(props.chartConfig.polar) {
    config.angleAxis = config.xAxis;
    config.radiusAxis = config.yAxis;
    config.polar = {};
    delete config.xAxis;
    delete config.yAxis;
  }

  if(props.chartConfig.heatmap) {
    config.calendar = {
      orient: 'vertical',
      yearLabel: {
        margin: 40
      },
      monthLabel: {
        nameMap: 'cn',
        margin: 20
      },
      dayLabel: {
        firstDay: 1,
        nameMap: 'cn'
      },
      cellSize: 40,
      range: props.chartConfig.heatmapMonth,
    }
    delete config.xAxis;
    delete config.yAxis;
  }

  return config;
}

export function getSelectedPoints(param: any, option: any) {
  const series = option.series;
  const dataSource = _.isArray(option.dataset) && option.dataset[0]?.source;
  if (series && dataSource) {
    return param.selected.flatMap((selectInfo: any) => {
      const seriesInfo = series[selectInfo.seriesIndex];
      if (!seriesInfo || !seriesInfo.encode) {
        return [];
      }
      return selectInfo.dataIndex.map((index: any) => {
        const commonResult = {
          seriesName: seriesInfo.name,
        };
        if (seriesInfo.encode.itemName && seriesInfo.encode.value) {
          return {
            ...commonResult,
            itemName: dataSource[index][seriesInfo.encode.itemName],
            value: dataSource[index][seriesInfo.encode.value],
          };
        } else {
          return {
            ...commonResult,
            x: dataSource[index][seriesInfo.encode.x],
            y: dataSource[index][seriesInfo.encode.y],
          };
        }
      });
    });
  }
  return [];
}

export function loadGoogleMapsScript(apiKey: string) {
  const mapsUrl = `${googleMapsApiUrl}?key=${apiKey}`;
  const scripts = document.getElementsByTagName('script');
  // is script already loaded
  let scriptIndex = _.findIndex(scripts, (script) => script.src.endsWith(mapsUrl));
  if(scriptIndex > -1) {
    return scripts[scriptIndex];
  }
  // is script loaded with diff api_key, remove the script and load again
  scriptIndex = _.findIndex(scripts, (script) => script.src.startsWith(googleMapsApiUrl));
  if(scriptIndex > -1) {
    scripts[scriptIndex].remove();
  }

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = mapsUrl;
  script.async = true;
  script.defer = true;
  window.document.body.appendChild(script);

  return script;
}
