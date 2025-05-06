import { MentionComp } from "comps/comps/textInputComp/mentionComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function MentionCompExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Mention Component."
      >
        <Example
          title="Default Component"
          config={{
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Placeholder Value"
          config={{
            placeholder: "Type @ to see the data",
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Default Value"
          config={{
            value: "John Doe",
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Disabling the Mention Component"
          config={{
            disabled: true,
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Hiding the Mention Component"
          config={{
            hidden: true,
          }}
          compFactory={MentionComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Label Properties"
        description="The Following Examples Show the Label Properties of the Mention Component."
      >
        <Example
          title="Label Name"
          width={500}
          config={{
            label: {
              "text": "Mention Component",
            },
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Label Tooltip"
          width={500}
          config={{
            label: {
              "text": "Mention Component",
              "tooltip": "This is a Mention Component"
            },
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Label Position & Alignment - Left & Left"
          width={500}
          config={{
            label: {
              "text": "Mention Component",
              "position": "row",
              "align": "left"
            },
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Label Position & Alignment - Left & Right"
          width={500}
          config={{
            label: {
              "text": "Mention Component",
              "position": "row",
              "align": "right"
            },
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Label Position & Alignment - Top & Left"
          width={500}
          config={{
            label: {
              "text": "Mention Component",
              "position": "column",
              "align": "left"
            },
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Label Position & Alignment - Top & Right"
          width={500}
          config={{
            label: {
              "text": "Mention Component",
              "position": "column",
              "align": "right"
            },
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Label Width - 10%"
          width={500}
          config={{
            label: {
              "text": "Mention Component",
              "width": "10",
              "widthUnit": "%",
            },
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Label Width - 30%"
          config={{
            label: {
              "text": "Mention Component",
              "width": "47",
              "widthUnit": "%",
            },
          }}
          compFactory={MentionComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties on the Segmented Control Component."
      >
        <Example
          title="Background Color, Border Radius,Style,Width,Color"
          config={{
            style: {
              "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
              "border": "#0139FF",
              "borderStyle": "dashed",
              "radius": "10px",
              "borderWidth": "2px",
              "accent": "#FAD301",
            },
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Margin & Padding"
          config={{
            style: {
              "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
              "margin": "5px",
              "padding": "10px",
              "border": "#0139FF",
              "borderStyle": "dashed",
              "radius": "10px",
              "borderWidth": "2px",
              "accent": "#FAD301",
            },
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Text Color, Size, Weight, Font family, Border properties"
          config={{
            style: {
              "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
              "margin": "5px",
              "padding": "10px",
              "text": "#FF0404",
              "textTransform": "uppercase",
              "textDecoration": "underline",
              "textSize": "20px",
              "textWeight": "bold",
              "fontFamily": "Courier New",
              "fontStyle": "oblique",
              "border": "#0139FF",
              "borderStyle": "dashed",
              "radius": "10px",
              "borderWidth": "2px",
              "accent": "#FAD301",
            },
          }}
          compFactory={MentionComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the Segmented Control Component."
      >
        <Example
          title="Bounce Animation"
          config={{
            animationStyle: {
              "animation": "bounce",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={MentionComp}
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
          compFactory={MentionComp}
        />
        <Example
          title="Tada Animation"
          config={{
            animationStyle: {
              "animation": "tada",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={MentionComp}
        />
      </ExampleGroup>
    </>
  );
}
