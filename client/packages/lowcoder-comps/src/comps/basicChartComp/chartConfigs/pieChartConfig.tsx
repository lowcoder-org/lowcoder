import { MultiCompBuilder } from "lowcoder-sdk";
import { PieSeriesOption } from "echarts";
import { 
  dropdownControl,
  NumberControl,
  StringControl,
  withDefault,
 } from "lowcoder-sdk";
import { ConstructorToView } from "lowcoder-core";
import { trans } from "i18n/comps";

const BarTypeOptions = [
  {
    label: trans("chart.basicPie"),
    value: "basicPie",
  },
  {
    label: trans("chart.doughnutPie"),
    value: "doughnutPie",
  },
  {
    label: trans("chart.rosePie"),
    value: "rosePie",
  },
  {
    label: trans("chart.calendarPie"),
    value: "calendarPie",
  },
  {
    label: trans("chart.geoPie"),
    value: "geoPie",
  },
] as const;

// radius percent for each pie chart when one line has [1, 2, 3] pie charts
const pieRadiusConfig = [65, 35, 20];

type PieConfigViewType = ConstructorToView<typeof PieChartConfig>;

export const PieChartConfig = (function () {
  return new MultiCompBuilder(
    {
      type: dropdownControl(BarTypeOptions, "basicPie"),
      cellSize: withDefault(NumberControl, 40),
      range: withDefault(StringControl, "2021-09"),
      mapUrl: withDefault(StringControl, "https://echarts.apache.org/examples/data/asset/geo/USA.json"),
    },
    (props): PieSeriesOption => {
      const config: PieSeriesOption = {
        type: "pie",
        subtype: props.type,
        label: {
          show: true,
          formatter: "{d}%",
        },
        range: props.range,
      };
      if (props.type === "rosePie") {
        config.roseType = "area";
      }
      if (props.type === "doughnutPie") {
        config.radius = ["40%", "60%"];
      }
      if (props.type === "calendarPie") {
        config.coordinateSystem = 'calendar';
        config.cellSize = [props.cellSize, props.cellSize];
        config.label = {
          ...config.label,
          position: 'inside'
        };
      }
      if (props.type === "geoPie") {
        config.mapUrl = props.mapUrl;
      }
      return config;
    }
  )
    .setPropertyViewFn((children) => (
      <>
        {children.type.propertyView({
          label: trans("chart.pieType"),
        })}
        {children.type.getView() === "calendarPie" && children.cellSize.propertyView({
          label: trans("lineChart.cellSize"),
        })}
        {children.type.getView() === "calendarPie" && children.range.propertyView({
          label: trans("lineChart.range"),
        })}
        {children.type.getView() === "geoPie" && children.mapUrl.propertyView({
          label: trans("pieChart.mapUrl"),
        })}
      </>
    ))
    .build();
})();

export function getPieRadiusAndCenter(
  seriesLength: number,
  pieIndex: number,
  pieConfig: PieConfigViewType
) {
  const columnPieNum = Math.min(seriesLength, pieRadiusConfig.length);
  const radiusNumber = pieRadiusConfig[columnPieNum - 1];
  const isDoughnutPie = Array.isArray(pieConfig.radius);
  const radius = isDoughnutPie
    ? [(radiusNumber / 1.6).toFixed(2) + "%", radiusNumber + "%"]
    : radiusNumber + "%";

  /*** calculate center coordinates ***/
  const pieDiameter = 100 / columnPieNum;
  const xPosition = (pieDiameter * (pieIndex % columnPieNum) + pieDiameter / 2).toFixed(2) + "%";
  const rowIndex = Math.floor(pieIndex / columnPieNum) + 1;
  const yPosition =
    ((100 / Math.floor((columnPieNum * 2 + seriesLength - 1) / columnPieNum)) * rowIndex).toFixed(
      2
    ) + "%";
  // log.log("Echarts height: index:", pieConfig, radius, pieIndex, xPosition, yPosition);
  return {
    radius: radius,
    center: [xPosition, yPosition],
  } as const;
}
