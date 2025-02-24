import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["candleStickChart"].comp;

const defaultEchartsJsonOption = {
  "xAxis": {
    "data": [
      "Day 1",
      "Day 2",
      "Day 3",
      "Day 4",
      "Day 5"
    ]
  },
  "data": [
    [
      150,
      100,
      50,
      200
    ],
    [
      120,
      220,
      80,
      180
    ],
    [
      80,
      150,
      60,
      130
    ],
    [
      230,
      130,
      110,
      190
    ],
    [
      90,
      180,
      70,
      160
    ]
  ]
};

const echartsOption = JSON.stringify(defaultEchartsJsonOption);

export default function CandleStickChartExample() {
  const blackListConfig: string[] = ["echartsOption"];
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
            echartsOption: echartsOption,
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Hiding the Tooltip"
          width={500}
          height={300}
          config={{
            echartsOption: echartsOption,
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
            echartsOption: echartsOption,
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
            echartsOption: echartsOption,
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
            echartsOption: echartsOption,
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
            echartsOption: echartsOption,
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
            echartsOption: echartsOption,
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
            echartsOption: echartsOption,
            echartsLegendConfig: {
              "position": "top",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>
    </>
  );
}
