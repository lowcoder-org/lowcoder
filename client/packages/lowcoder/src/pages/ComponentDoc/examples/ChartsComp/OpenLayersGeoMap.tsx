import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["openLayersGeoMap"].comp;

export default function OpenLayersGeoMapChartExample() {
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
        <Example
          title="Center Position - USA"
          width={500}
          height={300}
          config={{
            center: "[-92.5348,38.7946]",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Zoom Level - 3"
          width={500}
          height={300}
          config={{
            zoom: "3",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Zoom Level - 7"
          width={500}
          height={300}
          config={{
            zoom: "7",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Zoom Level - 10"
          width={500}
          height={300}
          config={{
            zoom: "10",
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>
    </>
  );
}
