import { SwitchComp } from "comps/comps/switchComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function SwitchExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.open")}
          config={{
            value: "true",
          }}
          compFactory={SwitchComp}
        />
        <Example
          title={trans("componentDoc.close")}
          config={{
            value: "false",
          }}
          compFactory={SwitchComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          config={{
            value: "true",
            disabled: true,
          }}
          compFactory={SwitchComp}
        />
        <Example
          title="Hiding the Switch component"
          config={{
            value: "true",
            hidden: true,
          }}
          compFactory={SwitchComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.labelText")} description="">
        <Example
          title={trans("componentDoc.leftLeftAlign")}
          config={{
            value: "true",
            label: {
              text: trans("componentDoc.labelText"),
              position: "row",
              align: "left",
            },
          }}
          compFactory={SwitchComp}
        />
        <Example
          title={trans("componentDoc.leftRightAlign")}
          config={{
            value: "true",
            label: {
              text: trans("componentDoc.labelText"),
              position: "row",
              align: "right",
            },
          }}
          compFactory={SwitchComp}
        />
        <Example
          title={trans("componentDoc.topLeftAlign")}
          config={{
            value: "true",
            label: {
              text: trans("componentDoc.labelText"),
              position: "column",
              align: "left",
            },
          }}
          compFactory={SwitchComp}
        />
        <Example
          title={trans("componentDoc.topRightAlign")}
          config={{
            value: "true",
            label: {
              text: trans("componentDoc.labelText"),
              position: "column",
              align: "right",
            },
          }}
          compFactory={SwitchComp}
        />
        <Example
          title="Tooltip on Hover"
          config={{
            value: "true",
            label: {
              text: trans("componentDoc.labelText"),
              tooltip: "This is a tooltip on Switch component"
            },
          }}
          compFactory={SwitchComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties on the Switch Component."
      >
        <Example
          title="Background Color, Border Radius,Style,Width,Color"
          config={{
            value: "true",
            style: {
              "background": "#00FFFF",
              "border": "#3377FF",
              "radius": "10px",
              "borderWidth": "3px",
              "borderStyle": "solid",
            },
          }}
          compFactory={SwitchComp}
        />
        <Example
          title="Margin & Padding"
          config={{
            value: "true",
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
          compFactory={SwitchComp}
        />
        <Example
          title="Opacity - 0.2"
          config={{
            value: "true",
            style: {
              "opacity": "0.2",
            },
          }}
          compFactory={SwitchComp}
        />
        <Example
          title="Opacity - 0.5"
          width={500}
          config={{
            value: "true",
            style: {
              "opacity": "0.5",
            },
          }}
          compFactory={SwitchComp}
        />
        <Example
          title="Opacity - 0.7"
          config={{
            value: "true",
            style: {
              "opacity": "0.7",
            },
          }}
          compFactory={SwitchComp}
        />
        <Example
          title="Opacity - 1"
          config={{
            value: "true",
            style: {
              "opacity": "1",
            },
          }}
          compFactory={SwitchComp}
        />
        <Example
          title="Rotation - 90deg"
          width={500}
          config={{
            value: "true",
            style: {
              "rotation": "90deg",
            },
          }}
          compFactory={SwitchComp}
        />
        <Example
          title="Label - Text Color, Size, Weight, Font family, Border properties"
          config={{
            value: "true",
            labelStyle: {
              "margin": "5px",
              "padding": "5px",
              "label": "#3377FF",
              "textTransform": "Uppercase",
              "textDecoration": "underline",
              "textSize": "13px",
              "textWeight": "bold",
              "fontFamily": "Courier New",
              "fontStyle": "Italic",
              "border": "#36B389",
              "borderStyle": "solid",
              "borderWidth": "2px"
            },
          }}
          compFactory={SwitchComp}
        />
        <Example
          title="Input Field Style"
          config={{
            inputFieldStyle: {
              "handle": "#D71616",
              "unchecked": "#F7DF01",
              "checked": "#36B389",
            },
          }}
          compFactory={SwitchComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the Switch Component."
      >
        <Example
          title="Bounce Animation"
          config={{
            value: "true",
            animationStyle: {
              "animation": "bounce",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={SwitchComp}
        />
        <Example
          title="Swing Animation"
          config={{
            animationStyle: {
              "animation": "swing",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={SwitchComp}
        />
        <Example
          title="Tada Animation"
          config={{
            value: "true",
            animationStyle: {
              "animation": "tada",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={SwitchComp}
        />
      </ExampleGroup>
    </>
  );
}
