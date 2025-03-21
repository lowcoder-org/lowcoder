import { SelectComp } from "comps/comps/selectInputComp/selectComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function SelectExample() {
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
              text: trans("componentDoc.favoriteFruits"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={SelectComp}
        />
        <Example
          title={trans("componentDoc.noDefaultValue")}
          config={{
            value: trans("componentDoc.noValue"),
            disabled: false,
            options: options,
            label: {
              text: trans("componentDoc.favoriteFruits"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={SelectComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          config={{
            value: trans("componentDoc.appleOptionLabel"),
            disabled: true,
            options: options,
            label: {
              text: trans("componentDoc.favoriteFruits"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={SelectComp}
        />
        <Example
          title={trans("componentDoc.placeholder")}
          config={{
            value: trans("componentDoc.noValue"),
            disabled: false,
            options: options,
            placeholder: trans("componentDoc.pleaseSelectOneFruit"),
            label: {
              text: trans("componentDoc.favoriteFruits"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={SelectComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.labelText")} description="">
        <Example
          title={trans("componentDoc.leftLeftAlign")}
          config={{
            value: trans("componentDoc.lemonOptionLabel"),
            options: options,
            label: {
              text: trans("componentDoc.favoriteFruits"),
              position: "row",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={SelectComp}
        />
        <Example
          title={trans("componentDoc.leftRightAlign")}
          config={{
            value: trans("componentDoc.lemonOptionLabel"),
            options: options,
            label: {
              text: trans("componentDoc.favoriteFruits"),
              position: "row",
              align: "right",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={SelectComp}
        />
        <Example
          title={trans("componentDoc.topLeftAlign")}
          config={{
            value: trans("componentDoc.lemonOptionLabel"),
            options: options,
            label: {
              text: trans("componentDoc.favoriteFruits"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={SelectComp}
        />
        <Example
          title={trans("componentDoc.topRightAlign")}
          config={{
            value: trans("componentDoc.lemonOptionLabel"),
            options: options,
            label: {
              text: trans("componentDoc.favoriteFruits"),
              position: "column",
              align: "right",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={SelectComp}
        />
        <Example
          title="Tooltip display on Hover"
          config={{
            options: options,
            label: {
              text: trans("componentDoc.favoriteFruits"),
              tooltip: "Select your Favorite Fruit",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={SelectComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.advanced")}>
        <Example
          title={trans("componentDoc.allowClear")}
          config={{
            value: trans("componentDoc.berryOptionLabel"),
            options: options,
            label: {
              text: trans("componentDoc.favoriteFruits"),
            },
            allowClear: true,
          }}
          blackListConfig={blackListConfig}
          compFactory={SelectComp}
        />
        <Example
          title="Options : Non Searchable"
          config={{
            value: trans("componentDoc.noValue"),
            options: options,
            label: {
              text: trans("componentDoc.favoriteFruits"),
            },
            allowClear: true,
            showSearch: false,
          }}
          blackListConfig={blackListConfig}
          compFactory={SelectComp}
        />
        <Example
          title="Options : Searchable"
          config={{
            value: trans("componentDoc.noValue"),
            options: options,
            label: {
              text: trans("componentDoc.favoriteFruits"),
            },
            allowClear: true,
            showSearch: true,
          }}
          blackListConfig={blackListConfig}
          compFactory={SelectComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.validation")}>
        <Example
          title={trans("componentDoc.required")}
          config={{
            options: options,
            label: {
              text: trans("componentDoc.favoriteFruits"),
            },
            required: true,
            showValidationWhenEmpty: true,
          }}
          blackListConfig={blackListConfig}
          compFactory={SelectComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties of the Select Component."
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
          compFactory={SelectComp}
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
          compFactory={SelectComp}
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
              "margin": "5px",
              "padding": "10px",
              "borderStyle": "dashed",
              "borderWidth": "3px",
              "accent": "#36B389"
            },
          }}
          compFactory={SelectComp}
        />
        <Example
          title="Children Input Field Styling properties"
          config={{
            options: options,
            label: {
              text: trans("componentDoc.favoriteFruits"),
            },
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
          compFactory={SelectComp}
        />
      </ExampleGroup>
    </>
  );
}
