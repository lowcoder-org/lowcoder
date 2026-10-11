import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["radarChart"].comp;

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

const labelStyle = {
  chartBoxShadow: "5",
  chartFontFamily: "serif",
  chartFontStyle: "Italic",
  chartShadowColor: "#020101",
  chartTextColor: "#FFFFFF",
  chartTextSize: "20",
  chartTextWeight: "bold"
}

const legendStyle = {
  chartBoxShadow: "5",
  chartFontFamily: "serif",
  chartFontStyle: "Italic",
  chartShadowColor: "#FFD701",
  chartTextColor: "#7A7A7B",
  chartTextSize: "20",
  chartTextWeight: "bold"
}

export default function RadarChartExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.default")}
          width={500}
          height={300}
          hideSettings={true}
          config={{
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Alignment & Layout"
        description="The Following Examples Show the different alignment option on the Radar Chart Component."
      >
        <Example
          title="Title Position - Left"
          width={500}
          height={350}
          config={{
            echartsTitleConfig : {
            "position" : "left",
            }
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Title Position - Center"
          width={500}
          height={350}
          config={{
              echartsTitleConfig : {
                "position" : "center",
              }
            }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Title Position - Right"
          width={500}
          height={350}
          config={{
            echartsTitleConfig : {
              "position" : "right",
            }
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Legend Position - Top"
          width={500}
          height={350}
          config={{
            echartsLegendConfig : {
              "position" : "top",
            },
            echartsTitleConfig : {
              "position" : "left",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Lagend Position - Bottom"
          width={500}
          height={350}
          config={{
            echartsLegendConfig : {
              "position" : "bottom",
            }
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Legend Orientation + Position - Vertical + Left"
          width={500}
          height={350}
          config={{
            echartsLegendOrientConfig: {
              orient: "vertical"
            },
            echartsLegendAlignConfig: {
              left: "left"
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Legend Orientation + Position - Horizontal + Center"
          width={500}
          height={350}
          config={{
            echartsLegendOrientConfig: {
              orient: "horizontal"
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Legend Orientation + Position - Vertical + Right"
          width={500}
          height={350}
          config={{
            echartsLegendOrientConfig: {
              orient: "vertical"
            },
            echartsLegendAlignConfig: {
              left: "right"
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Hiding Labels"
          width={500}
          height={350}
          config={{
            echartsLabelConfig: {
              labelVisibility: false,
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="X-Axis Position"
          width={500}
          height={350}
          config={{
            position_x: "25",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Y-Axis Position"
          width={500}
          height={350}
          config={{
            position_y: "30",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Hiding Area Flag"
          width={500}
          height={350}
          config={{
            areaFlag: false,
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Hiding Legends"
          width={500}
          height={350}
          config={{
            legendVisibility: false,
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
              description="The Following Examples Show the Styling Properties on the Radar Chart Component."
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
                title="Label Styling - Text, Fonts & Box Shadow"
                width={500}
                height={350}
                hideSettings={true}
                config={{
                  labelStyle: labelStyle,
                }}
                compFactory={ChartCompWithDefault}
              />
              <Example
                title="Lagend Styling - Text, Fonts & Box Shadow"
                width={500}
                height={350}
                hideSettings={true}
                config={{
                  legendStyle: legendStyle,
                }}
                compFactory={ChartCompWithDefault}
              />
      </ExampleGroup>
    </>
  );
}
