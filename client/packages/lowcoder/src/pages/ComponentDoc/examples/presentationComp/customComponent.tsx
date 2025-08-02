import { CustomComp } from "comps/comps/customComp/customComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function CustomCompExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Custom Component."
      >
        <Example
          title="Custom Component"
          width={500}
          height={500}
          config={{
          }}
          compFactory={CustomComp}
        />
        <Example
          title="Hiding the Custom Component"
          width={500}
          height={500}
          config={{
            "hidden": true,
          }}
          compFactory={CustomComp}
        />
        <Example
          title="Styling of Custom Component"
          width={500}
          height={300}
          config={{
            "style":{
              "margin": "10px",
              "padding": "30px",
            },
          }}
          compFactory={CustomComp}
        />
      </ExampleGroup>
    </>
  );
}
