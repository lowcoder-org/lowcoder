import { RadioComp } from "comps/comps/selectInputComp/radioComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function RadioExample() {
  //   const nameMap: Record<string, string> = {};
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
            value: trans("componentDoc.appleOptionLabel"),
            disabled: false,
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={RadioComp}
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
          compFactory={RadioComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          config={{
            value: trans("componentDoc.appleOptionLabel"),
            disabled: true,
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={RadioComp}
        />
        <Example
          title="Hiding the Radio button component"
          config={{
            value: trans("componentDoc.appleOptionLabel"),
            hidden: true,
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={RadioComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.labelText")} description="">
        <Example
          title={trans("componentDoc.leftLeftAlign")}
          config={{
            value: trans("componentDoc.appleOptionLabel"),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
              position: "row",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={RadioComp}
        />
        <Example
          title={trans("componentDoc.leftRightAlign")}
          config={{
            value: trans("componentDoc.appleOptionLabel"),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
              position: "row",
              align: "right",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={RadioComp}
        />
        <Example
          title={trans("componentDoc.topLeftAlign")}
          config={{
            value: trans("componentDoc.appleOptionLabel"),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={RadioComp}
        />
        <Example
          title={trans("componentDoc.topRightAlign")}
          config={{
            value: trans("componentDoc.appleOptionLabel"),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
              position: "column",
              align: "right",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={RadioComp}
        />
        <Example
          title="Showing Tooltip on Hover"
          config={{
            value: trans("componentDoc.appleOptionLabel"),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
              tooltip: "This is a Tooltip on Radio button component",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={RadioComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.validation")}>
        <Example
          title={trans("componentDoc.required")}
          config={{
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
            required: true,
          }}
          blackListConfig={blackListConfig}
          compFactory={RadioComp}
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
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
            layout: "horizontal",
          }}
          blackListConfig={blackListConfig}
          compFactory={RadioComp}
        />
        <Example
          title="Vertical Layout"
          width={600}
          config={{
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
            layout: "vertical",
          }}
          blackListConfig={blackListConfig}
          compFactory={RadioComp}
        />
        <Example
          title="Auto Column Layout"
          width={600}
          config={{
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
            layout: "auto_columns",
          }}
          blackListConfig={blackListConfig}
          compFactory={RadioComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties of the Radio button Component."
      >
        <Example
          title="Radio component Styling properties"
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
          compFactory={RadioComp}
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
          compFactory={RadioComp}
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
          compFactory={RadioComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the Radio button Component."
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
          compFactory={RadioComp}
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
          compFactory={RadioComp}
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
          compFactory={RadioComp}
        />
      </ExampleGroup>
    </>
  );
}
