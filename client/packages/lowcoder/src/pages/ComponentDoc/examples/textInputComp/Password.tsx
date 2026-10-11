import { PasswordComp } from "comps/comps/textInputComp/passwordComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function PasswordExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.placeholder")}
          config={{
            placeholder: trans("componentDoc.pleaseInputPassword"),
            disabled: false,
          }}
          compFactory={PasswordComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          config={{
            placeholder: trans("componentDoc.pleaseInputPassword"),
            disabled: true,
          }}
          compFactory={PasswordComp}
        />
        <Example
          title="Hiding the Password"
          config={{
            placeholder: trans("componentDoc.pleaseInputPassword"),
            hidden: true,
          }}
          compFactory={PasswordComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.labelText")} description="">
        <Example
          title="Left - Left Alignment"
          config={{
            label: { text: trans("componentDoc.password"), position: "row" },
            placeholder: trans("componentDoc.pleaseInputPassword"),
          }}
          compFactory={PasswordComp}
        />
        <Example
          title="Left - Right Alignment"
          config={{
            label: { text: trans("componentDoc.password"), align: "right" },
            placeholder: trans("componentDoc.pleaseInputPassword"),
          }}
          compFactory={PasswordComp}
        />
         <Example
          title="Top - Left Alignment"
          config={{
            label: { text: trans("componentDoc.password"), position: "column" },
            placeholder: trans("componentDoc.pleaseInputPassword"),
          }}
          compFactory={PasswordComp}
        />
         <Example
          title="Top - Rightt Alignment"
          config={{
            label: { text: trans("componentDoc.password"), position: "column", align: "right" },
            placeholder: trans("componentDoc.pleaseInputPassword"),
          }}
          compFactory={PasswordComp}
        />
        <Example
          title="Tooltip"
          config={{
            label: { text: trans("componentDoc.password"), tooltip:"This is a Tooltip" },
            placeholder: trans("componentDoc.pleaseInputPassword"),
          }}
          compFactory={PasswordComp}
        />
          <Example
          title="Visibility Toggle"
          config={{
            label: { text: trans("componentDoc.password")},
            placeholder: trans("componentDoc.pleaseInputPassword"),
            visibilityToggle: true,
          }}
          compFactory={PasswordComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.validation")} description="">
        <Example
          title={trans("componentDoc.required")}
          width={340}
          config={{
            label: { text: trans("componentDoc.password") },
            placeholder: trans("componentDoc.pleaseInputPassword"),
            required: true,
          }}
          compFactory={PasswordComp}
        />
        <Example
          title={trans("componentDoc.length")}
          width={340}
          config={{
            label: { text: trans("componentDoc.password") },
            placeholder: trans("componentDoc.pleaseInputPassword"),
            minLength: 3,
            maxLength: 6,
          }}
          compFactory={PasswordComp}
        />
        <Example
          title="Show Clear Button & Show Validation on Empty/Reset"
          width={340}
          config={{
            label: { text: trans("componentDoc.password")},
            placeholder: trans("componentDoc.pleaseInputPassword"),
            required: true,
            showValidationWhenEmpty: true,
          }}
          compFactory={PasswordComp}
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
          compFactory={PasswordComp}
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
          compFactory={PasswordComp}
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
          compFactory={PasswordComp}
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
          compFactory={PasswordComp}
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
          compFactory={PasswordComp}
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
          compFactory={PasswordComp}
        />
      </ExampleGroup>
    </>
  );
}
