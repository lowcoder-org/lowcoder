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
    </>
    
  );
}
