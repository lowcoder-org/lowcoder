import { TreeSelectComp } from "comps/comps/treeComp/treeSelectComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function TreeSelectExample() {
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
        description="The Following Examples Show the Validation on Select Tree Component."
      >
        <Example
          title="Disabling the Select Tree Component"
          config={{
            disabled: true,
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeSelectComp}
        />
        <Example
          title="Hiding the Select Tree Component"
          config={{
            hidden: true,
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeSelectComp}
        />
        <Example
          title="Select Type - Single"
          config={{
            selectType: "single",
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeSelectComp}
        />
        <Example
          title="Select Type - Multi-Select"
          config={{
            selectType: "multi",
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeSelectComp}
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
          compFactory={TreeSelectComp}
        />
        <Example
          title="Checked Strategy - All Nodes"
          config={{
            selectType: "check",
            checkedStrategy: "all",
            defaultValue: "[asia]",
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeSelectComp}
        />
        <Example
          title="Checked Strategy - Only Parent Node"
          config={{
            selectType: "check",
            checkedStrategy: "parent",
            defaultValue: "[asia]",
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeSelectComp}
        />
        <Example
          title="Checked Strategy - Only Child Nodes"
          config={{
            selectType: "check",
            checkedStrategy: "child",
            defaultValue: "[asia]",
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeSelectComp}
        />
        <Example
          title="Show Clear Button"
          config={{
            allowClear:true,
            defaultValue: "[asia]",
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeSelectComp}
        />
        <Example
          title="Allow Options to be Searchable"
          config={{
            allowClear:true,
            selectType: "multi",
            showSearch: true,
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeSelectComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Validation"
        description="The Following Examples Show the Validation on Select Tree Component."
      >
        <Example
          title="Required Component"
          config={{
            required: true,
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeSelectComp}
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
          compFactory={TreeSelectComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Layout"
        description="The Following Examples Show the Layout Option on Select Tree Component."
      >
        <Example
          title="All Nodes Expanded - By Default"
          config={{
            defaultExpandAll: true,
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeSelectComp}
        />
        <Example
          title="Custom Node Expanded - By Default"
          config={{
            expanded: "[asia,china]",
            label: {
              text: "Select Your Place",
            },
          }}
          compFactory={TreeSelectComp}
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
          compFactory={TreeSelectComp}
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
          compFactory={TreeSelectComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Label Positioning & Alignment"
        description="The Following Examples Show the Label Positioning & Alignment on Select Tree Component."
      >
        <Example
          title="Label Postion - LEFT"
          config={{
            label: {
              text: "Select Your Place",
              position: "row",
            },
          }}
          compFactory={TreeSelectComp}
        />
        <Example
          title="Label Postion - TOP"
          config={{
            label: {
              text: "Select Your Place",
              position: "column",
            },
          }}
          compFactory={TreeSelectComp}
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
          compFactory={TreeSelectComp}
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
          compFactory={TreeSelectComp}
        />
        <Example
          title="ToolTip on Select Tree Component"
          config={{
            label: {
              text: "Select Your Place",
              tooltip: "This is a ToolTip on Select Tree Component, which should get dispalyed when User hovers over it",
            },
          }}
          compFactory={TreeSelectComp}
        />
      </ExampleGroup>
    </>
  );
}
