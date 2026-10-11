import {
  ChartCompPropsType,
  ChartSize,
  noDataLine3DChartConfig,
} from "comps/line3dChartComp/line3dChartConstants";
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
  let config: any = {
    backgroundColor: props.background,
    globe: {
      environment: props.environment,
      baseTexture: props.baseTexture,
      heightTexture: props.heightTexture,
      shading: 'realistic',
      realisticMaterial: {
        roughness: 0.2,
        metalness: 0
      },
      postEffect: {
        enable: true,
        depthOfField: {
          enable: false,
          focalDistance: 150
        }
      },
      displacementScale: 0.1,
      displacementQuality: 'high',
      temporalSuperSampling: {
        enable: true
      },
      light: {
        ambient: {
          intensity: 0.4
        },
        main: {
          intensity: 0.4
        },
      },
      viewControl: {
        autoRotate: false
      },
      silent: true
    },
    series: {
      type: 'lines3D',
      coordinateSystem: 'globe',
      blendMode: 'lighter',
      lineStyle: {
        width: props.lineStyleWidth,
        color: props.lineStyleColor,
        opacity: props.lineStyleOpacity
      },
      data: props.data,
      effect: {
        show: props.effectShow,
        trailWidth: props.effectWidth,
        trailLength: props.effectLength,
        trailOpacity: props.effectOpacity,
        trailColor: props.effectColor
      },
    }
  };
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
