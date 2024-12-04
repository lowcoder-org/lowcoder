import { FloatButtonComp } from "comps/comps/buttonComp/floatButtonComp"
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function FloatButtonExample() {
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
          compFactory={FloatButtonComp}
        />
        <Example
          title={trans("componentDoc.loading")}
          width={120}
          config={{ 
            text: trans("componentDoc.submit"), 
            loading: true 
        }}
          compFactory={FloatButtonComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          width={120}
          config={{
            text: trans("componentDoc.submit"), 
            disabled: true 
        }}
          compFactory={FloatButtonComp}
        />
      </ExampleGroup>
      
    </>
  );
}
