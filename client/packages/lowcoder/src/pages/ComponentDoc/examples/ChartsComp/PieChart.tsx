import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["pieChart"].comp;

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

export default function PieChartExample() {
  return (
    <>
      <ExampleGroup title={trans("componentDoc.pie")}>
        <Example
          title={trans("componentDoc.basicPie")}
          width={700}
          height={400}
          hideSettings={true}
          nameMap={{ "chartConfig.comp.type": trans("componentDoc.pieChatType") }}
          config={{
            chartConfig: {
              compType: "pie",
              comp: { type: "basicPie" },
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title={trans("componentDoc.doughnutPie")}
          width={700}
          height={400}
          hideSettings={true}
          nameMap={{ "chartConfig.comp.type": trans("componentDoc.pieChatType") }}
          config={{
            chartConfig: { compType: "pie", comp: { type: "doughnutPie" } },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title={trans("componentDoc.rosePie")}
          width={700}
          height={400}
          hideSettings={true}
          nameMap={{ "chartConfig.comp.type": trans("componentDoc.pieChatType") }}
          config={{
            chartConfig: { compType: "pie", comp: { type: "rosePie" } },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Calendar Pie"
          width={700}
          height={400}
          hideSettings={true}
          config={{
            chartConfig: { compType: "pie", 
            comp: { 
              type: "calendarPie",
              cellSize: "60",
            } 
          },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Geo Pie"
          width={700}
          height={400}
          hideSettings={true}
          config={{
            chartConfig: { compType: "pie", comp: { type: "geoPie" } },
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Title Position"
        description="The Following Examples show the different title position of the Pie Chart Component."
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
        description="The Following Examples Show the Styling Properties on the Pie Chart Component."
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
      </ExampleGroup>

    </>
  );
}
