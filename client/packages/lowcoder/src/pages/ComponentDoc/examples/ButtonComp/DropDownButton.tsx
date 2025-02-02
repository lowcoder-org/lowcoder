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
        description={trans("componentDoc.basicDemoDescription")}
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
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.style")}>
        <Example
          title={trans("componentDoc.onlyMenu")}
          width={120}
          config={{
            onlyMenu: true,
          }}
          compFactory={DropdownComp}
        />
      </ExampleGroup>
    </>
  );
}
