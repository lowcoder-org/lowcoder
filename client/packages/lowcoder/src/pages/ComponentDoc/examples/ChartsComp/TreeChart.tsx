import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["treeChart"].comp;

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

const detailStyle = {
  chartFontFamily: "serif",
  chartFontStyle: "Italic",
  chartTextColor: "#7A7A7B",
  chartTextSize: "20",
  chartTextWeight: "bold"
}

export default function TreeChartExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Tree Chart Component."
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
        description="The Following Examples Show the different alignment option on the Tree Chart Component."
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
          title="Hiding Tooltip"
          width={500}
          height={350}
          config={{
            tooltip: false,
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Chart Position - Top & Left"
          width={500}
          height={350}
          config={{
            top: "-15",
            left: "0",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Chart Position - Bottom & Right"
          width={500}
          height={350}
          config={{
            bottom: "-15",
            right: "0",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Point Size - 10"
          width={500}
          height={350}
          config={{
            pointSize: "10",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Point Size - 20"
          width={500}
          height={350}
          config={{
            pointSize: "20",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Line Width - 3"
          width={500}
          height={350}
          config={{
            lineWidth: "3",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Line Width - 6"
          width={500}
          height={350}
          config={{
            lineWidth: "6",
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the Styling Properties on the Sunburst Chart Component."
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
