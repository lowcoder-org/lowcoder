import { DropdownComp } from "comps/comps/buttonComp/dropdownComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function DropdownExample() {
  const blackListConfig: string[] = ["options.manual.manual"];
  const options = {
    optionType: "manual",
    manual: {
      manual: [
        {
          label: `${trans("componentDoc.option")} 1`,
          disabled: "",
          hidden: "",
          onEvent: [],
        },
        {
          label: `${trans("componentDoc.option")} 2`,
          disabled: "",
          hidden: "",
          onEvent: [],
        },
        {
          label: `${trans("componentDoc.option")} 3`,
          disabled: "",
          hidden: "",
          onEvent: [],
        },
      ],
    },
  };
  return (
    <>

      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Dropdown Component."

      >
        <Example
          title={trans("componentDoc.default")}
          width={120}
          config={{ type: "default", text: trans("componentDoc.menu"), options: options }}
          blackListConfig={blackListConfig}
          compFactory={DropdownComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          width={120}
          config={{
            type: "default",
            text: trans("componentDoc.menu"),
            disabled: true,
            options: options,
          }}
          blackListConfig={blackListConfig}
          compFactory={DropdownComp}
        />
        <Example
          title="Hiding the Dropdown component"
          width={120}
          config={{
            type: "default",
            text: trans("componentDoc.menu"),
            hidden: true,
            options: options,
          }}
          blackListConfig={blackListConfig}
          compFactory={DropdownComp}
        />
      </ExampleGroup>

      <ExampleGroup 
      title="Layout"
      description="The Following Examples Show the Layout options of the Dropdown Component."
      >
        <Example
          title="Display Dropdown without the Dots"
          width={120}
          config={{
            onlyMenu: true,
          }}
          compFactory={DropdownComp}
        />
        <Example
          title="Show Dropdown options on Hover"
          width={120}
          config={{
            onlyMenu: true,
            triggerMode: "hover",
          }}
          compFactory={DropdownComp}
        />
        <Example
          title="Show Dropdown options on Click"
          width={120}
          config={{
            onlyMenu: true,
            triggerMode: "click",
          }}
          compFactory={DropdownComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties on the Dropdown Component."
      >
        <Example
          title="Background Color"
          width={120}
          config={{
            style:{
              "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
            },
          }}
          compFactory={DropdownComp}
        />
        <Example
          title="Margin & Padding"
          width={120}
          config={{
            style:{
              "background": "linear-gradient(135deg, #00FFFF 0%, #00FFFF 100%)",
              "margin": "10px",
              "padding": "10px",
            },
          }}
          compFactory={DropdownComp}
        />
        <Example
          title="Border Radius"
          width={120}
          config={{
            style:{
              "background": "linear-gradient(135deg, #00FFFF 0%, #00FFFF 100%)",
              "radius": "15px"
            },
          }}
          compFactory={DropdownComp}
        />
        <Example
          title="Text Properties"
          width={120}
          config={{
            style:{
              "text": "#E67373",
              "textSize": "25px",
              "textWeight": "bold",
              "fontStyle": "italic",
            },
          }}
          compFactory={DropdownComp}
        />
      </ExampleGroup>
    </>
  );
}
