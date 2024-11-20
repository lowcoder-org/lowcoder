import { DividerComp } from "comps/comps/dividerComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function DividerExample() {
  const nameMap: Record<string, string> = {
    title: trans("componentDoc.title"),
    align: trans("componentDoc.titleAlign"),
    color: trans("componentDoc.color"),
    dashed: trans("componentDoc.dashed"),
  };
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
      <Example 
        title="" 
        config={{
          style: {borderStyle: "solid", border: "#000",borderWidth: "2px"},
        }} 
        compFactory={DividerComp} 
      />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.titleAlign")}>
        <Example
          title={trans("componentDoc.left")}
          nameMap={nameMap}
          config={{
            style: {borderStyle: "solid", border: "#000",borderWidth: "2px"},
            title: trans("componentDoc.imADivider"),
            align: "left",
          }}
          compFactory={DividerComp}
        />
        <Example
          title={trans("componentDoc.center")}
          nameMap={nameMap}
          config={{
            title: trans("componentDoc.imADivider"),
            align: "center",
            style: {borderStyle: "solid", border: "#000",borderWidth: "2px"},
          }}
          compFactory={DividerComp}
        />
        <Example
          title={trans("componentDoc.right")}
          nameMap={nameMap}
          config={{
            title: trans("componentDoc.imADivider"),
            align: "right",
            style: {borderStyle: "solid", border: "#000",borderWidth: "2px"},
          }}
          compFactory={DividerComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.style")}>
        <Example
          title="Dashed Border"
          nameMap={nameMap}
          config={{
            title: trans("componentDoc.imADivider"),
            align: "center",
            style: {borderStyle: "dashed", border: "#000",borderWidth: "2px"},
          }}
          compFactory={DividerComp}
        />
        <Example
          title="Solid Border"
          nameMap={nameMap}
          config={{
            title: trans("componentDoc.imADivider"),
            align: "center",
            style: {borderStyle: "solid", border: "#000",borderWidth: "2px"},
          }}
          compFactory={DividerComp}
        />
        <Example
          title="Vertical Divider"
          nameMap={nameMap}
          config={{
            style: {borderStyle: "solid", border: "#000",borderWidth: "2px"},
            type: true,
          }}
          compFactory={DividerComp}
        />
      </ExampleGroup>
    </>
  );
}
