import { IconComp } from "comps/comps/iconComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function IconExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Icon Component."
        >
          <Example
            title="A simple Icon component"
            width={120}
            height={60}
            config={{
              icon: "/icon:antd/homefilled",
            }}
            compFactory={IconComp}
          />
          <Example
            title="Hiding the Icon component"
            width={120}
            height={60}
            config={{
              icon: "/icon:solid/angles-down",
              hidden: true,
            }}
            compFactory={IconComp}
          />
          <Example
            title="Icon Size - Auto"
            width={120}
            height={60}
            config={{
              icon: "/icon:solid/apple-whole",
              autoHeight: "auto",
            }}
            compFactory={IconComp}
          />
          <Example
            title="Icon Size - Fixed"
            width={120}
            height={60}
            config={{
              icon: "/icon:solid/arrows-spin",
              autoHeight: "fixed",
              iconSize: "30",
            }}
            compFactory={IconComp}
          />
          <Example
            title="Icon Size - Fixed"
            width={120}
            config={{
              icon: "/icon:solid/arrows-spin",
              autoHeight: "fixed",
              iconSize: "60",
            }}
            compFactory={IconComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Styling Properties"
          description="The Following Examples Show the different Styling properties of the Icon Component."
        >
          <Example
            title="Background & Fill Color"
            width={120}
            config={{
              icon: "/icon:antd/homefilled",
              autoHeight: "fixed",
              iconSize: "60",
              style: {
                "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                "fill": "#E67373",
              },
            }}
            compFactory={IconComp}
          />
          <Example
            title="Border Style, Radius & Width"
            width={120}
            config={{
              icon: "/icon:antd/homefilled",
              autoHeight: "fixed",
              iconSize: "60",
              style:{
                "border": "#E68E50",
                "radius": "10px",
                "borderWidth": "3px"
              },
            }}
            compFactory={IconComp}
          />
          <Example
            title="Margin & Padding"
            width={120}
            config={{
              icon: "/icon:antd/homefilled",
              autoHeight: "fixed",
              iconSize: "60",
              style:{
                "border": "#E68E50",
                "radius": "10px",
                "borderWidth": "3px",
                "margin": "5px",
                "padding": "10px",
              },
            }}
            compFactory={IconComp}
          />
          <Example
            title="Rotation - 45 Deg"
            width={120}
            config={{
              icon: "/icon:antd/homefilled",
              autoHeight: "fixed",
              iconSize: "60",
              style:{
                "rotation": "45deg",
              },
            }}
            compFactory={IconComp}
          /> 
          <Example
            title="Rotation - 135 Deg"
            width={120}
            config={{
              icon: "/icon:antd/homefilled",
              autoHeight: "fixed",
              iconSize: "60",
              style:{
                "rotation": "135deg",
              },
            }}
            compFactory={IconComp}
          />              
        </ExampleGroup>

        <ExampleGroup
          title="Animation Style"
          description="The Following Examples Show different animations on the Icons Component."
        >
          <Example
            title="Bounce Animation"
            width={120}
            config={{
              icon: "/icon:antd/homefilled",
              autoHeight: "fixed",
              iconSize: "60",
              animationStyle: {
                "animation": "bounce",
                "animationDelay": "1s",
                "animationDuration": "3s",
                "animationIterationCount": "infinite"
              },
            }}
            compFactory={IconComp}
          />
          <Example
            title="Swing Animation"
            width={120}
            config={{
              icon: "/icon:antd/homefilled",
              autoHeight: "fixed",
              iconSize: "60",
              animationStyle: {
                "animation": "swing",
                "animationDelay": "1s",
                "animationDuration": "3s",
                "animationIterationCount": "infinite"
              },
            }}
            compFactory={IconComp}
          />
          <Example
            title="Tada Animation"
            width={120}
            config={{
              icon: "/icon:antd/homefilled",
              autoHeight: "fixed",
              iconSize: "60",
              animationStyle: {
                "animation": "tada",
                "animationDelay": "1s",
                "animationDuration": "3s",
                "animationIterationCount": "infinite"
              },
            }}
            compFactory={IconComp}
          />
        </ExampleGroup>
      </>
    );
  }