import { ProgressComp } from "comps/comps/progressComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function ProgressExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Progress Bar Component."
      >
        <Example
          title="Default Component"
          config={{
          }}
          compFactory={ProgressComp}
        />
        <Example
          title="Showing Progress Value"
          config={{
            value: "80",
            showInfo: true,
          }}
          compFactory={ProgressComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Other Examples"
        description="The Following Examples Show the different examples on the Progress Bar Component."
      >
        <Example
          title="Hiding the Progress Bar component"
          config={{
            hidden: true,
          }}
          compFactory={ProgressComp}
        />
        <Example
          title={trans("componentDoc.notComplete")}
          config={{
            value: "60",
            showInfo: true,
          }}
          compFactory={ProgressComp}
        />
        <Example
          title={trans("componentDoc.complete")}
          config={{
            value: "100",
            showInfo: true,
          }}
          compFactory={ProgressComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties on the Progress Bar Component."
      >
      <Example
        title="Margin & Padding"
        config={{
          showInfo: true,
          style:{
            "margin": "10px",
            "padding": "50px",
          },
        }}
        compFactory={ProgressComp}
      />
      <Example
        title="Text Properties"
        config={{
          showInfo: true,
          style:{
            "text": "#E67373",
            "textSize": "25px",
            "textWeight": "bold",
            "fontStyle": "italic",
          },
        }}
        compFactory={ProgressComp}
      />
      <Example
        title="Track Color"
        config={{
          showInfo: true,
          value: "20",
          style:{
            "track": "#E68E50",
          },
        }}
        compFactory={ProgressComp}
      />
      <Example
        title="Fill Color"
        config={{
          showInfo: true,
          value: "70",
          style:{
            "fill": "#36b389",
          },
        }}
        compFactory={ProgressComp}
      />
      <Example
        title="Success Color"
        config={{
          showInfo: true,
          value: "100",
          style:{
            "success": "#D7D9E0",
          },
        }}
        compFactory={ProgressComp}
      />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the Progress Bar Component."
      >
        <Example
          title="Bounce Animation"
          config={{
            showInfo: true,
            animationStyle: {
              "animation": "bounce",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={ProgressComp}
        />
        <Example
          title="Swing Animation"
          config={{
            showInfo: true,
            animationStyle: {
              "animation": "swing",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={ProgressComp}
        />
        <Example
          title="Tada Animation"
          config={{
            showInfo: true,
            animationStyle: {
              "animation": "tada",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={ProgressComp}
        />
      </ExampleGroup>
    </>
  );
}
