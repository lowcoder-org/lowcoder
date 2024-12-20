import {
  CharOptionCompType,
  ChartCompPropsType,
  ChartSize,
  noDataAxisConfig,
  noDataPieChartConfig,
} from "comps/chartComp/chartConstants";
import { getPieRadiusAndCenter } from "comps/chartComp/chartConfigs/pieChartConfig";
import { EChartsOptionWithMap } from "../chartComp/reactEcharts/types";
import _ from "lodash";
import { chartColorPalette, isNumeric, JSONObject, loadScript } from "lowcoder-sdk";
import { calcXYConfig } from "comps/chartComp/chartConfigs/cartesianAxisConfig";
import Big from "big.js";
import { googleMapsApiUrl } from "../chartComp/chartConfigs/chartUrls";
import opacityToHex from "../../util/opacityToHex";
import parseBackground from "../../util/gradientBackgroundColor";

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
export const echartsConfigOmitChildren = [
  "hidden",
  "selectedPoints",
  "onUIEvent",
  "mapInstance"
] as const;
type EchartsConfigProps = Omit<ChartCompPropsType, typeof echartsConfigOmitChildren[number]>;

export function isAxisChart(type: CharOptionCompType) {
  return !notAxisChartSet.has(type);
}

export function getSeriesConfig(props: EchartsConfigProps) {
  const visibleSeries = props.series.filter((s) => !s.getView().hide);
  const seriesLength = visibleSeries.length;
  return visibleSeries.map((s, index) => {
    if (isAxisChart(props.chartConfig.type)) {
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
      }
      if (horizontalX) {
        encodeX = props.xAxisKey;
        encodeY = s.getView().columnName;
      } else {
        encodeX = s.getView().columnName;
        encodeY = props.xAxisKey;
      }
      return {
        name: s.getView().seriesName,
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
      // pie
      const radiusAndCenter = getPieRadiusAndCenter(seriesLength, index, props.chartConfig);
      return {
        ...props.chartConfig,
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

  if (props.mode === "json") {
    let opt={
      "title": {
        "text": props.echartsTitle,
        'top': props.echartsLegendConfig.top === 'bottom' ?'top':'bottom',
        "left":props.echartsTitleConfig.top,
        "textStyle": {
          "fontFamily": props?.titleStyle?.chartFontFamily || theme?.titleStyle?.fontFamily,
          "fontSize": props?.titleStyle?.chartTextSize || theme?.titleStyle?.fontSize || 18,
          "fontWeight": props?.titleStyle?.chartTextWeight || theme?.titleStyle?.fontWeight,
          "color": props?.titleStyle?.chartTextColor || theme?.titleStyle?.fontColor || "#000000",
          "fontStyle": props?.titleStyle?.chartFontStyle || theme?.titleStyle?.fontStyle,
          "textShadowColor": props?.titleStyle?.chartShadowColor || theme?.titleStyle?.shadowColor,
          "textShadowBlur": props?.titleStyle?.chartBoxShadow?.split('px')[0] || theme?.titleStyle?.boxShadow?.split('px')[0],
          "textShadowOffsetX": props?.titleStyle?.chartBoxShadow?.split('px')[1] || theme?.titleStyle?.boxShadow?.split('px')[1],
          "textShadowOffsetY": props?.titleStyle?.chartBoxShadow?.split('px')[2] || theme?.titleStyle?.boxShadow?.split('px')[2]
        },
      },
      "backgroundColor": parseBackground( props?.chartStyle?.background || theme?.chartStyle?.backgroundColor || "#FFFFFF"),
      "tooltip": props.tooltip&&{
        "trigger": "item",
        "formatter": "{a} <br/>{b} : {c}%"
      },
      "color": props?.echartsOption?.data?.map(data => data.color),
      "series": [
        {
          "name": props.echartsConfig.type,
          "type": props.echartsConfig.type,
          "radius": `${props.radius}%`,
          "left": `${props.left}%`,
          "top": props.top,
          "bottom": props.bottom,
          "width":`${props.left}%`,
          "min": props.min,
          "max": props.max,
          "gap": props.gap,
          "center": [`${props?.position_x}%`, `${props?.position_y}%`],
          "startAngle": props?.startAngle,
          "endAngle": props?.endAngle,
          "splitNumber": props?.splitNumber,
          "pointer": {
            "length": `${props?.pointerLength}%`,
            "width": props?.pointerWidth,
          },
          "itemStyle": {
            "opacity": props?.opacity,
            "borderColor": props?.chartStyle?.chartBorderColor || theme?.chartStyle?.borderColor,
            "borderWidth": props?.chartStyle?.chartBorderWidth || theme?.chartStyle?.borderWidth,
            "borderType": props?.chartStyle?.chartBorderStyle || theme?.chartStyle?.borderType,
            "borderRadius": props?.chartStyle?.chartBorderRadius || theme?.chartStyle?.borderRadius,
            "shadowColor": props?.chartStyle?.chartShadowColor || theme?.chartStyle?.shadowColor,
            "shadowBlur": props?.chartStyle?.chartBoxShadow?.split('px')[0] || theme?.chartStyle?.boxShadow?.split('px')[0],
            "shadowOffsetX": props?.chartStyle?.chartBoxShadow?.split('px')[1] || theme?.chartStyle?.boxShadow?.split('px')[1],
            "shadowOffsetY": props?.chartStyle?.chartBoxShadow?.split('px')[2] || theme?.chartStyle?.boxShadow?.split('px')[2]
          },
          "progress": {
            "roundCap": props.roundCap,
            "show": props?.progressBar,
            "width": props?.progressBarWidth
          },
          "axisLine": {
            "roundCap": props.roundCap,
            "lineStyle": {
              "width": props?.progressBarWidth
            }
          },
          "axisLabel": {
            "distance": Number(props?.progressBarWidth) + 10,
            "fontFamily": props?.axisLabelStyle?.chartFontFamily || theme?.axisLabelStyle?.fontFamily,
            "fontSize": props?.axisLabelStyle?.chartTextSize || theme?.axisLabelStyle?.fontSize || 12,
            "fontWeight": props?.axisLabelStyle?.chartTextWeight || theme?.axisLabelStyle?.fontWeight,
            "color": props?.axisLabelStyle?.chartTextColor || theme?.axisLabelStyle?.fontColor || "#000000",
            "fontStyle": props?.axisLabelStyle?.chartFontStyle || theme?.axisLabelStyle?.fontStyle,
            "textShadowColor": props?.axisLabelStyle?.chartShadowColor || theme?.axisLabelStyle?.shadowColor,
            "textShadowBlur": props?.axisLabelStyle?.chartBoxShadow?.split('px')[0] || theme?.axisLabelStyle?.boxShadow?.split('px')[0],
            "textShadowOffsetX": props?.axisLabelStyle?.chartBoxShadow?.split('px')[1] || theme?.axisLabelStyle?.boxShadow?.split('px')[1],
            "textShadowOffsetY": props?.axisLabelStyle?.chartBoxShadow?.split('px')[2] || theme?.axisLabelStyle?.boxShadow?.split('px')[2]
          },
          'detail': {
            "fontFamily": props?.legendStyle?.chartFontFamily || theme?.legendStyle?.fontFamily,
            "fontSize": props?.legendStyle?.chartTextSize || theme?.legendStyle?.fontSize || 16,
            "fontWeight": props?.legendStyle?.chartTextWeight || theme?.legendStyle?.fontWeight,
            "color": props?.legendStyle?.chartTextColor || theme?.legendStyle?.fontColor || "#000000",
            "fontStyle": props?.legendStyle?.chartFontStyle || theme?.legendStyle?.fontStyle,
            "textShadowColor": props?.legendStyle?.chartShadowColor || theme?.legendStyle?.shadowColor,
            "textShadowBlur": props?.legendStyle?.chartBoxShadow?.split('px')[0] || theme?.legendStyle?.boxShadow?.split('px')[0],
            "textShadowOffsetX": props?.legendStyle?.chartBoxShadow?.split('px')[1] || theme?.legendStyle?.boxShadow?.split('px')[1],
            "textShadowOffsetY": props?.legendStyle?.chartBoxShadow?.split('px')[2] || theme?.legendStyle?.boxShadow?.split('px')[2]
          },
          "label": {
            "show": props.label,
            "position": props.echartsLabelConfig.top,
          },
          "data": props.echartsOption.data?.map(item => ({
            "value": item.value,
            "name": item.name,
            title: {
              "fontFamily": props?.labelStyle?.chartFontFamily || theme?.labelStyle?.fontFamily,
              "fontSize": props?.labelStyle?.chartTextSize || theme?.labelStyle?.fontSize,
              "fontWeight": props?.labelStyle?.chartTextWeight || theme?.labelStyle?.fontWeight,
              "color": props?.labelStyle?.chartTextColor || theme?.labelStyle?.fontColor || "#000000",
              "fontStyle": props?.labelStyle?.chartFontStyle || theme?.labelStyle?.fontStyle,
              "textShadowColor": props?.labelStyle?.chartShadowColor || theme?.labelStyle?.shadowColor,
              "textShadowBlur": props?.labelStyle?.chartBoxShadow?.split('px')[0] || theme?.labelStyle?.boxShadow?.split('px')[0],
              "textShadowOffsetX": props?.labelStyle?.chartBoxShadow?.split('px')[1] || theme?.labelStyle?.boxShadow?.split('px')[1],
              "textShadowOffsetY": props?.labelStyle?.chartBoxShadow?.split('px')[2] || theme?.labelStyle?.boxShadow?.split('px')[2]
            }
          }))
        }
      ]
    }
    return props.echartsOption ? opt : {};

  }

  if(props.mode === "map") {
    const {
      mapZoomLevel,
      mapCenterLat,
      mapCenterLng,
      mapOptions,
      showCharts,
    } = props;

    const echartsOption = mapOptions && showCharts ? mapOptions : {};
    return {
      gmap: {
        center: [mapCenterLng, mapCenterLat],
        zoom: mapZoomLevel,
        renderOnMoving: true,
        echartsLayerZIndex: showCharts ? 2019 : 0,
        roam: true
      },
      ...echartsOption,
    }
  }
  // axisChart
  const axisChart = isAxisChart(props.chartConfig.type);
  const gridPos = {
    left: 20,
    right: props.legendConfig.left === "right" ? "10%" : 20,
    top: 50,
    bottom: 35,
  };
  let config: EChartsOptionWithMap = {
    title: { text: props.title, left: "center" },
    tooltip: {
      confine: true,
      trigger: axisChart ? "axis" : "item",
    },
    legend: props.legendConfig,
    grid: {
      ...gridPos,
      containLabel: true,
    },
  };
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
  const transformedData =
    yAxisConfig.type === "category" || yAxisConfig.type === "time"
      ? props.data
      : transformData(props.data, props.xAxisKey, seriesColumnNames);
  config = {
    ...config,
    dataset: [
      {
        source: transformedData,
        sourceHeader: false,
      },
    ],
    series: getSeriesConfig(props),
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
      xAxis: finalXyConfig.xConfig,
      // @ts-ignore
      yAxis: finalXyConfig.yConfig,
    };
  }
  // log.log("Echarts transformedData and config", transformedData, config);
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
