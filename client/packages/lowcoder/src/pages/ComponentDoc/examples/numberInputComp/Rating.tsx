import { RatingComp } from "comps/comps/ratingComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function RatingExample() {
  const nameMap: Record<string, string> = {
    max: trans("componentDoc.maxRating"),
  };
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.default")}
          config={{
            defaultValue: "4",
            disabled: "false",
          }}
          compFactory={RatingComp}
        />
        <Example
          title={trans("componentDoc.notSelect")}
          config={{
            disabled: "false",
            defaultValue: "0",
          }}
          compFactory={RatingComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          config={{
            disabled: "true",
            defaultValue: "2",
          }}
          compFactory={RatingComp}
        />
        <Example
          title="Hiding the Rating component"
          config={{
            hidden: "true",
            defaultValue: "2",
          }}
          compFactory={RatingComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.labelText")} description="">
        <Example
          title={trans("componentDoc.leftLeftAlign")}
          config={{
            label: {
              text: trans("componentDoc.labelText"),
              position: "row",
              align: "left",
            },
            defaultValue: "4",
          }}
          compFactory={RatingComp}
        />
        <Example
          title={trans("componentDoc.leftRightAlign")}
          config={{
            label: {
              text: trans("componentDoc.labelText"),
              position: "row",
              align: "right",
            },
            defaultValue: "4",
          }}
          compFactory={RatingComp}
        />
        <Example
          title={trans("componentDoc.topLeftAlign")}
          config={{
            label: {
              text: trans("componentDoc.labelText"),
              position: "column",
              align: "left",
            },
            defaultValue: "4",
          }}
          compFactory={RatingComp}
        />
        <Example
          title={trans("componentDoc.topRightAlign")}
          config={{
            label: {
              text: trans("componentDoc.labelText"),
              position: "column",
              align: "right",
            },
            defaultValue: "4",
          }}
          compFactory={RatingComp}
        />
        <Example
          title="Tooltip"
          config={{
            label: {
              text: trans("componentDoc.labelText"),
              tooltip: "This is a Tooltip on Rating component"
            },
            defaultValue: "4",
          }}
          compFactory={RatingComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.style")}>
        <Example
          title={trans("componentDoc.maxRating")}
          config={{
            defaultValue: "4",
            max: "6",
          }}
          nameMap={nameMap}
          compFactory={RatingComp}
        />
        <Example
          title={trans("componentDoc.halfSelect")}
          config={{
            max: "6",
            defaultValue: "3.5",
            allowHalf: "true",
          }}
          compFactory={RatingComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties of the Checkbox Component."
      >
        <Example
          title="Select component Styling properties"
          config={{
            defaultValue: "2",
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
          compFactory={RatingComp}
        />
        <Example
          title="Label Styling properties"
          config={{
            defaultValue: "3",
            labelStyle: {
              "margin": "5px",
              "padding": "5px",
              "label": "#01865B",
              "textTransform": "Uppercase",
              "textDecoration": "underline",
              "textSize": "18px",
              "textWeight": "bold",
              "fontStyle": "italic",
              "border": "#222222",
              "borderWidth": "2px",
              "borderStyle": "solid",
            },
          }}
          compFactory={RatingComp}
        />
        <Example
          title="Input Field Styling properties"
          config={{
            defaultValue: "4",
            inputFieldStyle: {
              "checked": "#36B389",
              "unchecked": "#D7D9E0",
              "margin": "5px"
            },
          }}
          compFactory={RatingComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the CheckBox Component."
      >
        <Example
          title="Bounce Animation"
          config={{
            defaultValue: "2",
            animationStyle: {
              "animation": "bounce",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={RatingComp}
        />
        <Example
          title="Swing Animation"
          config={{
            defaultValue: "3",
            animationStyle: {
              "animation": "swing",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={RatingComp}
        />
        <Example
          title="Tada Animation"
          config={{
            defaultValue: "4",
            animationStyle: {
              "animation": "tada",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={RatingComp}
        />
      </ExampleGroup>
    </>
  );
}
