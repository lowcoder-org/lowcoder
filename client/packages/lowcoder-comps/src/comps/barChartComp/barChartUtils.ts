import {
  CharOptionCompType,
  ChartCompPropsType,
  ChartSize,
  noDataAxisConfig,
  noDataPieChartConfig,
} from "comps/barChartComp/barChartConstants";
import { getPieRadiusAndCenter } from "comps/basicChartComp/chartConfigs/pieChartConfig";
import { EChartsOptionWithMap } from "../basicChartComp/reactEcharts/types";
import _ from "lodash";
import { chartColorPalette, isNumeric, JSONObject, loadScript } from "lowcoder-sdk";
import { calcXYConfig } from "comps/basicChartComp/chartConfigs/cartesianAxisConfig";
import Big from "big.js";
import { googleMapsApiUrl } from "../basicChartComp/chartConfigs/chartUrls";
import opacityToHex from "../../util/opacityToHex";
import parseBackground from "../../util/gradientBackgroundColor";
import {ba} from "@fullcalendar/core/internal-common";
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

const notAxisChartSet: Set<CharOptionCompType> = new Set(["pie"] as const);
const notAxisChartSubtypeSet: Set<string> = new Set(["polar"] as const);
export const echartsConfigOmitChildren = [
  "hidden",
  "selectedPoints",
  "onUIEvent",
  "mapInstance"
] as const;
type EchartsConfigProps = Omit<ChartCompPropsType, typeof echartsConfigOmitChildren[number]>;


export function isAxisChart(type: CharOptionCompType, subtype: string) {
  return !notAxisChartSet.has(type) && !notAxisChartSubtypeSet.has(subtype);
}

export function getSeriesConfig(props: EchartsConfigProps) {
  let visibleSeries = props.series.filter((s) => !s.getView().hide);
  if(props.chartConfig.subtype === "waterfall") {
    const seriesOn = visibleSeries[0];
    const seriesPlaceholder = visibleSeries[0];
    visibleSeries = [seriesPlaceholder, seriesOn];
  }
  const seriesLength = visibleSeries.length;
  return visibleSeries.map((s, index) => {
    if (isAxisChart(props.chartConfig.type, props.chartConfig.subtype)) {
      let encodeX: string, encodeY: string;
      const horizontalX = props.xAxisDirection === "horizontal";
      let itemStyle = props.chartConfig.itemStyle;
      // FIXME: need refactor... chartConfig returns a function with paramters
      if (props.chartConfig.type === "bar") {
        // barChart's border radius, depend on x-axis direction and stack state
        const borderRadius = horizontalX ? [2, 2, 0, 0] : [0, 2, 2, 0];
        if (props.chartConfig.stack && index === visibleSeries.length - 1) {
          itemStyle = { ...itemStyle, borderRadius: borderRadius };
        } else if (!props.chartConfig.stack) {
          itemStyle = { ...itemStyle, borderRadius: borderRadius };
        }

        if(props.chartConfig.subtype === "waterfall" && index === 0) {
          itemStyle = {
            borderColor: 'transparent',
            color: 'transparent'
          }
        }
      }
      if (horizontalX) {
        encodeX = props.xAxisKey;
        encodeY = s.getView().columnName;
      } else {
        encodeX = s.getView().columnName;
        encodeY = props.xAxisKey;
      }
      return {
        name: props.chartConfig.subtype === "waterfall" && index === 0?" ":s.getView().seriesName,
        columnName: props.chartConfig.subtype === "waterfall" && index === 0?" ":s.getView().columnName,
        selectedMode: "single",
        select: {
          itemStyle: {
            borderColor: "#000",
          },
        },
        encode: {
          x: encodeX,
          y: encodeY,
        },
        // each type of chart's config
        ...props.chartConfig,
        itemStyle: itemStyle,
        label: {
          ...props.chartConfig.label,
          ...(!horizontalX && { position: "outside" }),
        },
      };
    } else {
      const radiusAndCenter = getPieRadiusAndCenter(seriesLength, index, props.chartConfig);
      return {
        ...props.chartConfig,
        columnName: s.getView().columnName,
        radius: radiusAndCenter.radius,
        center: radiusAndCenter.center,
        name: s.getView().seriesName,
        selectedMode: "single",
        encode: {
          itemName: props.xAxisKey,
          value: s.getView().columnName,
        },
      };
    }
  });
}

