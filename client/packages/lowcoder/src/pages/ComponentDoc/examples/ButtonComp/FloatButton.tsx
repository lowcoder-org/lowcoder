import { FloatButtonComp } from "comps/comps/buttonComp/floatButtonComp"
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const buttons = {
  "manual": [
      {
          "id": 0,
          "label": "Option 1",
          "badge": "1",
          "description": "",
          "icon": "/icon:antd/filetextoutlined"
      },
      {
          "id": 1,
          "label": "Option 2",
          "badge": "0",
          "description": "",
          "icon": "/icon:antd/filetextoutlined"
      }
  ]
};

export default function FloatButtonExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Float Button Component."
      >
        <Example
          title="A Simple Float Button"
          config={{ 
            buttons: buttons,
        }}
          compFactory={FloatButtonComp}
        />
        <Example
          title="Hiding the Float Button"
          config={{ 
            buttons: buttons,
            hidden: true,
        }}
          compFactory={FloatButtonComp}
        />
        <Example
          title="Different Icon on Float Button"
          config={{ 
            buttons: buttons,
            icon: "/icon:solid/align-justify",
        }}
          compFactory={FloatButtonComp}
        />
        <Example
          title="Button Theme - Default"
          config={{ 
            buttons: buttons,
            buttonTheme: "default",
            icon: "/icon:solid/align-justify",
            includeMargin: true,
            preventStyleOverwriting: false,
            value: "",
        }}
          compFactory={FloatButtonComp}
        />
        <Example
          title="Button Shape - Square"
          config={{ 
            buttons: buttons,
            shape: "square",
        }}
          compFactory={FloatButtonComp}
        />
      </ExampleGroup>
      
    </>
  );
}
