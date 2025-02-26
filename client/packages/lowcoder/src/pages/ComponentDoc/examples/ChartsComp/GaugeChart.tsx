import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["gaugeChart"].comp;

const barometerGuageOption = {
  "data": [
    {
      "formatter": "{value}%",
      "value": 58.46,
      "name": "PLP",
      "outline": {
        "color": "#c80707",
        "period": [
          0,
          100
        ],
        "splitNumber": 10,
        "progressBarWidth": 2,
        "axisTickLength": 6,
        "axisTickWidth": 2,
        "radius": "70%"
      },
      "inline": {
        "color": "#000000",
        "period": [
          0,
          60
        ],
        "progressBarWidth": 2,
        "splitNumber": 6,
        "axisTickLength": 6,
        "axisTickWidth": 2,
        "radius": "60%"
      }
    }
  ]
};

const clockGuageOption = {
  "data": [
    {
      "outlineColor": "#aa2a2a",
      "anchor": {
        "color": "#cfae09",
        "size": 10
      },
      "hour": {
        "color": "#cfae09",
        "width": 4,
        "length": 50,
        "value": 4
      },
      "minute": {
        "color": "#cfae09",
        "width": 2.5,
        "length": 65,
        "value": 30
      },
      "second": {
        "color": "#cfae09",
        "width": 1,
        "length": 90,
        "value": 45
      }
    }
  ]
};

const gradeGuageOption = {
  "data": [
    {
      "value": 80,
      "name": "Grade Rating",
      "formatter": "{value} %",
      "color": [
        [
          0.25,
          "#FF6E76"
        ],
        [
          0.5,
          "#FDDD60"
        ],
        [
          0.75,
          "#58D9F9"
        ],
        [
          1,
          "#7CFFB2"
        ]
      ]
    }
  ]
};

const multiTitleGuageOption = {
  "data": [
    {
      "formatter": "{value}%",
      "value": [
        {
          "color": "#19b1e6",
          "title": "Perfect",
          "value": 20,
          "titlePosition": [
            "-60%",
            "60%"
          ],
          "valuePosition": [
            "-60%",
            "80%"
          ]
        },
        {
          "color": "#fac858",
          "title": "Good",
          "value": 40,
          "titlePosition": [
            "0%",
            "60%"
          ],
          "valuePosition": [
            "0%",
            "80%"
          ]
        },
        {
          "color": "#09f64d",
          "title": "Commonly",
          "value": 60,
          "titlePosition": [
            "60%",
            "60%"
          ],
          "valuePosition": [
            "60%",
            "80%"
          ]
        }
      ]
    }
  ]
};

const stageGuageOption = {
  "data": [
    {
      "value": 80,
      "formatter": "{value} Km/h",
      "color": [
        [
          0.3,
          "#67e0e3"
        ],
        [
          0.7,
          "#37a2da"
        ],
        [
          1,
          "#fd666d"
        ]
      ]
    }
  ]
};

export default function GaugeChartExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Gauge Chart Component."
      >
        <Example
          title="Chart Type - Default"
          width={500}
          height={300}
          config={{
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Chart Type - Stage Speed Guage"
          width={500}
          height={300}
          config={{
            chartType: "stageGauge",
            echartsTitle: "Stage Speed Gauge",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Chart Type - Grade Guage"
          width={500}
          height={300}
          config={{
            chartType: "gradeGauge",
            echartsTitle: "Grade Gauge",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Chart Type - Temperature Guage"
          width={500}
          height={300}
          config={{
            chartType: "temperatureGauge",
            echartsTitle: "Temperature Gauge Chart",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Chart Type - Multi Title Guage"
          width={500}
          height={300}
          config={{
            chartType: "multiGauge",
            echartsTitle: "Multi Title Gauge",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Chart Type - Clock Guage"
          width={500}
          height={300}
          config={{
            chartType: "clockGauge",
            echartsTitle: "Clock Gauge",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Chart Type - Ring Guage"
          width={500}
          height={300}
          config={{
            chartType: "ringGauge",
            echartsTitle: "Ring Gauge",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Chart Type - Guage Barometer Chart"
          width={500}
          height={300}
          config={{
            chartType: "barometerGauge",
            echartsTitle: "Gauge Barometer Chart",
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Charts Configuration - Layout & Styling"
        description="The Following Examples Show the Layout & Styling options on different Chart components"
      >
        <Example
          title="Radius Configuration - Small Circle"
          width={500}
          height={300}
          config={{
            chartType: "ringGauge",
            radius: "50",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Radius Configuration - Large Circle"
          width={500}
          height={300}
          config={{
            chartType: "ringGauge",
            radius: "90",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Position Configuration - X and Y axis"
          width={500}
          height={300}
          config={{
            chartType: "ringGauge",
            position_x: "20",
            position_y: "30",
            radius: "60",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Position Configuration - X and Y axis"
          width={500}
          height={300}
          config={{
            chartType: "ringGauge",
            position_x: "80",
            position_y: "70",
            radius: "60",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Progress Bar Width"
          width={500}
          height={300}
          config={{
            chartType: "ringGauge",
            ringProgressBarWidth: "20",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Progress Bar Width"
          width={500}
          height={300}
          config={{
            chartType: "ringGauge",
            ringProgressBarWidth: "60",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Start Angle"
          width={500}
          height={300}
          config={{
            chartType: "temperatureGauge",
            startAngle: "160",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="End Angle"
          width={500}
          height={300}
          config={{
            chartType: "temperatureGauge",
            endAngle: "70",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Split Number - 10"
          width={500}
          height={300}
          config={{
            chartType: "temperatureGauge",
            splitNumber: "10",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Split Number - 20"
          width={500}
          height={300}
          config={{
            chartType: "temperatureGauge",
            splitNumber: "20",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Axis Tick Length"
          width={500}
          height={300}
          config={{
            chartType: "temperatureGauge",
            axisTickLength: "20",
            position_y: "70",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Axis Tick Width"
          width={500}
          height={300}
          config={{
            chartType: "temperatureGauge",
            axisTickWidth: "5",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Axis Tick Color"
          width={500}
          height={300}
          config={{
            chartType: "temperatureGauge",
            axisTickColor: "#222222",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Axis Label Distance"
          width={500}
          height={300}
          config={{
            chartType: "temperatureGauge",
            axisLabelDistance: "40",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Pointer Length"
          width={500}
          height={300}
          config={{
            chartType: "barometerGauge",
            barometerPointerLength: "170",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Pointer Width"
          width={500}
          height={300}
          config={{
            chartType: "barometerGauge",
            barometerPointerWidth: "15",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Pointer Position"
          width={500}
          height={300}
          config={{
            chartType: "barometerGauge",
            barometerPointer_Y: "30",
            barometerPointerLength: "80",
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>
    </>
  );
}
