import {
  ChartCompPropsType,
  ChartSize,
  noDataBoxplotChartConfig,
} from "comps/boxplotChartComp/boxplotChartConstants";
import { EChartsOptionWithMap } from "../basicChartComp/reactEcharts/types";
import _ from "lodash";
import { googleMapsApiUrl } from "../basicChartComp/chartConfigs/chartUrls";
import parseBackground from "../../util/gradientBackgroundColor";
import {chartStyleWrapper, styleWrapper} from "../../util/styleWrapper";
// Define the configuration interface to match the original transform

interface AggregateConfig {
  resultDimensions: Array<{
    name: string;
    from: string;
    method?: string; // e.g., 'min', 'Q1', 'median', 'Q3', 'max'
  }>;
  groupBy: string;
}

// Custom transform function
function customAggregateTransform(params: {
  upstream: { source: any[] };
  config: AggregateConfig;
}): any[] {
  const { upstream, config } = params;
  const data = upstream.source;

  // Assume data is an array of arrays, with the first row as headers
  const headers = data[0];
  const rows = data.slice(1);

  // Find the index of the groupBy column
  const groupByIndex = headers.indexOf(config.groupBy);
  if (groupByIndex === -1) {
    return [];
  }

  // Group rows by the groupBy column
  const groups: { [key: string]: any[][] } = {};
  rows.forEach(row => {
    const key = row[groupByIndex];
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(row);
  });

  // Define aggregation functions
  const aggregators: {
    [method: string]: (values: number[]) => number;
  } = {
    min: values => Math.min(...values),
    max: values => Math.max(...values),
    Q1: values => percentile(values, 25),
    median: values => percentile(values, 50),
    Q3: values => percentile(values, 75),
  };

  // Helper function to calculate percentiles (Q1, median, Q3)
  function percentile(arr: number[], p: number): number {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const i = Math.floor(index);
    const f = index - i;
    if (i === sorted.length - 1) {
      return sorted[i];
    }
    return sorted[i] + f * (sorted[i + 1] - sorted[i]);
  }

  // Prepare output headers from resultDimensions
  const outputHeaders = config.resultDimensions.map(dim => dim.name);

  // Compute aggregated data for each group
  const aggregatedData: any[][] = [];
  for (const key in groups) {
    const groupRows = groups[key];
    const row: any[] = [];

    config.resultDimensions.forEach(dim => {
      if (dim.from === config.groupBy) {
        // Include the group key directly
        row.push(key);
      } else {
        // Find the index of the 'from' column
        const fromIndex = headers.indexOf(dim.from);
        if (fromIndex === -1) {
          return;
        }
        // Extract values for the 'from' column in this group
        const values = groupRows
          .map(r => parseFloat(r[fromIndex]))
          .filter(v => !isNaN(v));
        if (dim.method && aggregators[dim.method]) {
          // Apply the aggregation method
          row.push(aggregators[dim.method](values));
        } else {
          return;
        }
      }
    });

    aggregatedData.push(row);
  }

  // Return the transformed data with headers
  return [outputHeaders, ...aggregatedData];
}

export const echartsConfigOmitChildren = [
  "hidden",
  "selectedPoints",
  "onUIEvent",
  "mapInstance"
] as const;
type EchartsConfigProps = Omit<ChartCompPropsType, typeof echartsConfigOmitChildren[number]>;

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
      name: props.xAxisKey,
      nameLocation: 'middle',
      nameGap: 30,
      scale: true,
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
    dataset: [
      {
        id: 'raw',
        source: customAggregateTransform({upstream: {source: props.data as any[]}, config:{
          resultDimensions: [
            { name: 'min', from: props.xAxisKey, method: 'min' },
            { name: 'Q1', from: props.xAxisKey, method: 'Q1' },
            { name: 'median', from: props.xAxisKey, method: 'median' },
            { name: 'Q3', from: props.xAxisKey, method: 'Q3' },
            { name: 'max', from: props.xAxisKey, method: 'max' },
            { name: props.yAxisKey, from: props.yAxisKey }
          ],
          groupBy: props.yAxisKey
        }}),
      },
      {
        id: 'finaldataset',
        fromDatasetId: 'raw',
        transform: [
          {
            type: 'sort',
            config: {
              dimension: 'Q3',
              order: 'asc'
            }
          }
        ]
      }
    ],
  };

  if (props.data.length <= 0) {
    // no data
    return {
      ...config,
      ...noDataBoxplotChartConfig,
    };
  }
  const yAxisConfig = props.yConfig();
  // y-axis is category and time, data doesn't need to aggregate
  let transformedData = props.data;
  
  config = {
    ...config,
    series: [{
      name: props.xAxisKey,
      type: 'boxplot',
      datasetId: 'finaldataset',
      encode: {
        x: ['min', 'Q1', 'median', 'Q3', 'max'],
        y: props.yAxisKey,
        itemName: [props.yAxisKey],
        tooltip: ['min', 'Q1', 'median', 'Q3', 'max']
      },
      itemStyle: {
        color: '#b8c5f2',
        ...chartStyleWrapper(props?.chartStyle, theme?.chartStyle)
      },
    }],
  };
  if(config.series[0].itemStyle.borderWidth === 0) config.series[0].itemStyle.borderWidth = 1;

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
