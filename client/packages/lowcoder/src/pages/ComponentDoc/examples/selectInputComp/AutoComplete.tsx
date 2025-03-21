import { AutoCompleteComp } from "comps/comps/autoCompleteComp/autoCompleteComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const items= "[\n  {\n    \"value\": \"1-BeiJing\",\n    \"label\": \"Beijing\"\n  },\n  {\n    \"value\": \"2-ShangHai\",\n    \"label\": \"Shanghai\"\n  },\n  {\n    \"value\": \"3-GuangDong\",\n    \"label\": \"Guandong\"\n  },\n  {\n    \"value\": \"4-ShenZhen\",\n    \"label\": \"Shenzhen\"\n  }\n]";

export default function AutoCompleteExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Auto-Complete Component."
      >
        <Example
          title="A simple Auto-Complete Component"
          config={{
            items: items,
          }}
          compFactory={AutoCompleteComp}
        />
        <Example
          title="Hiding the Auto-Complete Component"
          config={{
            items: items,
            hidden: true,
          }}
          compFactory={AutoCompleteComp}
        />
        <Example
          title="Disabling the Auto-Complete Component"
          config={{
            items: items,
            disabled: true,
          }}
          compFactory={AutoCompleteComp}
        />
        <Example
          title="Auto-Complete Component - Placeholder"
          config={{
            items: items,
            placeholder: "This is an Auto-Complete Component",
          }}
          compFactory={AutoCompleteComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Label & Layout"
        description="The Following Examples Show the Layout of the Auto-Complete Component."
      >
        <Example
          title="Left-Left Alignment"
          config={{
            items: items,
            label:{
              align: "left",
              position: "row",
            }
          }}
          compFactory={AutoCompleteComp}
        />
        <Example
          title="Left-Right Alignment"
          config={{
            items: items,
            label:{
              align: "right",
              position: "row",
            }
          }}
          compFactory={AutoCompleteComp}
        />
        <Example
          title="Top-Left Alignment"
          config={{
            items: items,
            label:{
              align: "left",
              position: "column",
            }
          }}
          compFactory={AutoCompleteComp}
        />
        <Example
          title="Top-Right Alignment"
          config={{
            items: items,
            label:{
              align: "right",
              position: "column",
            }
          }}
          compFactory={AutoCompleteComp}
        />
        <Example
          title="Tooltip"
          config={{
            items: items,
            label:{
              tooltip: "This is a Tooltip on Auto-Complete component",
            }
          }}
          compFactory={AutoCompleteComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties of the Auto-Complete Component."
      >
        <Example
          title="Select component Styling properties"
          config={{
            items: items,
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
          compFactory={AutoCompleteComp}
        />
        <Example
          title="Label Styling properties"
          config={{
            items: items,
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
          compFactory={AutoCompleteComp}
        />
        <Example
          title="Input Field Styling properties"
          config={{
            items: items,
            inputFieldStyle: {
              "background": "linear-gradient(45deg, #d53369 0%, #daae51 100%)",
              "border": "#222222",
              "radius": "10px",
              "text": "#222222",
              "margin": "5px",
              "padding": "10px",
              "borderStyle": "dashed",
              "borderWidth": "3px",
              "accent": "#36B389"
            },
          }}
          compFactory={AutoCompleteComp}
        />
        <Example
          title="Children Input Field Styling properties"
          config={{
            items: items,
            childrenInputFieldStyle: {
              "margin": "5px",
              "padding": "20px",
              "text": "#3377FF",
              "textDecoration": "underline",
              "textSize": "15px",
              "textWeight": "bold",
              "fontFamily": "Courier New",
              "fontStyle": "italic",
              "border": "#36B389",
              "borderStyle": "solid",
              "radius": "10px",
              "borderWidth": "3px",
              "background": "#11F7E9"
            },
          }}
          compFactory={AutoCompleteComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the CheckBox Component."
      >
        <Example
          title="Bounce Animation"
          config={{
            items: items,
            animationStyle: {
              "animation": "bounce",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={AutoCompleteComp}
        />
        <Example
          title="Swing Animation"
          config={{
            items: items,
            animationStyle: {
              "animation": "swing",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={AutoCompleteComp}
        />
        <Example
          title="Tada Animation"
          config={{
            items: items,
            animationStyle: {
              "animation": "tada",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={AutoCompleteComp}
        />
      </ExampleGroup>
    </>
  );
}
