import { InputComp } from "comps/comps/textInputComp/inputComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function InputExample() {
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
          }}
          compFactory={InputComp}
        />
        <Example
          title="Default Value"
          config={{
            placeholder: trans("componentDoc.pleaseInputName"),
            defaultValue: "Default Text",
          }}
          compFactory={InputComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          config={{
            placeholder: trans("componentDoc.pleaseInputName"),
            disabled: true,
          }}
          compFactory={InputComp}
        />
        <Example
          title="Hiding the Input component"
          config={{
            placeholder: trans("componentDoc.pleaseInputName"),
            hidden: true,
          }}
          compFactory={InputComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.labelText")} description="">
        <Example
          title="Left- Left Alignment"
          config={{
            label: { text: trans("componentDoc.userName"), position: "row" },
            placeholder: trans("componentDoc.pleaseInputName"),
          }}
          compFactory={InputComp}
        />
        <Example
          title="Left- Right Alignment"
          config={{
            label: { text: trans("componentDoc.userName"), align: "right" },
            placeholder: trans("componentDoc.pleaseInputName"),
          }}
          compFactory={InputComp}
        />
        <Example
          title="Top - Left Alignment"
          config={{
            label: { text: trans("componentDoc.userName"), position: "column" },
            placeholder: trans("componentDoc.pleaseInputName"),
          }}
          compFactory={InputComp}
        />
        <Example
          title="Top - Right Alignment"
          config={{
            label: { text: trans("componentDoc.userName"), position: "column", align: "right" },
            placeholder: trans("componentDoc.pleaseInputName"),
          }}
          compFactory={InputComp}
        />
        <Example
          title="Tooltip"
          config={{
            label: { text: trans("componentDoc.userName"), align: "right", tooltip:"This is a Tooltip" },
            placeholder: trans("componentDoc.pleaseInputName"),
          }}
          compFactory={InputComp}
        />
        <Example
          title={trans("componentDoc.workCount")}
          config={{
            showCount: "true",
          }}
          compFactory={InputComp}
        />
        <Example
          title="Show Prefix Icon"
          config={{
            prefixIcon: "/icon:solid/align-center",
          }}
          compFactory={InputComp}
        />
        <Example
          title="Show suffix Icon"
          config={{
            suffixIcon: "/icon:solid/arrow-down-long",
          }}
          compFactory={InputComp}
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
          compFactory={InputComp}
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
          compFactory={InputComp}
        />
         <Example
          title="Show Clear Button & Show Validation on Empty/Reset"
          width={340}
          config={{
            label: { text: trans("componentDoc.userName") },
            defaultValue: "Default Text",
            required: true,
            allowClear: true,
            showValidationWhenEmpty: true,
          }}
          compFactory={InputComp}
        />
        <Example
          title="Check for Maximum Length ( 5 characters )"
          width={340}
          config={{
            label: { text: trans("componentDoc.userName") },
            required: true,
            showValidationWhenEmpty: true,
            minLength: 3,
          }}
          compFactory={InputComp}
        />
        <Example
          title="Check for Maximum Length ( 5 characters )"
          width={340}
          config={{
            label: { text: trans("componentDoc.userName") },
            required: true,
            showValidationWhenEmpty: true,
            maxLength: 5,
          }}
          compFactory={InputComp}
        />
        <Example
          title="Custom Rule"
          width={340}
          config={{
            label: { text: trans("componentDoc.userName") },
            placeholder: trans("componentDoc.pleaseInputName"),
            customRule: "{{Number(input1.value) <= 0 ? 'Value can't be less than or equal to 0' : ''}}",
            validationType: "Text",
          }}
          compFactory={InputComp}
        />
      </ExampleGroup>

      <ExampleGroup title="Input Type">
        <Example
          title="Email"
          width={340}
          config={{
            label: { text: trans("componentDoc.userName") },
            placeholder: trans("componentDoc.pleaseInputName"),
            required: true,
            validationType: "Email",
          }}
          compFactory={InputComp}
        />
        <Example
          title="URL"
          width={340}
          config={{
            label: { text: trans("componentDoc.userName") },
            placeholder: trans("componentDoc.pleaseInputName"),
            required: true,
            validationType: "URL",
          }}
          compFactory={InputComp}
        />
        <Example
          title="Regex"
          width={340}
          config={{
            label: { text: trans("componentDoc.userName") },
            placeholder: trans("componentDoc.pleaseInputName"),
            required: true,
            validationType: "Regex",
            regex: "^[A-Z]{3}\\d[a-z]{3}\\d[A-Z]{3}\\d$"
          }}
          compFactory={InputComp}
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
          compFactory={InputComp}
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
          compFactory={InputComp}
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
          compFactory={InputComp}
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
          compFactory={InputComp}
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
          compFactory={InputComp}
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
          compFactory={InputComp}
        />
      </ExampleGroup>
    </>
  );
}
