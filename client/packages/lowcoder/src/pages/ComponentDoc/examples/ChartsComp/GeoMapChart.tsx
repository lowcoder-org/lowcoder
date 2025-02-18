import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["chartsGeoMap"].comp;

export default function GeoMapChartExample() {
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
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title="Zoom Level - 1"
          width={500}
          height={300}
          config={{
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Zoom Level - 3"
          width={500}
          height={300}
          config={{
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Zoom Level - 5"
          width={500}
          height={300}
          config={{
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Center Position ( Lat, Lon) - Spain"
          width={500}
          height={300}
          config={{
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Center Position ( Lat, Lon) - USA"
          width={500}
          height={300}
          config={{
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Center Position ( Lat, Lon) - Turkey"
          width={500}
          height={300}
          config={{
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>
    </>
  );
}
