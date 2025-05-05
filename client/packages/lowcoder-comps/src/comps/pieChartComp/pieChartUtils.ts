import {
  CharOptionCompType,
  ChartCompPropsType,
  ChartSize,
  noDataAxisConfig,
  noDataPieChartConfig,
} from "comps/pieChartComp/pieChartConstants";
import { getPieRadiusAndCenter } from "comps/basicChartComp/chartConfigs/pieChartConfig";
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
  let newVisibleSeries;
  if(props.chartConfig.subtype === "calendarPie") {
    const dataInRange = props.data.filter(item => item[props.xAxisKey].substr(0, 7) === props.chartConfig.range);
    newVisibleSeries = dataInRange.map(data => {
      return {
        data: visibleSeries.map(s => ({name: s.seriesName, value: data[s.columnName]})),
        date: data[props.xAxisKey],
      }
    });
    visibleSeries = newVisibleSeries;
  }
  const seriesLength = visibleSeries.length;
  return visibleSeries.map((s, index) => {
    // pie
    const radiusAndCenter = getPieRadiusAndCenter(seriesLength, index, props.chartConfig);
    let config = {
      ...props.chartConfig,
      radius: radiusAndCenter.radius,
      center: radiusAndCenter.center,
      selectedMode: "single",
    };
    if(props.chartConfig.subtype !== "calendarPie") {
      config = {
        ...config,
        startAngle: s.startAngle,
        endAngle: s.endAngle,
        padAngle: s.padAngle,
        name: s.seriesName,
        label: {
          show: s.showLabel,
          position: s.labelPosition,
          alignTo: s.labelAlignTo,
          bleedMargin: s.labelBleedMargin,
        },
        labelLine: {
          length: s.labelLineLength,
          length2: s.labelLineLength2,
        },
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
      if(s.labelAlignTo === 'edge') {
        config.label.edgeDistance = s.labelEdgeDistance;
      }
      if(s.roseType !== "none") {
        config.roseType = s.roseType;
      }
      if(s.itemBg) {
        config.itemStyle = {
          color: {
            image: s.itemBg,
            repeat: 'repeat',
          }
        }
      }
      if(props.chartConfig.subtype !== 'doughnutPie') config.radius = s.radius;
      if(s.left!="" && s.top!="") {
        config.center = [s.left, s.top];
      }
      if(props.chartConfig.subtype === 'geoPie') config.coordinateSystem = 'geo';
    } else {
      config.data = s.data;
      config.center = s.date;
      config.radius = props.chartConfig.cellSize[0]*0.4;
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
  };
  if(props.chartConfig.subtype === "geoPie") {
    config.geo = {
      map: 'jsonmap',
      roam: true,
      itemStyle: {
        areaColor: '#e7e8ea'
      }
    };
  }

  //calendar pie
  if(props.chartConfig.subtype === "calendarPie") {
    config.calendar = {
      top: 'middle',
      left: 'center',
      orient: 'vertical',
      cellSize: props.chartConfig.cellSize,
      yearLabel: {
        show: false,
        fontSize: 30
      },
      dayLabel: {
        margin: 20,
        firstDay: 1,
        nameMap: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      monthLabel: {
        show: false
      },
      range: [props.chartConfig.range]
    }
  }
  //

  if (props.data.length <= 0) {
    // no data
    return {
      ...config,
      ...noDataPieChartConfig,
    };
  }
  const yAxisConfig = props.yConfig();
  const seriesColumnNames = props.series
    .filter((s) => !s.getView().hide)
    .map((s) => s.getView().columnName);
  // y-axis is category and time, data doesn't need to aggregate
  let transformedData =
    yAxisConfig.type === "category" || yAxisConfig.type === "time" ? props.data : transformData(props.data, props.xAxisKey, seriesColumnNames);

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
    })),
  };
  if(props.chartConfig.subtype === "calendarPie") {
    config.series = [
      {
        id: 'label',
        type: 'scatter',
        coordinateSystem: 'calendar',
        symbolSize: 0,
        label: {
          show: true,
          formatter: function (params) {
            return params.value[1];
          },
          offset: [-props.chartConfig.cellSize[0] / 2 + 10, -props.chartConfig.cellSize[1] / 2 + 10],
          fontSize: 14
        },
        data: Array.from({ length: 31 }, (_, index) => index + 1).map(d => ([props.chartConfig.range + "-" + (d<10?`0${d}`:d), d]))
      },
      ...config.series,
    ]
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
