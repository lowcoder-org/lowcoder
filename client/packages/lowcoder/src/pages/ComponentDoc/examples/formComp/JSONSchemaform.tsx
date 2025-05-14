import { JsonSchemaFormComp } from "comps/comps/jsonSchemaFormComp/jsonSchemaFormComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function jsonSchemaFormExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the JSON Schema Component."
      >
        <Example
          title="A Simple JSON Schema Form"
          hideSettings={true}
          config={{}}
          compFactory={JsonSchemaFormComp}
        />
        <Example
          title="Hiding the JSON Schema Form"
          hideSettings={true}
          config={{
            hidden: true,
          }}
          compFactory={JsonSchemaFormComp}
        />
        <Example
          title="Reset after Form Submit - True"
          hideSettings={true}
          config={{
            resetAfterSubmit: true, 
          }}
          compFactory={JsonSchemaFormComp}
        />
        <Example
          title="Reset after Form Submit - False"
          hideSettings={true}
          config={{
            resetAfterSubmit: false, 
          }}
          compFactory={JsonSchemaFormComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties on the JSON Schema Component."
        >
        <Example
          title="Background Color, Border Radius and Color"
          hideSettings={true}
          config={{
            style: {
              "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
              "border": "#3377FF",
              "radius": "20px"
            },
          }}
          compFactory={JsonSchemaFormComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the JSON Schema Component."
        >
        <Example
          title="Bounce Animation"
          hideSettings={true}
          config={{
            animationStyle: {
            "animation": "bounce",
            "animationDelay": "1s",
            "animationDuration": "3s",
            "animationIterationCount": "infinite"
            },
          }}
          compFactory={JsonSchemaFormComp}
        />
        <Example
          title="Swing Animation"
          hideSettings={true}
          config={{
            animationStyle: {
            "animation": "swing",
            "animationDelay": "1s",
            "animationDuration": "3s",
            "animationIterationCount": "infinite"
            },
          }}
          compFactory={JsonSchemaFormComp}
        />
        <Example
        title="Tada Animation"
        hideSettings={true}
        config={{
            animationStyle: {
            "animation": "tada",
            "animationDelay": "1s",
            "animationDuration": "3s",
            "animationIterationCount": "infinite"
            },
        }}
        compFactory={JsonSchemaFormComp}
      />
      </ExampleGroup>
    </>
  );
}
