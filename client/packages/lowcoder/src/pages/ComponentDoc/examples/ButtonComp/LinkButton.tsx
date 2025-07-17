import { LinkComp } from "comps/comps/buttonComp/linkComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function LinkExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Link Component."
      >
        <Example
          title={trans("componentDoc.default")}
          config={{ text: trans("componentDoc.link") }}
          compFactory={LinkComp}
        />
        <Example
          title={trans("componentDoc.loading")}
          config={{ text: trans("componentDoc.link"), loading: true }}
          compFactory={LinkComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          config={{ text: trans("componentDoc.link"), disabled: true }}
          compFactory={LinkComp}
        />
        <Example
          title="Hiding the Link component"
          config={{ text: trans("componentDoc.link"), hidden: true }}
          compFactory={LinkComp}
        />
      </ExampleGroup>

      <ExampleGroup 
        title="Layout Options"
        description="The Following Examples Show the Layout Options of the Link Component."
      >
        <Example
          title="Prefix Icon"
          config={{
            prefixIcon: "/icon:solid/arrow-down-wide-short",
          }}
          compFactory={LinkComp}
        />
        <Example
          title="Suffix Icon"
          config={{
            suffixIcon: "/icon:solid/arrow-up-wide-short",
          }}
          compFactory={LinkComp}
        />
        <Example
          title="Prefix & Suffix Icon"
          config={{
            prefixIcon: "/icon:solid/arrow-down-wide-short",
            suffixIcon: "/icon:solid/arrow-up-wide-short",
          }}
          compFactory={LinkComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties on the Link Component."
      >
        <Example
          title="Background Color, Border Radius,Style,Width,Color"
          config={{
            style: {
              "background": "#00FFFF",
              "border": "#3377FF",
              "radius": "10px",
              "borderWidth": "3px",
              "borderStyle": "solid",
              "hoverText": "#36B389",
              "activeText": "#222222",
            },
          }}
          compFactory={LinkComp}
        />
        <Example
          title="Margin & Padding"
          config={{
            style: {
              "background": "#00FFFF",
              "border": "#3377FF",
              "radius": "10px",
              "borderWidth": "3px",
              "margin": "10px",
              "padding": "10px",
              "borderStyle": "dashed",
            },
          }}
          compFactory={LinkComp}
        />
        <Example
          title="Rotation - 90deg"
          config={{
            style: {
              "rotation": "90deg",
            },
          }}
          compFactory={LinkComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the Link Component."
      >
        <Example
          title="Bounce Animation"
          config={{
            animationStyle: {
              "animation": "bounce",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite",
            },
          }}
          compFactory={LinkComp}
        />
        <Example
          title="Swing Animation"
          config={{
            animationStyle: {
              "animation": "swing",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite",
            },
          }}
          compFactory={LinkComp}
        />
        <Example
          title="Tada Animation"
          config={{
            animationStyle: {
              "animation": "tada",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite",
            },
          }}
          compFactory={LinkComp}
        />
      </ExampleGroup>
    </>
  );
}
