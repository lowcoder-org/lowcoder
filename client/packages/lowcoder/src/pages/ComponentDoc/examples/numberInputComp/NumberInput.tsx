import { NumberInputComp } from "comps/comps/numberInputComp/numberInputComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function NumberInputExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Number Input Component."
      >
        <Example
          title={trans("componentDoc.placeholder")}
          config={{
            placeholder: trans("componentDoc.pleaseInputNumber"),
            disabled: false,
          }}
          compFactory={NumberInputComp}
        />
        <Example
          title="Default Value"
          config={{
            defaultValue: "20",
          }}
          compFactory={NumberInputComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          config={{
            disabled: true,
          }}
          compFactory={NumberInputComp}
        />
        <Example
          title="Hiding the Number Input component"
          config={{
            hidden: true,
          }}
          compFactory={NumberInputComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.labelText")} description="">
        <Example
            title="Left- Left Alignment"
            config={{
              label: { position: "row" },
            }}
            compFactory={NumberInputComp}
          />
          <Example
            title="Left- Right Alignment"
            config={{
              label: { align: "right" },
            }}
            compFactory={NumberInputComp}
          />
          <Example
            title="Top - Left Alignment"
            config={{
              label: { position: "column" },
            }}
            compFactory={NumberInputComp}
          />
          <Example
            title="Top - Right Alignment"
            config={{
              label: { position: "column", align: "right" },
            }}
            compFactory={NumberInputComp}
          />
          <Example
            title="Tooltip"
            config={{
              label: { tooltip:"This is a Tooltip" },
            }}
            compFactory={NumberInputComp}
          />
      </ExampleGroup>

      <ExampleGroup 
        title= "Advance Usage"
        description="The Following Examples Show the Advance Usage of the Number Input Component.">
        <Example
          title={trans("componentDoc.percent")}
          config={{
            value: "123",
            formatter: "percent",
          }}
          compFactory={NumberInputComp}
        />
        <Example
          title={trans("componentDoc.thousandsSeparator")}
          config={{
            value: "12345678",
            thousandsSeparator: true,
          }}
          compFactory={NumberInputComp}
        />
        <Example
          title={trans("componentDoc.precision")}
          config={{
            value: "12.34",
            precision: "3",
          }}
          compFactory={NumberInputComp}
        />
        <Example
          title="Step - 10"
          config={{
            value: "1",
            step: "10",
          }}
          compFactory={NumberInputComp}
        />
        <Example
          title="Step - 50"
          config={{
            value: "1",
            step: "50",
          }}
          compFactory={NumberInputComp}
        />
        <Example
          title="Hide Increment/Decrement buttons"
          config={{
            value: "1",
            step: "10",
            controls: false,
          }}
          compFactory={NumberInputComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.validation")}>
        <Example
          title="Minimum and Maximum Value ( 1 - 10 )"
          config={{
            min: "1",
            max: "10",
          }}
          compFactory={NumberInputComp}
        />
        <Example
          title={trans("componentDoc.required")}
          config={{
            required: true,
          }}
          compFactory={NumberInputComp}
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
          compFactory={NumberInputComp}
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
          compFactory={NumberInputComp}
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
          compFactory={NumberInputComp}
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
          compFactory={NumberInputComp}
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
          compFactory={NumberInputComp}
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
          compFactory={NumberInputComp}
        />
      </ExampleGroup>
    </>
  );
}
