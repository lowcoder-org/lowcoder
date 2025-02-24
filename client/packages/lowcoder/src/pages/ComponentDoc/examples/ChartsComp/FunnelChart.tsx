import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["funnelChart"].comp;

export default function FunnelChartExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Funnel Chart Component."
      >
        <Example
          title="A simple Funnel Chart"
          width={500}
          height={350}
          config={{
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Setting Opacity - 0.3"
          width={500}
          height={350}
          config={{
            opacity: "0.3",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Setting Opacity - 0.6"
          width={500}
          height={350}
          config={{
            opacity: "0.6",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Setting Opacity - 1"
          width={500}
          height={350}
          config={{
            opacity: "1",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Gap - 0"
          width={500}
          height={350}
          config={{
            gap: "0",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Gap - 5"
          width={500}
          height={350}
          config={{
            gap: "5",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Gap - 10"
          width={500}
          height={350}
          config={{
            gap: "10",
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Alignment & Layout"
        description="The Following Examples Show the different alignment option on the Funnel Chart Component."
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
            echartsTitle: "Funnel",
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
          title="Label Position - Left"
          width={500}
          height={350}
          config={{
            echartsLabelConfig: {
              "position": "left"
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Label Position - Center"
          width={500}
          height={350}
          config={{
            echartsLabelConfig: {
              "position": "center"
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Label Position - Right"
          width={500}
          height={350}
          config={{
            echartsLabelConfig: {
              "position": "right"
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Funnel Chart Sorting - Ascending"
          width={500}
          height={350}
          config={{
            echartsSortingConfig: {
              sort: "ascending"
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Funnel Chart Sorting - Descending"
          width={500}
          height={350}
          config={{
            echartsSortingConfig: {
              sort: "descending"
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Funnel Chart Alignment - Left"
          width={500}
          height={350}
          config={{
            echartsFunnelAlignConfig: {
              funnelAlign: "left",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Funnel Chart Alignment - Center"
          width={500}
          height={350}
          config={{
            echartsFunnelAlignConfig: {
              funnelAlign: "center",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Funnel Chart Alignment - Right"
          width={500}
          height={350}
          config={{
            echartsFunnelAlignConfig: {
              funnelAlign: "right",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Properties Visibility"
        description="The Following Examples Show the visibility of different Properties on the Funnel Chart Component."
      >
        <Example
          title="Hiding the Labels"
          width={500}
          height={350}
          config={{
            label: false,
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
        <Example
          title="Hiding Tooltip"
          width={500}
          height={350}
          config={{
            tooltip: false,
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>
    </>
  );
}
