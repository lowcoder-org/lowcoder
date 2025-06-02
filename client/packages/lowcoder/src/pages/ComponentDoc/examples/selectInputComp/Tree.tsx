import { TreeComp } from "comps/comps/treeComp/treeComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function TreeExample() {
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
          title="Disabling the Tree Component"
          config={{
            disabled: true,
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Hiding the Tree Component"
          config={{
            hidden: true,
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Select Type - No Select"
          config={{
            selectType: "none",
            expanded:"[asia,china]",
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Select Type - Single"
          config={{
            selectType: "single",
            defaultExpandAll: true,
            value: "[china]",
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Select Type - Multi-Select"
          config={{
            selectType: "multi",
            defaultExpandAll: true,
            value: "[asia,china]",
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Select Type - CheckBox"
          config={{
            selectType: "check",
            expanded:"[asia,china]",
            value: "[asia]",
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Select Type - CheckBox ( Select Child nodes separately )"
          config={{
            selectType: "check",
            checkStrictly: true,
            expanded:"[asia,china]",
            value: "[asia,china]",
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Validation"
        description="The Following Examples Show the Validation on Tree Component."
      >
        <Example
          title="Required Component"
          config={{
            required: true,
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Show Validation on Empty/Reset"
          config={{
            required: true,
            showValidationWhenEmpty: true,
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Layout"
        description="The Following Examples Show the Layout Option of Tree Component."
      >
        <Example
          title="All Nodes Expanded - By Default"
          config={{
            defaultExpandAll: true,
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Custom Node Expanded - By Default"
          config={{
            expanded: "[asia,china]",
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Show Line"
          config={{
            showLine: true,
            defaultExpandAll: true,
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Show Line & Leaf Icon"
          config={{
            showLine: true,
            showLeafIcon: true,
            defaultExpandAll: true,
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Label Positioning & Alignment"
        description="The Following Examples Show the Label Positioning & Alignment on Tree Component."
      >
        <Example
          title="Label Postion - LEFT"
          config={{
            label: {
              text: "Select Your Place",
              position: "row",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Label Postion - TOP"
          config={{
            label: {
              text: "Select Your Place",
              position: "column",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Label Alignment - RIGHT"
          config={{
            label: {
              text: "Select Your Place",
              position: "column",
              align: "right",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Label Alignment - LEFT"
          config={{
            label: {
              text: "Select Your Place",
              position: "column",
              align: "left",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="ToolTip on Tree Component"
          config={{
            label: {
              text: "Select Your Place",
              tooltip: "This is a ToolTip on Tree Component, which should get dispalyed when User hovers over it",
            },
          }}
          compFactory={TreeComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties on Tree Component."
      >
        <Example
          title="Background Color, Border Radius,Style,Width,Color"
          width={500}
          config={{
            defaultExpandAll: true,
            label: {
              text: "Select Your Place",
              position: "row",
            },
            style: {
              "background": "#00FFFF",
              "border": "#3377FF",
              "radius": "10px",
              "borderWidth": "3px",
              "borderStyle": "solid",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Margin & Padding"
          width={500}
          config={{
            defaultExpandAll: true,
            label: {
              text: "Select Your Place",
              position: "row",
            },
            style: {
              "background": "#00FFFF",
              "border": "#3377FF",
              "radius": "10px",
              "borderWidth": "3px",
              "margin": "10px",
              "padding": "10px",
              "borderStyle": "dashed",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Opacity - 0.2"
          width={500}
          config={{
            defaultExpandAll: true,
            label: {
              text: "Select Your Place",
              position: "row",
            },
            style: {
              "opacity": "0.2",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Opacity - 0.5"
          width={500}
          config={{
            defaultExpandAll: true,
            label: {
              text: "Select Your Place",
              position: "row",
            },
            style: {
              "opacity": "0.5",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Opacity - 0.7"
          width={500}
          config={{
            defaultExpandAll: true,
            label: {
              text: "Select Your Place",
              position: "row",
            },
            style: {
              "opacity": "0.7",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Opacity - 1"
          width={500}
          config={{
            defaultExpandAll: true,
            label: {
              text: "Select Your Place",
              position: "row",
            },
            style: {
              "opacity": "1",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Rotation - 90deg"
          width={500}
          config={{
            defaultExpandAll: true,
            label: {
              text: "Select Your Place",
              position: "row",
            },
            style: {
              "rotation": "90deg",
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Label - Text Color, Size, Weight, Font family, Border properties"
          width={500}
          config={{
            defaultExpandAll: true,
            label: {
              text: "Select Your Place",
              position: "row",
            },
            labelStyle: {
              "margin": "5px",
              "padding": "5px",
              "label": "#3377FF",
              "textTransform": "Uppercase",
              "textDecoration": "underline",
              "textSize": "13px",
              "textWeight": "bold",
              "fontFamily": "Courier New",
              "fontStyle": "Italic",
              "border": "#36B389",
              "borderStyle": "solid",
              "borderWidth": "2px"
            },
          }}
          compFactory={TreeComp}
        />
        <Example
          title="Input Field Style"
          width={500}
          config={{
            defaultExpandAll: true,
            label: {
              text: "Select Your Place",
              position: "row",
            },
            style: {
              "background": "#00FFFF",
              "border": "#3377FF",
              "radius": "10px",
              "borderWidth": "3px",
              "margin": "10px",
              "padding": "10px",
              "borderStyle": "solid",
            },
            inputFieldStyle: {
              "background": "#00BCA1",
              "border": "#013AFF",
              "radius": "10px",
              "text": "#222222"
            },
          }}
          compFactory={TreeComp}
        />
      </ExampleGroup>
    </>
    
  );
}
