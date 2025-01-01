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
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.default")}
          config={{ 
            buttons: buttons,
            buttonTheme: "primary",
            icon: "/icon:antd/questioncircleoutlined",
            includeMargin: true,
            preventStyleOverwriting: false,
            shape: "circle",
            value: "",
        }}
          compFactory={FloatButtonComp}
        />
      </ExampleGroup>
      
    </>
  );
}
