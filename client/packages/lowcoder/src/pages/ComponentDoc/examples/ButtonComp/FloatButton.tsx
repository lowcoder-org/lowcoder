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
          config={{ 
            icon: "/icon:antd/questioncircleoutlined",
            value: "",
            shape: "circle",
            manual: [
              {
                badge: "1",
                description: "",
                icon: "/icon:antd/filetextoutlined",
                id: 0,
                label: "Option 1"
              },
              {
                badge: "1",
                description: "",
                icon: "/icon:antd/filetextoutlined",
                id: 1,
                label: "Option 2"
              }
            ]

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
