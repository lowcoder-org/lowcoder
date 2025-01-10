import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["gaugeChart"].comp;

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
            chartType: "stageGuage",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Chart Type - Grade Guage"
          width={500}
          height={300}
          config={{
            chartType: "gradeGuage",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Chart Type - Temperature Guage"
          width={500}
          height={300}
          config={{
            chartType: "temperatureGuage",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Chart Type - Temperature Guage"
          width={500}
          height={300}
          config={{
            chartType: "multiGuage",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Chart Type - Temperature Guage"
          width={500}
          height={300}
          config={{
            chartType: "clockGuage",
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>
    </>
  );
}
