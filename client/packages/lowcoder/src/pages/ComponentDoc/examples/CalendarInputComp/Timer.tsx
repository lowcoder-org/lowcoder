import { TimerComp } from "comps/comps/timerComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function TimerExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Timer Component."
        >
          <Example
            title="Default Value"
            config={{
                defaultValue: "00:00:03:000",
            }}
            compFactory={TimerComp}
          />
          <Example
            title="Hide Buttons"
            config={{
                defaultValue: "00:00:00:000",
                hideButton: true,
            }}
            compFactory={TimerComp}
          />
          <Example
            title="Hiding the Timer component"
            config={{
                defaultValue: "00:00:00:000",
                hidden: true,
            }}
            compFactory={TimerComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Styling Properties"
          description="The Following Examples Show the different Styling properties of the Timer Component."
        >
          <Example
            title="Timer component Styling properties"
            config={{
              style: {
                "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                "margin": "10px",
                "padding": "10px",
                "text": "#222222",
                "textSize": "20px",
                "textWeight": "bold",
                "fontStyle": "italic",
                "border": "#222222",
                "borderStyle": "solid",
                "radius": "10px",
                "borderWidth": "2px",
              },
            }}
            compFactory={TimerComp}
          />
          <Example
            title="Start Button Styling properties"
            config={{
              startButtonStyle: {
                "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                "margin": "5px",
                "padding": "10px",
                "text": "#FF0101",
                "textSize": "25px",
                "textWeight": "bold",
                "fontStyle": "italic",
                "border": "#222222",
                "borderStyle": "dashed",
                "radius": "10px",
                "borderWidth": "2px"
              },
            }}
            compFactory={TimerComp}
          />
          <Example
            title="Reset Button Styling properties"
            config={{
              startButtonStyle: {
                "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                "margin": "5px",
                "padding": "10px",
                "text": "#FF0101",
                "textSize": "25px",
                "textWeight": "bold",
                "fontStyle": "italic",
                "border": "#222222",
                "borderStyle": "dashed",
                "radius": "10px",
                "borderWidth": "2px"
              },
              resetButtonStyle: {
                "background": "#FC0101",
                "margin": "5px",
                "padding": "10px",
                "text": "#fff",
                "textSize": "25px",
                "textWeight": "bold",
                "fontStyle": "italic",
                "border": "#FFFFFF",
                "borderStyle": "dashed",
                "radius": "10px",
                "borderWidth": "3px",
              },
            }}
            compFactory={TimerComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Animation Style"
          description="The Following Examples Show different Animation Styles on the Timer Component."
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
            compFactory={TimerComp}
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
            compFactory={TimerComp}
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
            compFactory={TimerComp}
          />
        </ExampleGroup>
      </>
    );
  }