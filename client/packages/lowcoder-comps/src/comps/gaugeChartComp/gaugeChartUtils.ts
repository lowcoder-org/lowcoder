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

    const basic={
      "title": {
        "text": props.echartsTitle,
        'top': props.echartsLegendConfig.top === 'bottom' ?'top':'bottom',
        "left":props.echartsTitleConfig.top,
        "textStyle": {
          ...styleWrapper(props?.titleStyle, theme?.titleStyle)
        }
      },
      "backgroundColor": parseBackground( props?.chartStyle?.background || theme?.chartStyle?.backgroundColor || "#FFFFFF"),
      "tooltip": props.tooltip&&{
        "trigger": "item",
        "formatter": "{a} <br/>{b} : {c}%"
      },
      "color": props?.echartsData?.data?.map(data => data.color) || props?.echartsOption?.data?.map(data => data.color),
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
            "icon": props?.pointerIcon,
            "offsetCenter": [0, `${-Number(props.pointer_Y)}%`]
          },
          "axisTick": {
            "length": props.axisTickLength,
            "lineStyle": {
              "color": props.axisTickColor,
              "width": props.axisTickWidth
            }
          },
          "splitLine": {
            "length": Number(props.axisTickLength) * 1.5,
            "lineStyle": {
              "color": props.axisTickColor,
              "width": Number(props.axisTickWidth) * 1.5
            }
          },
          "itemStyle": {
            "opacity": props?.opacity,
            ...chartStyleWrapper(props?.chartStyle,theme?.chartStyle),
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
            "distance": Number(props?.progressBarWidth) + Number(props.axisLabelDistance),
            ...styleWrapper(props?.axisLabelStyle, theme?.axisLabelStyle, 12, "#000000"),
          },
          'detail': {
            formatter: props?.echartsData?.data?.map(data => data.formatter)[0] || props?.echartsOption?.data?.map(data => data.formatter)[0],
            ...styleWrapper(props?.legendStyle, theme?.legendStyle, 16, "#000000"),
          },
          "label": {
            "show": props.label,
            "position": props.echartsLabelConfig.top,
          },
          "data":
            props?.echartsData.length !== 0 && props?.echartsData?.map(item => ({
            "value": item.value,
            "name": item.name,
            title: {
              ...styleWrapper(props?.labelStyle, theme?.labelStyle, 18, "#000000"),
            }}))
              ||
            props.echartsOption.data?.map(item => ({
              "value": item.value,
              "name": item.name,
              title: {
                ...styleWrapper(props?.labelStyle, theme?.labelStyle, 18, "#000000"),
              }}))
        }
      ]
    }

    const { progress, ...basicSeries } = basic.series[0];
    const { color, ...basicStyle } = basic;

    let stageGaugeOpt = {
      ...basicStyle,
        series: [
          {
            ...basicSeries,
            axisLine: {
              lineStyle: {
                width: props.stageProgressBarWidth,
                color: props?.stageGaugeData?.data?.map(data => data.color)[0] || props?.stageGaugeOption?.data?.map(data => data.color)[0]
              }
            },
            pointer: {
              ...basicSeries.pointer,
              itemStyle: {
                color: 'auto',
              }
            },
            axisTick: {
              distance: -Number(props.stageProgressBarWidth),
              length: props.axisTickLength,
              lineStyle: {
                color: props.stageAxisTickColor,
                width: props.axisTickWidth
              }
            },
            splitLine: {
              distance: -Number(props.stageProgressBarWidth),
              length: props.stageProgressBarWidth,
              lineStyle: {
                color: props.stageAxisTickColor,
                width: Number(props.axisTickWidth) * 1.5
              }
            },
            axisLabel: {
              distance: Number(props?.stageProgressBarWidth) + Number(props.axisLabelDistance),
              ...styleWrapper(props?.axisLabelStyle, theme?.axisLabelStyle, 13, "inherit"),
            },
            detail: {
              valueAnimation: true,
              formatter: props?.stageGaugeData?.data?.map(data => data.formatter)[0] || props?.stageGaugeOption?.data?.map(data => data.formatter)[0],
              ...styleWrapper(props?.legendStyle, theme?.legendStyle, 20, "inherit"),
            },
            data: [
              {
                value: props?.stageGaugeData.length !== 0 && props?.stageGaugeData?.map(data => data.value) || props?.stageGaugeOption?.data?.map(data => data.value)
              }
            ]
          }
        ]
      }

    let gradeGaugeOpt = {
      ...basicStyle,
        series: [
          {
            ...basicSeries,
            type: 'gauge',
            axisLine: {
              lineStyle: {
                width: props.progressBarWidth,
                color:props?.gradeGaugeData?.data?.map(data => data.color)[0] || props?.gradeGaugeOption?.data?.map(data => data.color)[0]
              }
            },
            progress: {
              width: props?.stageProgressBarWidth,
            },
            pointer: {
              icon: props.gradePointerIcon || 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
              length: props.gradeGaugePointerLength, // slightly shorter pointer
              width: props.gradeGaugePointerWidth,     // slightly narrower pointer
              offsetCenter: [0, `-${props.gradeGaugePointer_Y}%`],
              itemStyle: {
                color: 'auto'
              }
            },
            axisTick: {
              length: props.axisTickLength,
              lineStyle: {
                color: props.gradeAxisTickColor || 'auto',
                width: props.axisTickWidth
              }
            },
            splitLine: {
              length: Number(props.axisTickLength) * 2,
              lineStyle: {
                color: props.gradeAxisTickColor || 'auto',
                width: Number(props.axisTickWidth) * 1.5
              }
            },
            axisLabel: {
              show: false
            },
            title: {
              offsetCenter: [0, '0%'],
              ...styleWrapper(props?.labelStyle, theme?.labelStyle, 16),
            },
            detail: {
              offsetCenter: [0, '25%'],
              valueAnimation: true,
              formatter: props?.gradeGaugeData?.data?.map(data => data.formatter)[0] || props?.gradeGaugeOption?.data?.map(data => data.formatter)[0],
              ...styleWrapper(props?.legendStyle, theme?.legendStyle, 20, 'inherit'),
            },
            data: [
              {
                value: props?.gradeGaugeData.length !== 0 && props?.gradeGaugeData?.map(data => data.value) || props?.gradeGaugeOption?.data?.map(data => data.value),
                name: props?.gradeGaugeData.length !== 0 && props?.gradeGaugeData?.map(data => data.name)[0] || props?.gradeGaugeOption?.data?.map(data => data.name)[0],
              }
            ]
          }
        ]
    }

    let multiGaugeOpt = {
      ...basicStyle,
      series: [
        {
          ...basicSeries,
          type: 'gauge',
          anchor: {
            show: true,
            showAbove: true,
            size: Number(props?.pointerWidth) * 1.5,
            itemStyle: {
              color: props?.multiTitleGaugeData?.data && props?.multiTitleGaugeData?.data[0]["value"].slice(-1)[0] || props?.multiTitleGaugeOption?.data && props?.multiTitleGaugeOption?.data[0]["value"].slice(-1)[0]
            }
          },
          progress: {
            overlap: true,
            ...progress
          },

          data:
            props?.multiTitleGaugeOption?.data && props?.multiTitleGaugeOption?.data[0]?.value?.map((item, index) => ({
              value: props?.multiTitleGaugeData.length !== 0 && props?.multiTitleGaugeData[index] || item.value,
              name: item.title,
              title: {
                offsetCenter: item.titlePosition
              },
              detail: {
                offsetCenter: item.valuePosition,

              },
              itemStyle: {
                color: item.color
              },
              pointer: {
                itemStyle: {
                  color: item.color
                }
              }
            })),

          title: {
            ...styleWrapper(props?.labelStyle, theme?.labelStyle, 16),
          },
          pointer: {
            ...basicSeries.pointer,
            icon: props?.multiTitlePointerIcon,
          },
          detail: {
            ...styleWrapper(props?.legendStyle, theme?.legendStyle, 16, '#ffffff', 0, 'inherit'),
            "width": props?.legendStyle?.detailSize?.split('px')[0] || theme?.legendStyle?.detailSize && theme?.legendStyle?.detailSize.split('px')[0] || 40,
            "height": props?.legendStyle?.detailSize?.split('px')[1] || theme?.legendStyle?.detailSize && theme?.legendStyle?.detailSize.split('px')[1] || 20,
            formatter: props?.multiTitleGaugeData?.data?.map(data => data.formatter)[0] || props?.multiTitleGaugeOption?.data?.map(data => data.formatter)[0],
          }
        }
      ]
    }

    let temperatureGaugeOpt = {
      ...basicStyle,
      series: [
        {
          ...basicSeries,
          radius: `${props.temperatureRadius}%`,
          itemStyle: {
            color: props?.temperatureGaugeData?.data?.map(data => data.color)[0] || props?.temperatureGaugeOption?.data?.map(data => data.color)[0]
          },
          progress: {
            show: true,
            width: props.temperatureProgressBarWidth
          },
          pointer: {
            show: false
          },
          axisLine: {
            lineStyle: {
              width: props.temperatureProgressBarWidth
            }
          },
          axisTick: {
            distance: -Number(props.temperatureProgressBarWidth) - 15,
            length: -Number(props.axisTickLength),
            lineStyle: {
              color: props.gradeAxisTickColor || '#999',
              width: props.axisTickWidth
            }
          },
          splitLine: {
            distance: -Number(props.temperatureProgressBarWidth) -15,
            length: -Number(props.axisTickLength) * 2,
            lineStyle: {
              color: props.gradeAxisTickColor || '#999',
              width: Number(props.axisTickWidth) * 1.5
            }
          },
          axisLabel: {
            distance: Number(props?.temperatureProgressBarWidth) - Number(props.temperatureAxisLabelDistance),
            ...styleWrapper(props?.axisLabelStyle, theme?.axisLabelStyle, 20, "#999"),
          },
          detail: {
            valueAnimation: true,
            offsetCenter: [0, '-15%'],
            formatter: props?.temperatureGaugeData?.data?.map(data => data.formatter)[0] || props?.temperatureGaugeOption?.data?.map(data => data.formatter)[0],
            ...styleWrapper(props?.legendStyle, theme?.legendStyle, 30, 'inherit'),
          },
          data: [
            {
              value: props?.temperatureGaugeData.length !== 0 && props?.temperatureGaugeData?.map(data => data.value) || props?.temperatureGaugeOption?.data?.map(data => data.value)
            }
          ]
        },
        {
          type: 'gauge',
          center: [`${props?.position_x}%`, `${props?.position_y}%`],
          startAngle: props?.startAngle,
          endAngle: props?.endAngle,
          splitNumber: props?.splitNumber,
          min: props?.min,
          max: props?.max,
          radius: `${props.temperatureRadius}%`,
          itemStyle: {
            color: props?.temperatureGaugeData?.data?.map(data => data.borderColor)[0] || props?.temperatureGaugeOption?.data?.map(data => data.borderColor)[0]
          },
          progress: {
            show: true,
            width: 6
          },
          pointer: {
            show: false
          },
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            show: false
          },
          axisLabel: {
            show: false
          },
          detail: {
            show: false
          },
          data: [
            {
              value: props?.temperatureGaugeData?.data?.map(data => data.value) || props?.temperatureGaugeOption?.data?.map(data => data.value)
            }
          ]
        }
      ]
    }

    let ringGaugeOpt = {
      ...basicStyle,
      series: [
        {
          ...basicSeries,
          startAngle: 90,
          endAngle: 450,
          type: 'gauge',
          pointer: {
            show: false
          },
          progress: {
            roundCap: props?.roundCap,
            show: true,
            width: props?.ringProgressBarWidth,
            overlap: false,
            clip: false,
          },
          axisLine: {
            roundCap: props?.roundCap,
            lineStyle: {
              width: props?.ringProgressBarWidth
            }
          },
          splitLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            show: false
          },
          data:
            props?.ringGaugeOption?.data && props?.ringGaugeOption?.data[0]?.value.map((item, index) => ({
            value: props?.ringGaugeData.length !== 0 && props?.ringGaugeData[index] || item.value,
          name: item.title,
          title: {
            offsetCenter: item.titlePosition
          },
          detail: {
            offsetCenter: item.valuePosition
          },
          itemStyle: {
            color: item.color
          },
          pointer: {
            itemStyle: {
              color: item.color
            }
          }
        })),
          title: {
            ...styleWrapper(props?.labelStyle, theme?.labelStyle, 16),
          },
          detail: {
            ...styleWrapper(props?.legendStyle, theme?.legendStyle, 16, 'inherit', 1, ''),
            "width": props?.legendStyle?.detailSize?.split('px')[0] || theme?.legendStyle?.detailSize && theme?.legendStyle?.detailSize.split('px')[0] || 50,
            "height": props?.legendStyle?.detailSize?.split('px')[1] || theme?.legendStyle?.detailSize && theme?.legendStyle?.detailSize.split('px')[1] || 20,
            formatter: props?.ringGaugeData?.data?.map(data => data.formatter)[0] || props?.ringGaugeOption?.data?.map(data => data.formatter)[0],
          }
        }
      ]
    }

    let barometerGaugeOpt = {
      ...basic,
      series:
        props?.barometerGaugeOption?.data && [
          {
            ...basicSeries,
            type: 'gauge',
            min: props?.barometerGaugeOption?.data[0]?.outline?.period[0],
            max: props?.barometerGaugeOption?.data[0]?.outline?.period[1],
            center: [`${props?.position_x}%`, `${props?.position_y}%`],
            splitNumber: props?.barometerGaugeOption?.data[0]?.outline?.splitNumber,
            radius: props?.barometerGaugeOption?.data[0]?.outline?.radius,
            axisLine: {
              lineStyle: {
                color: [[1, props?.barometerGaugeOption?.data[0]?.outline?.color]],
                width: props?.barometerGaugeOption?.data[0]?.outline?.progressBarWidth
              }
            },
            splitLine: {
              distance: -Number(props?.barometerGaugeOption?.data[0]?.outline?.progressBarWidth),
              length: -Number(props?.barometerGaugeOption?.data[0]?.outline?.axisTickLength) * 2,
              lineStyle: {
                color: props?.barometerGaugeOption?.data[0]?.outline?.color,
                width: Number(props?.barometerGaugeOption?.data[0]?.outline?.axisTickWidth) * 1.5
              }
            },
            axisTick: {
              distance: -Number(props?.barometerGaugeOption?.data[0]?.outline?.progressBarWidth),
              length: -Number(props?.barometerGaugeOption?.data[0]?.outline?.axisTickLength),
              lineStyle: {
                color: props?.barometerGaugeOption?.data[0]?.outline?.color,
                width: props?.barometerGaugeOption?.data[0]?.outline?.axisTickWidth
              }
            },
            axisLabel: {
              distance: Number(props?.barometerGaugeOption?.data[0]?.outline?.progressBarWidth) - 20,
              ...styleWrapper(props?.axisLabelStyle, theme?.axisLabelStyle, 13, '#c80707')
            },
            pointer: {
              ...basicSeries.pointer,
              icon: props?.barometerPointerIcon,
              length: `${props?.barometerPointerLength}%`,
              width: props?.barometerPointerWidth,
              offsetCenter: [0, `${-Number(props.barometerPointer_Y)}%`],
              itemStyle: {
                color: props?.barometerGaugeOption?.data[0]?.inline?.color
              }
            },
            anchor: {
              show: true,
              size: 10,
              itemStyle: {
                borderColor: '#000',
                borderWidth: 1
              }
            },
            detail: {
              valueAnimation: true,
              precision: 2,        // Increase precision or keep as is
              ...styleWrapper(props?.legendStyle, theme?.legendStyle, 16),
              offsetCenter: [0, '40%'],
              formatter: props?.barometerGaugeOption?.data?.map(data => data.formatter)[0],
            },
            title: {
              offsetCenter: [0, '-40%'],  // Adjust title placement for smaller chart
              ...styleWrapper(props?.labelStyle, theme?.labelStyle, 13)
            },
            data: [
              {
                value: props?.barometerGaugeData.length !== 0 && props?.barometerGaugeData[0]?.value || props?.barometerGaugeOption?.data[0]?.value,
                name: props?.barometerGaugeData.length !== 0 && props?.barometerGaugeData[0]?.name || props?.barometerGaugeOption?.data[0]?.name,
              }
            ]
          },
          {
            ...basicSeries,
            type: 'gauge',
            min: props?.barometerGaugeOption?.data[0]?.inline?.period[0],
            max: props?.barometerGaugeOption?.data[0]?.inline?.period[1],
            center: [`${props?.position_x}%`, `${props?.position_y}%`],
            splitNumber: props?.barometerGaugeOption?.data[0]?.inline?.splitNumber,
            radius: props?.barometerGaugeOption?.data[0]?.inline?.radius,
            anchor: {
              show: true,
              size: 6,
              itemStyle: {
                color: '#000'
              }
            },
            axisLine: {
              lineStyle: {
                color: [[1, props?.barometerGaugeOption?.data[0]?.inline?.color]],
                width: props?.barometerGaugeOption?.data[0]?.inline?.progressBarWidth
              }
            },
            splitLine: {
              distance: -2,          // Adjust spacing
              length: Number(props?.barometerGaugeOption?.data[0]?.inline?.axisTickLength) * 2,
              lineStyle: {
                color: props?.barometerGaugeOption?.data[0]?.inline?.color,
                width: Number(props?.barometerGaugeOption?.data[0]?.inline?.axisTickWidth) * 1.5
              }
            },
            axisTick: {
              distance: 0,
              length: props?.barometerGaugeOption?.data[0]?.inline?.axisTickLength,
              lineStyle: {
                color: props?.barometerGaugeOption?.data[0]?.inline?.color,
                width: props?.barometerGaugeOption?.data[0]?.inline?.axisTickWidth
              }
            },
            axisLabel: {
              distance: Number(props?.barometerGaugeOption?.data[0]?.inline?.progressBarWidth) + 6,
              ...styleWrapper(props?.axisLabelStyleOutline, theme?.axisLabelStyleOutline, 13, '#000'),
            },
            pointer: {
              show: false
            },
            title: {
              show: false
            },
            detail: {
              show: false
            }
          }
        ]

    }

    let clockGaugeOpt = {
      ...basicStyle,
      tooltip: false,
        series: [
          {
            ...basicSeries,
            name: 'hour',
            type: 'gauge',
            startAngle: 90,
            endAngle: -270,
            min: 0,
            max: 12,
            center: ['50%', '50%'],
            splitNumber: 12,
            clockwise: true,
            axisLine: {
              lineStyle: {
                width: props.progressBarWidth,
                color: props?.clockGaugeData?.data?.map(data => data.outlineColor)[0] ? [[1, props?.clockGaugeData?.data?.map(data => data.outlineColor)[0]]] : [[1, props?.clockGaugeOption?.data?.map(data => data.outlineColor)[0]]],
                shadowColor: props?.chartStyle?.chartShadowColor || theme?.chartStyle?.shadowColor,
                shadowBlur: props?.chartStyle?.chartBoxShadow?.split('px')[0] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[0],
                shadowOffsetX: props?.chartStyle?.chartBoxShadow?.split('px')[1] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[1],
                shadowOffsetY: props?.chartStyle?.chartBoxShadow?.split('px')[2] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[2]
              }
            },
            axisTick: {
              length: props.axisTickLength,
              lineStyle: {
                width: props.axisTickWidth,
                color: props.axisTickColor,
                shadowColor: props?.chartStyle?.chartShadowColor + "55" || theme?.chartStyle?.shadowColor + "55",
                shadowBlur: props?.chartStyle?.chartBoxShadow?.split('px')[0] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[0],
                shadowOffsetX: props?.chartStyle?.chartBoxShadow?.split('px')[1] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[1],
                shadowOffsetY: props?.chartStyle?.chartBoxShadow?.split('px')[2] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[2]
              }
            },
            splitLine: {
              length: Number(props.axisTickLength) * 2,
              lineStyle: {
                width: Number(props.axisTickWidth) * 1.5,
                color: props.axisTickColor,
                shadowColor: props?.chartStyle?.chartShadowColor + "55" || theme?.chartStyle?.shadowColor + "55",
                shadowBlur: props?.chartStyle?.chartBoxShadow?.split('px')[0] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[0],
                shadowOffsetX: props?.chartStyle?.chartBoxShadow?.split('px')[1] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[1],
                shadowOffsetY: props?.chartStyle?.chartBoxShadow?.split('px')[2] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[2]
              }
            },
            axisLabel: {
              ...styleWrapper(props?.axisLabelStyle, theme?.axisLabelStyle, 16, "#000000"),
              distance: Number(props?.progressBarWidth) + Number(props.axisLabelDistance),
              formatter: function (value) {
                if (value === 0) {
                  return '';
                }
                return value + '';
              }
            },
            pointer: {
              icon: props?.clockPointerIcon,
              width: props?.clockGaugeData?.data?.map(data => data.hour)[0]?.width || props?.clockGaugeOption?.data?.map(data => data.hour)[0]?.width,
              length: props?.clockGaugeData?.data?.map(data => data.hour)[0]?.length || props?.clockGaugeOption?.data?.map(data => data.hour)[0]?.length,
              offsetCenter: [0, '8%'],
              itemStyle: {
                color: props?.clockGaugeData?.data?.map(data => data.hour)[0]?.color || props?.clockGaugeOption?.data?.map(data => data.hour)[0]?.color,
                shadowColor: props?.chartStyle?.chartShadowColor + "55" || theme?.chartStyle?.shadowColor + "55",
                shadowBlur: props?.chartStyle?.chartBoxShadow?.split('px')[0] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[0],
                shadowOffsetX: props?.chartStyle?.chartBoxShadow?.split('px')[1] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[1],
                shadowOffsetY: props?.chartStyle?.chartBoxShadow?.split('px')[2] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[2]
              }
            },
            detail: {
              show: false
            },
            title: {
              offsetCenter: [0, '30%']
            },
            data: [
              {
                value: props?.clockGaugeData.length !== 0 && props?.clockGaugeData?.map(data => data.hour)[0]?.value || props?.clockGaugeOption?.data?.map(data => data.hour)[0]?.value
              }
            ]
          },
          {
            name: 'minute',
            type: 'gauge',
            startAngle: 90,
            endAngle: -270,
            min: 0,
            max: 60,
            clockwise: true,
            axisLine: {
              show: false
            },
            splitLine: {
              show: false
            },
            axisTick: {
              show: false
            },
            axisLabel: {
              show: false
            },
            pointer: {
              icon: props?.clockPointerIcon,
              width: props?.clockGaugeData?.data?.map(data => data.minute)[0]?.width || props?.clockGaugeOption?.data?.map(data => data.minute)[0]?.width,
              length: props?.clockGaugeData?.data?.map(data => data.minute)[0]?.length || props?.clockGaugeOption?.data?.map(data => data.minute)[0]?.length,
              offsetCenter: [0, '8%'],
              itemStyle: {
                color: props?.clockGaugeData?.data?.map(data => data.minute)[0]?.color || props?.clockGaugeOption?.data?.map(data => data.minute)[0]?.color,
                shadowColor: props?.chartStyle?.chartShadowColor + "55" || theme?.chartStyle?.shadowColor + "55",
                shadowBlur: props?.chartStyle?.chartBoxShadow?.split('px')[0] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[0],
                shadowOffsetX: props?.chartStyle?.chartBoxShadow?.split('px')[1] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[1],
                shadowOffsetY: props?.chartStyle?.chartBoxShadow?.split('px')[2] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[2]
              }
            },
            detail: {
              show: false
            },
            title: {
              offsetCenter: ['0%', '-40%']
            },
            data: [
              {
                value: props?.clockGaugeData.length !== 0 && props?.clockGaugeData?.map(data => data.minute)[0]?.value || props?.clockGaugeOption?.data?.map(data => data.minute)[0]?.value
              }
            ]
          },
          {
            name: 'second',
            type: 'gauge',
            startAngle: 90,
            endAngle: -270,
            min: 0,
            max: 60,
            animationEasingUpdate: 'bounceOut',
            clockwise: true,
            axisLine: {
              show: false
            },
            splitLine: {
              show: false
            },
            axisTick: {
              show: false
            },
            axisLabel: {
              show: false
            },
            pointer: {
              icon: props?.clockPointerIcon,
              width: props?.clockGaugeData?.data?.map(data => data.second)[0]?.width || props?.clockGaugeOption?.data?.map(data => data.second)[0]?.width,
              length: props?.clockGaugeData?.data?.map(data => data.second)[0]?.length || props?.clockGaugeOption?.data?.map(data => data.second)[0]?.length,
              offsetCenter: [0, '8%'],
              itemStyle: {
                color: props?.clockGaugeData?.data?.map(data => data.second)[0]?.color || props?.clockGaugeOption?.data?.map(data => data.second)[0]?.color,
                shadowColor: props?.chartStyle?.chartShadowColor + "55" || theme?.chartStyle?.shadowColor + "55",
                shadowBlur: props?.chartStyle?.chartBoxShadow?.split('px')[0] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[0],
                shadowOffsetX: props?.chartStyle?.chartBoxShadow?.split('px')[1] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[1],
                shadowOffsetY: props?.chartStyle?.chartBoxShadow?.split('px')[2] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[2]
              }
            },
            anchor: {
              show: true,
              size: props?.clockGaugeData?.data?.map(data => data.anchor)[0]?.size || props?.clockGaugeOption?.data?.map(data => data.anchor)[0]?.size,
              showAbove: true,
              itemStyle: {
                color: props?.clockGaugeData?.data?.map(data => data.anchor)[0]?.color || props?.clockGaugeOption?.data?.map(data => data.anchor)[0]?.color,
                shadowColor: props?.chartStyle?.chartShadowColor + "55" || theme?.chartStyle?.shadowColor + "55",
                shadowBlur: props?.chartStyle?.chartBoxShadow?.split('px')[0] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[0],
                shadowOffsetX: props?.chartStyle?.chartBoxShadow?.split('px')[1] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[1],
                shadowOffsetY: props?.chartStyle?.chartBoxShadow?.split('px')[2] || theme?.chartStyle?.boxShadow && theme?.chartStyle?.boxShadow?.split('px')[2]
              }
            },
            detail: {
              show: false
            },
            title: {
              offsetCenter: ['0%', '-40%']
            },
            data: [
              {
                value: props?.clockGaugeData.length !== 0 && props?.clockGaugeData?.map(data => data.second)[0]?.value || props?.clockGaugeOption?.data?.map(data => data.second)[0]?.value
              }
            ]
          }
        ]
    }

    const typeMap = {
      default: basic,
      stageGauge: stageGaugeOpt,
      gradeGauge: gradeGaugeOpt,
      temperatureGauge: temperatureGaugeOpt,
      multiGauge: multiGaugeOpt,
      ringGauge: ringGaugeOpt,
      barometerGauge: barometerGaugeOpt,
      clockGauge: clockGaugeOpt,
    };

    return typeMap[props.chartType] || basic;

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
