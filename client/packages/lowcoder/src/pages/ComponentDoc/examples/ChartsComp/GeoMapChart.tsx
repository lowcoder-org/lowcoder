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
            mapZoomLevel: "1",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Zoom Level - 3"
          width={500}
          height={300}
          config={{
            mapZoomLevel: "3",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Zoom Level - 5"
          width={500}
          height={300}
          config={{
            mapZoomLevel: "5",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Center Position ( Lat, Long) - Spain"
          width={700}
          height={300}
          hideSettings={true}
          config={{
            mapCenterLng: "-0.5033",
            mapCenterLat: "40.5235",
            mapZoomLevel: "5",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Center Position ( Lat, Lon) - USA"
          width={700}
          height={300}
          hideSettings={true}
          config={{
            mapCenterLng: "-97.5348",
            mapCenterLat: "38.7946",
            mapZoomLevel: "5",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Center Position ( Lat, Lon) - Turkey"
          width={700}
          height={300}
          hideSettings={true}
          config={{
            mapCenterLng: "38.5348",
            mapCenterLat: "38.7946",
            mapZoomLevel: "5",
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>
    </>
  );
}
