import { ToggleButtonComp } from "comps/comps/buttonComp/toggleButtonComp"
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function ToggleButtonExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.default")}
          width={120}
          config={{ 
            text: trans("componentDoc.submit") 
        }}
          compFactory={ToggleButtonComp}
        />
        <Example
          title={trans("componentDoc.loading")}
          width={120}
          config={{ 
            text: trans("componentDoc.submit"), 
            loading: true 
        }}
          compFactory={ToggleButtonComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          width={120}
          config={{
            text: trans("componentDoc.submit"), 
            disabled: true 
        }}
          compFactory={ToggleButtonComp}
        />
      </ExampleGroup>
      
      <ExampleGroup title="Advanced">
        <Example
          title="Hide Text"
          width={120}
          config={{
            text: trans("componentDoc.submit"),
            showText: false,
          }}
          compFactory={ToggleButtonComp}
        />
        <Example
          title="Text for True & False"
          width={120}
          config={{
            text: trans("componentDoc.submit"),
            showText: true,
            trueText: "True",
            falseText: "False",
          }}
          compFactory={ToggleButtonComp}
        />
        <Example
          title="Icon Position"
          width={120}
          config={{
            text: trans("componentDoc.submit"),
            iconPosition: "left",
          }}
          compFactory={ToggleButtonComp}
        />
        <Example
          title="Content Alignment - Left"
          width={180}
          config={{
            text: trans("componentDoc.submit"),
            alignment: "left",
          }}
          compFactory={ToggleButtonComp}
        />
        <Example
          title="Content Alignment - Right"
          width={180}
          config={{
            text: trans("componentDoc.submit"),
            alignment: "right",
          }}
          compFactory={ToggleButtonComp}
        />
        <Example
          title="Content Alignment - Center"
          width={180}
          config={{
            text: trans("componentDoc.submit"),
            alignment: "center",
          }}
          compFactory={ToggleButtonComp}
        />
        <Example
          title="Content Alignment - Justified"
          width={180}
          config={{
            text: trans("componentDoc.submit"),
            alignment: "stretch",
          }}
          compFactory={ToggleButtonComp}
        />
      </ExampleGroup>
    </>
  );
}
