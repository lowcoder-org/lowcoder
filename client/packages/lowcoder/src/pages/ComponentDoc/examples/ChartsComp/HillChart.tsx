import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["hillchart"].comp;

const data = "[\n  {\n    \"id\": 1,\n    \"color\": \"gray\",\n    \"description\": \"Validation: Sales and Marketing Strategy\",\n    \"x\": 15,\n    \"size\": 15\n  },\n  {\n    \"id\": 2,\n    \"color\": \"maroon\",\n    \"description\": \"Improvement & Renewals\",\n    \"x\": 80,\n    \"size\": 10\n  },\n  {\n    \"id\": 6,\n    \"color\": \"maroon\",\n    \"description\": \"Track & Measurement\",\n    \"x\": 70,\n    \"size\": 10\n  },\n  {\n    \"id\": 3,\n    \"color\": \"maroon\",\n    \"description\": \"Salesforce Integration\",\n    \"x\": 25,\n    \"size\": 10\n  },\n  {\n    \"id\": 4,\n    \"color\": \"cyan\",\n    \"description\": \"Marketing Tools integration\",\n    \"x\": 35,\n    \"size\": 10\n  },\n  {\n    \"id\": 5,\n    \"color\": \"yellow\",\n    \"description\": \"Execution\",\n    \"x\": 50,\n    \"size\": 20\n  }\n]";

export default function HillChartExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Hill Chart Component."
      >
        <Example
          title="Default Hill Chart"
          hideSettings={true}
          width={700}
          config={{
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Hill Chart with Custom Data"
          hideSettings={true}
          width={700}
          config={{
            data: data,
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties of the Hill Chart Component."
      >
        <Example
          title="Background Color"
          hideSettings={true}
          width={700}
          config={{
            data: data,
            styles: {
              "backgroundColor": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Border Properties : Color, Width & Radius"
          hideSettings={true}
          width={700}
          config={{
            data: data,
            styles: {
              "border": "#053EFF",
              "radius": "40px",
              "borderWidth": "3px",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Margin & Padding"
          hideSettings={true}
          width={700}
          config={{
            data: data,
            styles: {
              "border": "#053EFF",
              "radius": "40px",
              "borderWidth": "3px",
              "margin": "10px",
              "padding": "25px",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Text Size"
          hideSettings={true}
          width={700}
          config={{
            data: data,
            styles: {
              "textSize": "30px",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>
    </>
  );
}