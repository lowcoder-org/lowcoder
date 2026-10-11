import { CheckboxComp } from "comps/comps/selectInputComp/checkboxComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function CheckboxExample() {
  const blackListConfig: string[] = ["options.manual.manual"];
  const options = {
    optionType: "manual",
    manual: {
      manual: [
        {
          value: trans("componentDoc.appleOptionLabel"),
          label: trans("componentDoc.appleOptionLabel"),
          disabled: "",
          hidden: "",
        },
        {
          value: trans("componentDoc.waterMelonOptionLabel"),
          label: trans("componentDoc.waterMelonOptionLabel"),
          disabled: "",
          hidden: "",
        },
        {
          value: trans("componentDoc.berryOptionLabel"),
          label: trans("componentDoc.berryOptionLabel"),
          disabled: "",
          hidden: "",
        },
        {
          value: trans("componentDoc.lemonOptionLabel"),
          label: trans("componentDoc.lemonOptionLabel"),
          disabled: "",
          hidden: "",
        },
        {
          value: trans("componentDoc.coconutOptionLabel"),
          label: trans("componentDoc.coconutOptionLabel"),
          disabled: "",
          hidden: "",
        },
      ],
    },
  };
  return (
    <>

      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.value")}
          config={{
            value: JSON.stringify([
              trans("componentDoc.appleOptionLabel"),
              trans("componentDoc.waterMelonOptionLabel"),
            ]),
            disabled: false,
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CheckboxComp}
        />
        <Example
          title={trans("componentDoc.noDefaultValue")}
          config={{
            value: trans("componentDoc.noValue"),
            disabled: false,
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CheckboxComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          config={{
            value: JSON.stringify([
              trans("componentDoc.appleOptionLabel"),
              trans("componentDoc.waterMelonOptionLabel"),
              trans("componentDoc.lemonOptionLabel"),
            ]),
            disabled: true,
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CheckboxComp}
        />
        <Example
          title="Hiding the Checkbox component"
          config={{
            value: JSON.stringify([
              trans("componentDoc.appleOptionLabel"),
              trans("componentDoc.waterMelonOptionLabel"),
              trans("componentDoc.lemonOptionLabel"),
            ]),
            hidden: true,
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CheckboxComp}
        />
      </ExampleGroup>

      <ExampleGroup 
      title={trans("componentDoc.labelText")} 
      description="The Following Examples Show the differnet alignment positions on the Checkbox Component."
      >
        <Example
          title={trans("componentDoc.leftLeftAlign")}
          config={{
            value: JSON.stringify([
              trans("componentDoc.appleOptionLabel"),
              trans("componentDoc.waterMelonOptionLabel"),
              trans("componentDoc.lemonOptionLabel"),
            ]),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
              position: "row",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CheckboxComp}
        />
        <Example
          title={trans("componentDoc.leftRightAlign")}
          config={{
            value: JSON.stringify([
              trans("componentDoc.appleOptionLabel"),
              trans("componentDoc.waterMelonOptionLabel"),
              trans("componentDoc.lemonOptionLabel"),
            ]),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
              position: "row",
              align: "right",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CheckboxComp}
        />
        <Example
          title={trans("componentDoc.topLeftAlign")}
          config={{
            value: JSON.stringify([
              trans("componentDoc.appleOptionLabel"),
              trans("componentDoc.waterMelonOptionLabel"),
              trans("componentDoc.lemonOptionLabel"),
            ]),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CheckboxComp}
        />
        <Example
          title={trans("componentDoc.topRightAlign")}
          config={{
            value: JSON.stringify([
              trans("componentDoc.appleOptionLabel"),
              trans("componentDoc.waterMelonOptionLabel"),
            ]),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
              position: "column",
              align: "right",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CheckboxComp}
        />
        <Example
          title="Display Tooltip on Hover"
          config={{
            value: JSON.stringify([
              trans("componentDoc.appleOptionLabel"),
              trans("componentDoc.waterMelonOptionLabel"),
            ]),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
              tooltip: "Checkmark your favorite Fruits",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CheckboxComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Layout Options"
        description="The Following Examples Show the different Layout options on the Checkbox Component."
      >
        <Example
          title="Horizontal Layout"
          width={600}
          config={{
            value: JSON.stringify([
              trans("componentDoc.appleOptionLabel"),
              trans("componentDoc.waterMelonOptionLabel"),
              trans("componentDoc.lemonOptionLabel"),
            ]),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
            layout: "horizontal",
          }}
          blackListConfig={blackListConfig}
          compFactory={CheckboxComp}
        />
        <Example
          title="Vertical Layout"
          width={600}
          config={{
            value: JSON.stringify([
              trans("componentDoc.appleOptionLabel"),
              trans("componentDoc.waterMelonOptionLabel"),
              trans("componentDoc.lemonOptionLabel"),
            ]),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
            layout: "vertical",
          }}
          blackListConfig={blackListConfig}
          compFactory={CheckboxComp}
        />
        <Example
          title="Auto Column Layout"
          width={600}
          config={{
            value: JSON.stringify([
              trans("componentDoc.appleOptionLabel"),
              trans("componentDoc.waterMelonOptionLabel"),
              trans("componentDoc.lemonOptionLabel"),
            ]),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
            layout: "auto_columns",
          }}
          blackListConfig={blackListConfig}
          compFactory={CheckboxComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.validation")}>
        <Example
          title={trans("componentDoc.required")}
          config={{
            required: true,
            value: "[]",
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CheckboxComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties of the Checkbox Component."
      >
        <Example
          title="Select component Styling properties"
          config={{
            options: options,
            label: {
              text: trans("componentDoc.favoriteFruits"),
            },
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
          compFactory={CheckboxComp}
        />
        <Example
          title="Label Styling properties"
          config={{
            options: options,
            label: {
              text: trans("componentDoc.favoriteFruits"),
            },
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
          compFactory={CheckboxComp}
        />
        <Example
          title="Input Field Styling properties"
          config={{
            options: options,
            label: {
              text: trans("componentDoc.favoriteFruits"),
            },
            inputFieldStyle: {
              "background": "linear-gradient(45deg, #d53369 0%, #daae51 100%)",
              "border": "#222222",
              "radius": "10px",
              "text": "#222222",
              "checkedBackground": "#36B389",
              "uncheckedBackground": "#F99F01",
              "uncheckedBorder": "#FCA101",
              "hoverBackground": "#C3C6D1",
              "textSize": "15px",
              "textWeight": "bold",
              "fontFamily": "Courier New",
              "fontStyle": "italic",
            },
          }}
          compFactory={CheckboxComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the CheckBox Component."
      >
        <Example
          title="Bounce Animation"
          config={{
            options: options,
            label: {
              text: trans("componentDoc.favoriteFruits"),
            },
            animationStyle: {
              "animation": "bounce",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={CheckboxComp}
        />
        <Example
          title="Swing Animation"
          config={{
            options: options,
            label: {
              text: trans("componentDoc.favoriteFruits"),
            },
            animationStyle: {
              "animation": "swing",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={CheckboxComp}
        />
        <Example
          title="Tada Animation"
          config={{
            options: options,
            label: {
              text: trans("componentDoc.favoriteFruits"),
            },
            animationStyle: {
              "animation": "tada",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={CheckboxComp}
        />
      </ExampleGroup>
    </>
  );
}
