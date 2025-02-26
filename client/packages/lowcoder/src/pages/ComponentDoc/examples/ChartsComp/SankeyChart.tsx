import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["sankeyChart"].comp;

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

const lineStyle = {
  chartBoxShadow: "5",
  chartShadowColor: "#020101",
  chartBorderColor: "#222222",
  chartBorderWidth: "3",
}

const detailStyle = {
  chartBoxShadow: "5",
  chartFontFamily: "serif",
  chartFontStyle: "Italic",
  chartShadowColor: "#FFD701",
  chartTextColor: "#7A7A7B",
  chartTextSize: "20",
  chartTextWeight: "bold"
}

export default function SankeyChartExample() {
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
          config={{
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Alignment & Layout"
        description="The Following Examples Show the different alignment option on the Sankey Chart Component."
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
          title="Title Position - Bottom"
          width={500}
          height={350}
          config={{
            echartsTitleVerticalConfig: {
              position: "bottom",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Chart Position - Top & Left"
          width={500}
          height={350}
          config={{
            top: "0",
            left: "0",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Chart Position - Bottom & Right"
          width={500}
          height={350}
          config={{
            bottom: "0",
            right: "0",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Sankey Chart's Curveness - 0.2"
          width={500}
          height={350}
          config={{
            curveness: "0.2",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Sankey Chart's Curveness - 0.8"
          width={500}
          height={350}
          config={{
            curveness: "0.8",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Sankey Chart's Opacity - 0.3"
          width={500}
          height={350}
          config={{
            opacity: "0.1",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Sankey Chart's Opacity - 0.8"
          width={500}
          height={350}
          config={{
            opacity: "0.8",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Node Width - 3"
          width={500}
          height={350}
          config={{
            nodeWidth: "3",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Node Width - 30"
          width={500}
          height={350}
          config={{
            nodeWidth: "30",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Node Gap - 10"
          width={500}
          height={350}
          config={{
            nodeGap: "10",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Node Gap - 70"
          width={500}
          height={350}
          config={{
            nodeGap: "70",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Draggable - Set Node to draggable"
          width={500}
          height={350}
          config={{
            draggable: true,
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Draggable - Set Node to non-draggable"
          width={500}
          height={350}
          config={{
            draggable: false,
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Hiding the Tooltip"
          width={500}
          height={350}
          config={{
            tooltip: false,
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the Styling Properties on the Sankey Chart Component."
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
          title="Line Styling - Border & Box Shadow"
          width={500}
          height={350}
          hideSettings={true}
          config={{
            lineStyle: lineStyle,
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Details Styling - Text, Fonts & Box Shadow"
          width={500}
          height={350}
          hideSettings={true}
          config={{
            detailStyle: detailStyle,
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>
    </>
  );
}
