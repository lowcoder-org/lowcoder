import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["mermaid"].comp;

export default function MermaidChartExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title="Default Component"
          width={500}
          height={300}
          config={{
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Custom Component"
          width={500}
          height={300}
          config={{
            code: "graph LR\n Planning --> Defining --> Designing --> Building --> Testing --> Deployment --> Planning",
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>
    </>
  );
}
