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

  const styleWrapper = (styleContainer: any, themeContainer: any, defaultFontSize=18, defaultFontColor='#000000') => {

    return {
      "fontFamily": styleContainer?.chartFontFamily || themeContainer?.fontFamily || 'Arial, sans-serif',
      "fontSize": styleContainer?.chartTextSize || themeContainer?.fontSize || defaultFontSize,
      "fontWeight": styleContainer?.chartTextWeight || themeContainer?.fontWeight,
      "color": styleContainer?.chartTextColor || themeContainer?.fontColor || defaultFontColor,
      "fontStyle": styleContainer?.chartFontStyle || themeContainer?.fontStyle,
      "textShadowColor": styleContainer?.chartShadowColor || themeContainer?.shadowColor,
      "textShadowBlur": styleContainer?.chartBoxShadow?.split('px')[0] || themeContainer?.boxShadow?.split('px')[0],
      "textShadowOffsetX": styleContainer?.chartBoxShadow?.split('px')[1] || themeContainer?.boxShadow?.split('px')[1],
      "textShadowOffsetY": styleContainer?.chartBoxShadow?.split('px')[2] || themeContainer?.boxShadow?.split('px')[2]
    }

  }

  if (props.mode === "json") {

    const basic={
      "title": {
        "text": props.echartsTitle,
        'top': props.echartsLegendConfig.top === 'bottom' ?'top':'bottom',
        "left":props.echartsTitleConfig.top,
        "textStyle": {
          ...styleWrapper(props?.titleStyle, theme?.titleStyle)
        }
        // "textStyle": {
        //   "fontFamily": props?.titleStyle?.chartFontFamily || theme?.titleStyle?.fontFamily,
        //   "fontSize": props?.titleStyle?.chartTextSize || theme?.titleStyle?.fontSize || 18,
        //   "fontWeight": props?.titleStyle?.chartTextWeight || theme?.titleStyle?.fontWeight,
        //   "color": props?.titleStyle?.chartTextColor || theme?.titleStyle?.fontColor || "#000000",
        //   "fontStyle": props?.titleStyle?.chartFontStyle || theme?.titleStyle?.fontStyle,
        //   "textShadowColor": props?.titleStyle?.chartShadowColor || theme?.titleStyle?.shadowColor,
        //   "textShadowBlur": props?.titleStyle?.chartBoxShadow?.split('px')[0] || theme?.titleStyle?.boxShadow?.split('px')[0],
        //   "textShadowOffsetX": props?.titleStyle?.chartBoxShadow?.split('px')[1] || theme?.titleStyle?.boxShadow?.split('px')[1],
        //   "textShadowOffsetY": props?.titleStyle?.chartBoxShadow?.split('px')[2] || theme?.titleStyle?.boxShadow?.split('px')[2]
        // },
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
            "icon": props?.pointerIcon,
            "offsetCenter": [0, `-${props.pointer_Y}%`],
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

    const { progress, ...basicSeries } = basic.series[0];
    const { color, ...basicStyle } = basic;

    let stageGaugeOpt = {
      ...basicStyle,
        series: [
          {
            ...basicSeries,
            type: 'gauge',
            axisLine: {
              lineStyle: {
                width: props.progressBarWidthStage,
                color: [
                  props.stageGaugeProgressBarColor1 && props.stageGaugeProgressBarInterval1 ? [props.stageGaugeProgressBarInterval1 || 0.3, props.stageGaugeProgressBarColor1 || "#67e0e3"] : [],
                  props.stageGaugeProgressBarColor2 && props.stageGaugeProgressBarInterval2 ? [props.stageGaugeProgressBarInterval2 || 0.7, props.stageGaugeProgressBarColor2 || "#37a2da"] : [],
                  props.stageGaugeProgressBarColor3 && props.stageGaugeProgressBarInterval3 ? [props.stageGaugeProgressBarInterval3 || 1, props.stageGaugeProgressBarColor3 || "#fd666d"] : [],
                ]
              }
            },
            pointer: {
              ...basicSeries.pointer,
              itemStyle: {
                color: 'auto',
              }
            },
            axisTick: {
              distance: -Number(props.progressBarWidthStage),
              length: props.axisTickLength,
              lineStyle: {
                color: props.axisTickColorStage,
                width: props.axisTickWidth
              }
            },
            splitLine: {
              distance: -Number(props.progressBarWidthStage),
              length: props.progressBarWidthStage,
              lineStyle: {
                color: props.axisTickColorStage,
                width: Number(props.axisTickWidth) * 1.5
              }
            },
            axisLabel: {
              color: 'inherit',
              distance: Number(props.progressBarWidthStage) + 10,
              fontSize: 13
            },
            detail: {
              valueAnimation: true,
              formatter: props?.stageGaugeOption?.data?.map(data => data.formatter)[0],
              fontFamily: props?.legendStyle?.chartFontFamily || theme?.legendStyle?.fontFamily,
              fontSize: props?.legendStyle?.chartTextSize || theme?.legendStyle?.fontSize || 20,
              fontWeight: props?.legendStyle?.chartTextWeight || theme?.legendStyle?.fontWeight,
              color: props?.legendStyle?.chartTextColor || theme?.legendStyle?.fontColor || 'inherit',
              fontStyle: props?.legendStyle?.chartFontStyle || theme?.legendStyle?.fontStyle,
              textShadowColor: props?.legendStyle?.chartShadowColor || theme?.legendStyle?.shadowColor,
              textShadowBlur: props?.legendStyle?.chartBoxShadow?.split('px')[0] || theme?.legendStyle?.boxShadow?.split('px')[0],
              textShadowOffsetX: props?.legendStyle?.chartBoxShadow?.split('px')[1] || theme?.legendStyle?.boxShadow?.split('px')[1],
              textShadowOffsetY: props?.legendStyle?.chartBoxShadow?.split('px')[2] || theme?.legendStyle?.boxShadow?.split('px')[2]
            },
            data: [
              {
                value: props?.stageGaugeOption?.data?.map(data => data.value)
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
                width: props.progressBarWidth, // slightly thinner line for smaller gauge
                color: [
                  [props.gradeGaugeProgressBarInterval1, props.stageGaugeProgressBarColor1],
                  [props.gradeGaugeProgressBarInterval2, props.stageGaugeProgressBarColor2],
                  [props.gradeGaugeProgressBarInterval3, props.stageGaugeProgressBarColor3],
                  [props.gradeGaugeProgressBarInterval4, props.stageGaugeProgressBarColor4]
                ]
              }
            },
            pointer: {
              icon: props.pointerIcon || 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
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
                color: props.axisTickColorGrade || 'auto',
                width: props.axisTickWidth
              }
            },
            splitLine: {
              length: Number(props.axisTickLength) * 2,
              lineStyle: {
                color: props.axisTickColorGrade || 'auto',
                width: Number(props.axisTickWidth) * 1.5
              }
            },
            axisLabel: {
              show: false
            },
            title: {
              offsetCenter: [0, '-10%'],
              ...styleWrapper(props?.labelStyle, theme?.labelStyle, 16),
            },
            detail: {
              offsetCenter: [0, '-35%'],
              valueAnimation: true,
              formatter: function (value) {
                return value;
              },
              ...styleWrapper(props?.legendStyle, theme?.legendStyle, 20, 'inherit'),
            },
            data: [
              {
                value: props?.gradeGaugeOption?.data?.map(data => data.value),
                name: props?.gradeGaugeOption?.data?.map(data => data.name)[0],
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
          pointer: {
            ...basicSeries.pointer,
            icon: props.pointerIcon || 'path://M2.9,0.7L2.9,0.7c1.4,0,2.6,1.2,2.6,2.6v115c0,1.4-1.2,2.6-2.6,2.6l0,0c-1.4,0-2.6-1.2-2.6-2.6V3.3C0.3,1.9,1.4,0.7,2.9,0.7z',
            offsetCenter: [0, '8%']
          },
          progress: {
            show: true,
            overlap: true,
            roundCap: true
          },
          axisLine: {
            roundCap: true
          },

          data: props.multiTitleGaugeOption.data[0].value.map(item => ({
            value: item.value,
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
            width: 30,
            height: 12,
            ...styleWrapper(props?.legendStyle, theme?.legendStyle, 16, '#ffffff'),
            backgroundColor: 'inherit',
            formatter: props?.multiTitleGaugeOption?.data?.map(data => data.formatter)[0],
          }
        }
      ]
    }

    let temperatureGaugeOpt = {
      ...basicStyle,
      series: [
        {
          ...basicSeries,
          radius: `${props.radiusTemperature}%`,
          itemStyle: {
            color: props?.temperatureGaugeOption?.data?.map(data => data.color)[0]
          },
          progress: {
            show: true,
            width: props.progressBarWidthTemperature
          },
          pointer: {
            show: false
          },
          axisLine: {
            lineStyle: {
              width: props.progressBarWidthTemperature
            }
          },
          axisTick: {
            length: props.axisTickLength,
            distance: -Number(props.progressBarWidthTemperature) - 10,
            lineStyle: {
              color: props.axisTickColorGrade || 'auto',
              width: props.axisTickWidth
            }
          },
          splitLine: {
            distance: -Number(props.progressBarWidthTemperature) - 10 - Number(props.axisTickLength),
            length: Number(props.axisTickLength) * 2,
            lineStyle: {
              color: props.axisTickColorGrade || 'auto',
              width: Number(props.axisTickWidth) * 1.5
            }
          },
          axisLabel: {
            distance: -Number(props.axisLabelDistance),
            ...styleWrapper(props?.axisLabelStyle, theme?.axisLabelStyle, 20, "#999"),
          },
          detail: {
            valueAnimation: true,
            offsetCenter: [0, '-15%'],
            formatter: props?.temperatureGaugeOption?.data?.map(data => data.formatter)[0],
            ...styleWrapper(props?.legendStyle, theme?.legendStyle, 40, 'inherit'),
          },
          data: [
            {
              value: props?.temperatureGaugeOption?.data?.map(data => data.value)
            }
          ]
        },
        {
          type: 'gauge',
          // center: ['50%', '70%'],
          // radius: '80%',            // Match the same radius
          // startAngle: 200,
          // endAngle: -20,
          // min: 0,
          // max: 60,
          center: [`${props?.position_x}%`, `${props?.position_y}%`],
          startAngle: props?.startAngle,
          endAngle: props?.endAngle,
          splitNumber: props?.splitNumber,
          min: props?.min,
          max: props?.max,
          radius: `${props.radiusTemperature}%`,
          itemStyle: {
            color: props?.temperatureGaugeOption?.data?.map(data => data.borderColor)[0]
          },
          progress: {
            show: true,
            width: 6                // Reduced from 8
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
              value: props?.temperatureGaugeOption?.data?.map(data => data.value)
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
            show: true,
            overlap: false,
            roundCap: true,
            clip: false,
            itemStyle: {
              borderWidth: 1,
              borderColor: 'inherit'
            }
          },
          axisLine: {
            lineStyle: {
              width: 20              // Reduced from 40
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
          data: props.ringGaugeOption.data[0].value.map(item => ({
            value: item.value,
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
            width: 40,
            height: 12,
            borderRadius: 20,
            borderWidth: 1,
            ...styleWrapper(props?.legendStyle, theme?.legendStyle, 16, '#000000'),
            // backgroundColor: 'inherit',
            formatter: props?.multiTitleGaugeOption?.data?.map(data => data.formatter)[0],
          }
        }
      ]
    }

    let barometerGaugeOpt = {
      ...basic,
      series: [
        {
          type: 'gauge',
          min: 0,
          max: 100,
          center: ['50%', '60%'],
          splitNumber: 10,
          radius: '70%',       // Reduced from 80% to fit a smaller canvas
          axisLine: {
            lineStyle: {
              color: [[1, '#f00']],
              width: 2         // Reduced line width
            }
          },
          splitLine: {
            distance: -12,     // Reduced from -18
            length: 10,        // Reduced from 18
            lineStyle: {
              color: '#f00',
              width: 2         // Thinner line
            }
          },
          axisTick: {
            distance: -8,      // Reduced from -12
            length: 6,         // Reduced from 10
            lineStyle: {
              color: '#f00',
              width: 1
            }
          },
          axisLabel: {
            distance: -30,     // Reduced from -50 to bring labels closer
            color: '#f00',
            fontSize: 14       // Reduced from 25
          },
          anchor: {
            show: true,
            size: 14,          // Reduced from 20
            itemStyle: {
              borderColor: '#000',
              borderWidth: 1    // Reduced border width
            }
          },
          pointer: {
            offsetCenter: [0, '10%'],
            length: '80%',      // Reduced pointer length (from 115%) for proportionality
            icon: 'path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.81557,732.63423 2083.81557,729.017692 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z',
            itemStyle: {
              color: '#000'
            }
          },
          detail: {
            valueAnimation: true,
            precision: 2,        // Increase precision or keep as is
            fontSize: 16,        // Reduced from default larger size
            offsetCenter: [0, '40%'] // Adjust to fit within the smaller radius
          },
          title: {
            offsetCenter: [0, '-40%'],  // Adjust title placement for smaller chart
            fontSize: 14                // Smaller font
          },
          data: [
            {
              value: 58.46,
              name: 'PLP'
            }
          ]
        },
        {
          type: 'gauge',
          min: 0,
          max: 60,
          center: ['50%', '60%'],
          splitNumber: 6,
          radius: '60%',          // Match the radius
          axisLine: {
            lineStyle: {
              color: [[1, '#000']],
              width: 2
            }
          },
          splitLine: {
            distance: -2,          // Adjust spacing
            length: 10,            // Reduced length
            lineStyle: {
              color: '#000',
              width: 2
            }
          },
          axisTick: {
            distance: 0,
            length: 6,             // Reduced
            lineStyle: {
              color: '#000',
              width: 1
            }
          },
          axisLabel: {
            distance: 6,           // Reduced label distance
            fontSize: 14,          // Smaller font
            color: '#000'
          },
          pointer: {
            show: false
          },
          title: {
            show: false
          },
          anchor: {
            show: true,
            size: 10,              // Smaller anchor
            itemStyle: {
              color: '#000'
            }
          }
        }
      ]
    }

    let clockGaugeOpt = {
      ...basicStyle,
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
                width: 15,
                color: [[1, 'rgba(0,0,0,0.7)']],
                shadowColor: 'rgba(0, 0, 0, 0.5)',
                shadowBlur: 15
              }
            },
            splitLine: {
              lineStyle: {
                shadowColor: 'rgba(0, 0, 0, 0.3)',
                shadowBlur: 3,
                shadowOffsetX: 1,
                shadowOffsetY: 2
              }
            },
            axisLabel: {
              fontSize: 15,
              distance: 20,
              formatter: function (value) {
                if (value === 0) {
                  return '';
                }
                return value + '';
              }
            },
            pointer: {
              icon: 'path://M2.9,0.7L2.9,0.7c1.4,0,2.6,1.2,2.6,2.6v115c0,1.4-1.2,2.6-2.6,2.6l0,0c-1.4,0-2.6-1.2-2.6-2.6V3.3C0.3,1.9,1.4,0.7,2.9,0.7z',
              width: 6,
              length: '55%',
              offsetCenter: [0, '8%'],
              itemStyle: {
                color: '#C0911F',
                shadowColor: 'rgba(0, 0, 0, 0.3)',
                shadowBlur: 8,
                shadowOffsetX: 2,
                shadowOffsetY: 4
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
                value: 0
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
              icon: 'path://M2.9,0.7L2.9,0.7c1.4,0,2.6,1.2,2.6,2.6v115c0,1.4-1.2,2.6-2.6,2.6l0,0c-1.4,0-2.6-1.2-2.6-2.6V3.3C0.3,1.9,1.4,0.7,2.9,0.7z',
              width: 4,
              length: '70%',
              offsetCenter: [0, '8%'],
              itemStyle: {
                color: '#C0911F',
                shadowColor: 'rgba(0, 0, 0, 0.3)',
                shadowBlur: 8,
                shadowOffsetX: 2,
                shadowOffsetY: 4
              }
            },
            anchor: {
              show: true,
              size: 10,
              showAbove: false,
              itemStyle: {
                borderWidth: 15,
                borderColor: '#C0911F',
                shadowColor: 'rgba(0, 0, 0, 0.3)',
                shadowBlur: 8,
                shadowOffsetX: 2,
                shadowOffsetY: 4
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
                value: 20
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
              icon: 'path://M2.9,0.7L2.9,0.7c1.4,0,2.6,1.2,2.6,2.6v115c0,1.4-1.2,2.6-2.6,2.6l0,0c-1.4,0-2.6-1.2-2.6-2.6V3.3C0.3,1.9,1.4,0.7,2.9,0.7z',
              width: 2,
              length: '85%',
              offsetCenter: [0, '8%'],
              itemStyle: {
                color: '#C0911F',
                shadowColor: 'rgba(0, 0, 0, 0.3)',
                shadowBlur: 8,
                shadowOffsetX: 2,
                shadowOffsetY: 4
              }
            },
            anchor: {
              show: true,
              size: 15,
              showAbove: true,
              itemStyle: {
                color: '#C0911F',
                shadowColor: 'rgba(0, 0, 0, 0.3)',
                shadowBlur: 8,
                shadowOffsetX: 2,
                shadowOffsetY: 4
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
                value: 40
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