// https://echarts.apache.org/en/option.html
export function getEchartsConfig(
  props: EchartsConfigProps,
  chartSize?: ChartSize,
  theme?: any,
): EChartsOptionWithMap {
  // axisChart
  const axisChart = isAxisChart(props.chartConfig.type, props.chartConfig.subtype);
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
  };
  if(props.chartConfig.race) {
    config = {
      ...config,
      // Disable init animation.
      animationDuration: 0,
      animationDurationUpdate: 2000,
      animationEasing: 'linear',
      animationEasingUpdate: 'linear',
    }
  }
  if (props.data.length <= 0) {
    // no data
    return {
      ...config,
      ...(axisChart ? noDataAxisConfig : noDataPieChartConfig),
    };
  }
  const yAxisConfig = props.yConfig();
  const seriesColumnNames = props.series
    .filter((s) => !s.getView().hide)
    .map((s) => s.getView().columnName);
  // y-axis is category and time, data doesn't need to aggregate
  let transformedData =
    yAxisConfig.type === "category" || yAxisConfig.type === "time" ? props.echartsOption.length && props.echartsOption || props.data : transformData(props.echartsOption.length && props.echartsOption || props.data, props.xAxisKey, seriesColumnNames);

  if(props.chartConfig.subtype === "waterfall") {
    config.legend = undefined;
    let sum = transformedData.reduce((acc, item) => {
      if(typeof item[seriesColumnNames[0]] === 'number') return acc + item[seriesColumnNames[0]];
      else return acc;
    }, 0)
    const total = sum;
    transformedData.map(d => {
      d[` `] = sum - d[seriesColumnNames[0]];
      sum = d[` `];
    })
    transformedData = [{[" "]: 0, [seriesColumnNames[0]]: total, [props.xAxisKey]: "Total"}, ...transformedData]
  }

  if(props.chartConfig.subtype === "polar") {
    config = {
      ...config,
      polar: {
        radius: [props.chartConfig.polarData.polarRadiusStart, props.chartConfig.polarData.polarRadiusEnd],
      },
      radiusAxis: {
        type: props.chartConfig.polarData.polarIsTangent?'category':undefined,
        data: props.chartConfig.polarData.polarIsTangent && props.chartConfig.polarData.labelData.length!==0?props.chartConfig.polarData.labelData:undefined,
        max: props.chartConfig.polarData.polarIsTangent?undefined:props.chartConfig.polarData.radiusAxisMax || undefined,
      },
      angleAxis: {
        type: props.chartConfig.polarData.polarIsTangent?undefined:'category',
        data: !props.chartConfig.polarData.polarIsTangent && props.chartConfig.polarData.labelData.length!==0?props.chartConfig.polarData.labelData:undefined,
        max: props.chartConfig.polarData.polarIsTangent?props.chartConfig.polarData.radiusAxisMax || undefined:undefined,
        startAngle: props.chartConfig.polarData.polarStartAngle,
        endAngle: props.chartConfig.polarData.polarEndAngle,
      },
    }
  }

  config = {
    ...config,
    dataset: [
      {
        source: transformedData,
        sourceHeader: false,
      },
    ],
    series: getSeriesConfig(props).map(series => ({
      ...series,
      encode: {
        ...series.encode,
        y: series.name,
      },
      itemStyle: {
        ...series.itemStyle,
        ...chartStyleWrapper(props?.chartStyle, theme?.chartStyle)
      },
      lineStyle: {
        ...chartStyleWrapper(props?.chartStyle, theme?.chartStyle)
      },
      data: transformedData.map((i: any) => i[series.columnName])
    })),
  };
  if (axisChart) {
    // pure chart's size except the margin around
    let chartRealSize;
    if (chartSize) {
      const rightSize =
        typeof gridPos.right === "number"
          ? gridPos.right
          : (chartSize.w * parseFloat(gridPos.right)) / 100.0;
      chartRealSize = {
        // actually it's self-adaptive with the x-axis label on the left, not that accurate but work
        w: chartSize.w - gridPos.left - rightSize,
        // also self-adaptive on the bottom
        h: chartSize.h - gridPos.top - gridPos.bottom,
        right: rightSize,
      };
    }
    const finalXyConfig = calcXYConfig(
      props.xConfig,
      yAxisConfig,
      props.xAxisDirection,
      transformedData.map((d) => d[props.xAxisKey]),
      chartRealSize
    );
    config = {
      ...config,
      // @ts-ignore
      xAxis: {
        ...finalXyConfig.xConfig,
        axisLabel: {
          ...styleWrapper(props?.xAxisStyle, theme?.xAxisStyle, 11)
        },
        data: finalXyConfig.xConfig.type === "category" && (props.xAxisData as []).length!==0?props?.xAxisData:transformedData.map((i: any) => i[props.xAxisKey]),
      },
      // @ts-ignore
      yAxis: {
        ...finalXyConfig.yConfig,
        axisLabel: {
          ...styleWrapper(props?.yAxisStyle, theme?.yAxisStyle, 11)
        },
        data: finalXyConfig.yConfig.type === "category" && (props.xAxisData as []).length!==0?props?.xAxisData:transformedData.map((i: any) => i[props.xAxisKey]),
      },
    };
    
    if(props.chartConfig.race) {
      config = {
        ...config,
        xAxis: {
          ...config.xAxis,
          animationDuration: 300,
          animationDurationUpdate: 300
        },
        yAxis: {
          ...config.yAxis,
          animationDuration: 300,
          animationDurationUpdate: 300
        },
      }
    }
  }
  // console.log("Echarts transformedData and config", transformedData, config);
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
