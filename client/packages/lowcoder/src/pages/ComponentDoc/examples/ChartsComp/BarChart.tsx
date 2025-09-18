import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["barChart"].comp;

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

export default function BarChartExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.default")}
          width={700}
          height={400}
          hideSettings={true}
          config={{
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Hiding the Tooltip"
          width={700}
          height={400}
          hideSettings={true}
          config={{
            "tooltip": "false",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Bar Chart Type - Waterfall"
          width={700}
          height={400}
          hideSettings={true}
          config={{
            "title": "Bar Chart - Waterfall",
            "chartConfig": {
                "compType": "bar",
                "comp": {
                    "type": "waterfall",
                }
            }
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Bar Chart Type - Polar"
          width={700}
          height={400}
          hideSettings={true}
          config={{
            "title": "Bar Chart - Polar",
            "chartConfig": {
                "compType": "bar",
                "comp": {
                    "type": "polar",
                }
            }
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Basic Chart Properties"
        description="The Following Examples Show the Basic Properites of the Bar Chart Component."
      >
        <Example
          title="Hiding Labels"
          width={700}
          height={400}
          hideSettings={true}
          config={{
            "chartConfig": {
                "compType": "bar",
                "comp": {
                    "showLabel": "false",
                }
            }
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Bar Width - 20"
          width={700}
          height={400}
          hideSettings={true}
          config={{
            "chartConfig": {
                "compType": "bar",
                "comp": {
                    "barWidth": "20",
                }
            }
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Bar Width - 60"
          width={700}
          height={400}
          hideSettings={true}
          config={{
            "chartConfig": {
                "compType": "bar",
                "comp": {
                    "barWidth": "60",
                }
            }
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Bars View Type - Race"
          width={700}
          height={400}
          hideSettings={true}
          config={{
            "chartConfig": {
                "compType": "bar",
                "comp": {
                    "race": "true",
                }
            }
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Bars View Type - Stack"
          width={700}
          height={400}
          hideSettings={true}
          config={{
            "chartConfig": {
                "compType": "bar",
                "comp": {
                    "stack": "true",
                }
            }
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Bars View Type - Show Background"
          width={700}
          height={400}
          hideSettings={true}
          config={{
            "chartConfig": {
                "compType": "bar",
                "comp": {
                    "showBackground": "true",
                }
            }
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Chart Position"
        description="The Following Examples show the Chart Position of the Bar Chart Component."
      >
        <Example
        title="Custom Position"
        width={700}
        height={400}
        hideSettings={true}
        config={{
            top: 20,
            right: 0,
            bottom: 10,
            left: 20,
        }}
        compFactory={ChartCompWithDefault}
        />

        <Example
        title="Vertical X-Axis"
        width={700}
        height={400}
        hideSettings={true}
        config={{
            "xAxisDirection": "vertical",
        }}
        compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Title Position"
        description="The Following Examples show the different title position of the Bar Chart Component."
      >
        <Example
        title="Title Position - Left"
        width={700}
        height={400}
        hideSettings={true}
        config={{
            echartsTitleConfig: {
            "position": "left",
            },
        }}
        compFactory={ChartCompWithDefault}
        />
        <Example
        title="Title Position - Center"
        width={700}
        height={400}
        hideSettings={true}
        config={{
            echartsTitleConfig: {
            "position": "center",
            },
        }}
        compFactory={ChartCompWithDefault}
        />
        <Example
        title="Title Position - Right"
        width={700}
        height={400}
        hideSettings={true}
        config={{
            echartsTitleConfig: {
            "position": "right",
            },
        }}
        compFactory={ChartCompWithDefault}
        />
        <Example
        title="Title Position - Top"
        width={700}
        height={400}
        hideSettings={true}
        config={{
            echartsTitleVerticalConfig: {
            "position": "top",
            },
        }}
        compFactory={ChartCompWithDefault}
        />
        <Example
        title="Title Position - Bottom"
        width={700}
        height={400}
        hideSettings={true}
        config={{
            echartsTitleVerticalConfig: {
            "position": "bottom",
            },
        }}
        compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the Styling Properties on the Bar Chart Component."
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
