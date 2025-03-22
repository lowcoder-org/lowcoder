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
          height={150}
          config={{ 
            buttons: buttons,
        }}
          compFactory={FloatButtonComp}
        />
        <Example
          title="Hiding the Float Button"
          height={150}
          config={{ 
            buttons: buttons,
            hidden: true,
        }}
          compFactory={FloatButtonComp}
        />
        <Example
          title="Different Icon on Float Button"
          height={150}
          config={{ 
            buttons: buttons,
            icon: "/icon:solid/align-justify",
        }}
          compFactory={FloatButtonComp}
        />
        <Example
          title="Button Theme - Default"
          height={150}
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
          height={150}
          config={{ 
            buttons: buttons,
            shape: "square",
        }}
          compFactory={FloatButtonComp}
        />
        <Example
          title="Show Badge - True"
          height={150}
          config={{ 
            buttons: buttons,
            dot: true,
        }}
          compFactory={FloatButtonComp}
        />
        <Example
          title="Show Badge - False"
          height={150}
          config={{ 
            buttons: buttons,
        }}
          compFactory={FloatButtonComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties of the Float Button Component."
      >
        <Example
          title="Badge Color"
          height={150}
          config={{ 
            buttons: buttons,
            dot: true,
            badgeStyle: {
              "badgeColor": "#E68E50",
            },
        }}
          compFactory={FloatButtonComp}
        />
        <Example
          title="Styling properties"
          height={150}
          config={{ 
            buttons: buttons,
            style: {
              "background": "linear-gradient(90deg, #fa709a 0%, #fee140 100%)",
              "border": "#3377FF",
              "borderStyle": "dashed",
              "borderWidth": "3px"
          },
        }}
          compFactory={FloatButtonComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the Float Button Component."
      >
        <Example
          title="Bounce Animation"
          height={150}
          config={{
            animationStyle: {
              "animation": "bounce",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={FloatButtonComp}
        />
        <Example
          title="Swing Animation"
          height={150}
          config={{
            animationStyle: {
              "animation": "swing",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={FloatButtonComp}
        />
        <Example
          title="Tada Animation"
          height={150}
          config={{
            animationStyle: {
              "animation": "tada",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={FloatButtonComp}
        />
      </ExampleGroup>
      
    </>
  );
}
