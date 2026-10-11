import { TextAreaComp } from "comps/comps/textInputComp/textAreaComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function ButtonExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.placeholder")}
          config={{
            placeholder: trans("componentDoc.pleaseInputName"),
            disabled: false,
          }}
          compFactory={TextAreaComp}
        />
        <Example
          title="Default Value"
          config={{
            placeholder: trans("componentDoc.pleaseInputName"),
            disabled: false,
            defaultValue: "Enter your details!",
          }}
          compFactory={TextAreaComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          config={{
            placeholder: trans("componentDoc.pleaseInputName"),
            disabled: true,
          }}
          compFactory={TextAreaComp}
        />
        <Example
          title="Hiding the Text Area component"
          config={{
            placeholder: trans("componentDoc.pleaseInputName"),
            hidden: true,
          }}
          compFactory={TextAreaComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.labelText")} description="">
        <Example
          title="Left - Left Alignment"
          config={{
            label: { text: trans("componentDoc.userName"), position: "row" },
            placeholder: trans("componentDoc.pleaseInputName"),
          }}
          compFactory={TextAreaComp}
        />
        <Example
          title="Left - Rightt Alignment"
          config={{
            placeholder: trans("componentDoc.pleaseInputName"),
            label: { text: trans("componentDoc.userName"), align: "right" },
          }}
          compFactory={TextAreaComp}
        />
        <Example
          title="Top - Left Alignment"
          config={{
            label: { text: trans("componentDoc.userName"), position: "column" },
            placeholder: trans("componentDoc.pleaseInputName"),
          }}
          compFactory={TextAreaComp}
        />
        <Example
          title="Top - Rightt Alignment"
          config={{
            label: { text: trans("componentDoc.userName"), position: "column", align: "right" },
            placeholder: trans("componentDoc.pleaseInputName"),
          }}
          compFactory={TextAreaComp}
        />
        <Example
          title="Tooltip"
          config={{
            label: { text: trans("componentDoc.userName"), tooltip:"This is Tooltip on Text Area component" },
            placeholder: trans("componentDoc.pleaseInputName"),
          }}
          compFactory={TextAreaComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.validation")} description="">
        <Example
          title={trans("componentDoc.required")}
          width={340}
          config={{
            label: { text: trans("componentDoc.userName") },
            placeholder: trans("componentDoc.pleaseInputName"),
            required: true,
          }}
          compFactory={TextAreaComp}
        />
        <Example
          title={trans("componentDoc.length")}
          width={340}
          config={{
            label: { text: trans("componentDoc.userName") },
            placeholder: trans("componentDoc.pleaseInputName"),
            minLength: 3,
            maxLength: 6,
          }}
          compFactory={TextAreaComp}
        />
        <Example
          title="Show Clear Button & Show Validation on Empty/Reset"
          width={340}
          config={{
            label: { text: trans("componentDoc.userName") },
            defaultValue: "Enter your details",
            required: true,
            allowClear: true,
            showValidationWhenEmpty: true,
          }}
          compFactory={TextAreaComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.autoHeight")} description="">
        <Example
          title={trans("componentDoc.fixed")}
          width={340}
          config={{
            label: { text: trans("componentDoc.userName") },
            autoHeight: "fixed",
            textAreaScrollBar: true,
          }}
          compFactory={TextAreaComp}
        />
        <Example
          title={trans("componentDoc.auto")}
          width={340}
          config={{
            label: { text: trans("componentDoc.userName") },
            autoHeight: "auto",
          }}
          compFactory={TextAreaComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties of the Checkbox Component."
      >
        <Example
          title="Select component Styling properties"
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
          compFactory={TextAreaComp}
        />
        <Example
          title="Label Styling properties"
          config={{
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
          compFactory={TextAreaComp}
        />
        <Example
          title="Input Field Styling properties"
          config={{
            inputFieldStyle: {
              "background": "#F20B0B",
              "padding": "10px",
              "textTransform": "Uppercase",
              "textDecoration": "underline",
              "textSize": "20px",
              "textWeight": "bold",
              "fontStyle": "italic",
              "border": "#222222",
              "borderStyle": "dashed",
              "radius": "11px",
              "borderWidth": "3px",
              "accent": "#0EDF99",
              "validate": "#36B389",
              "text": "#FFF",
            },
          }}
          compFactory={TextAreaComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the CheckBox Component."
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
          compFactory={TextAreaComp}
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
          compFactory={TextAreaComp}
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
          compFactory={TextAreaComp}
        />
      </ExampleGroup>
    </>
  );
}
