import { ProgressCircleComp } from "comps/comps/progressCircleComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function ProgressCircleExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.notComplete")}
          config={{
            value: "60",
          }}
          compFactory={ProgressCircleComp}
        />
        <Example
          title={trans("componentDoc.complete")}
          config={{
            value: "100",
          }}
          compFactory={ProgressCircleComp}
        />
        <Example
          title="Hiding the Progress Circle component"
          config={{
            hidden: true,
          }}
          compFactory={ProgressCircleComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties on the Progress Bar Component."
      >
      <Example
        title="Margin & Padding"
        config={{
          style:{
            "margin": "10px",
            "padding": "50px",
          },
        }}
        compFactory={ProgressCircleComp}
      />
      <Example
        title="Text Properties"
        config={{
          style:{
            "text": "#E67373",
            "textSize": "50px",
            "textWeight": "bold",
            "fontStyle": "italic",
          },
        }}
        compFactory={ProgressCircleComp}
      />
      <Example
        title="Track Color"
        config={{
          value: "20",
          style:{
            "track": "#E68E50",
          },
        }}
        compFactory={ProgressCircleComp}
      />
      <Example
        title="Fill Color"
        config={{
          value: "70",
          style:{
            "fill": "#36b389",
          },
        }}
        compFactory={ProgressCircleComp}
      />
      <Example
        title="Success Color"
        config={{
          value: "100",
          style:{
            "success": "#D7D9E0",
          },
        }}
        compFactory={ProgressCircleComp}
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
          compFactory={ProgressCircleComp}
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
          compFactory={ProgressCircleComp}
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
          compFactory={ProgressCircleComp}
        />
      </ExampleGroup>
    </>
  );
}
