import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["candleStickChart"].comp;

const chartStyle= {
  background: "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
  chartBorderColor: "#FDFAFA",
  chartBorderStyle: "solid",
  chartBorderWidth: "2",
  chartBoxShadow: "200",
  chartShadowColor: "#3377FF"
}

const titleStyle = {
  chartBoxShadow: "9",
  chartFontStyle: "Italic",
  chartShadowColor: "#FFBD01",
  chartTextColor: "#36B389",
  chartTextSize: "30",
  chartTextWeight: "Bold"
}

const xAxisStyle = {
  chartBoxShadow: "5",
  chartFontFamily: "serif",
  chartFontStyle: "Italic",
  chartShadowColor: "#020101",
  chartTextColor: "#971827",
  chartTextSize: "20",
  chartTextWeight: "bold"
}

const yAxisStyle = {
  chartBoxShadow: "5",
  chartFontFamily: "serif",
  chartFontStyle: "Italic",
  chartShadowColor: "#FFD701",
  chartTextColor: "#7A7A7B",
  chartTextSize: "20",
  chartTextWeight: "bold"
}

export default function CandleStickChartExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples show the basic usage of the CandleStick Chart Component."
      >
        <Example
          title={trans("componentDoc.default")}
          width={500}
          height={300}
          config={{
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Hiding the Tooltip"
          width={500}
          height={300}
          config={{
            tooltip: false,
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Chart Position"
        description="The Following Examples show the Chart Position of the CandleStick Chart Component."
      >
        <Example
          title="Custom Position"
          width={500}
          height={300}
          config={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Title Position"
        description="The Following Examples show the different title position of the CandleStick Chart Component."
      >
        <Example
          title="Title Position - Left"
          width={500}
          height={300}
          config={{
            echartsTitleConfig: {
              "position": "left",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Title Position - Center"
          width={500}
          height={300}
          config={{
            echartsTitleConfig: {
              "position": "center",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Title Position - Right"
          width={500}
          height={300}
          config={{
            echartsTitleConfig: {
              "position": "right",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Title Position - Top"
          width={500}
          height={300}
          config={{
            echartsLegendConfig: {
              "position": "bottom",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Title Position - Bottom"
          width={500}
          height={300}
          config={{
            echartsLegendConfig: {
              "position": "top",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
              title="Styling Properties"
              description="The Following Examples Show the Styling Properties on the CandleStick Chart Component."
            >
              <Example
                title="Chart Styling - Background Color, Box Shadow, Border"
                width={500}
                height={350}
                hideSettings={true}
                config={{
                  chartStyle: chartStyle,
                }}
                compFactory={ChartCompWithDefault}
              />
              <Example
                title="Title Styling - Text, Fonts & Box Shadow"
                width={500}
                height={350}
                hideSettings={true}
                config={{
                  titleStyle: titleStyle,
                }}
                compFactory={ChartCompWithDefault}
              />
              <Example
                title="X-Axis Styling"
                width={500}
                height={350}
                hideSettings={true}
                config={{
                  xAxisStyle: xAxisStyle,
                }}
                compFactory={ChartCompWithDefault}
              />
              <Example
                title="Y-Axis Styling"
                width={500}
                height={350}
                hideSettings={true}
                config={{
                  yAxisStyle: yAxisStyle,
                }}
                compFactory={ChartCompWithDefault}
              />
      </ExampleGroup>
    </>
  );
}
