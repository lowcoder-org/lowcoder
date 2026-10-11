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
        title="Default Divider component" 
        config={{
          style: {
            borderStyle: "solid",
            border: "#000",
            borderWidth: "2px"
          },
        }}
        compFactory={DividerComp} 
      />
      <Example 
        title="Hiding Divider component" 
        config={{
          style: {
            borderStyle: "solid", 
            border: "#000",
            borderWidth: "2px",
            hidden: "true",
          },
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

      <ExampleGroup title="Styling Properties">
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
          title="Border Width & Border Color"
          nameMap={nameMap}
          config={{
            title: "Divider",
            align: "center",
            style: {borderStyle: "solid", border: "#00FFFF",borderWidth: "10px"},
          }}
          compFactory={DividerComp}
        />
        <Example
          title="Text Transform - Uppercase"
          nameMap={nameMap}
          config={{
            title: trans("componentDoc.imADivider"),
            align: "center",
            style: {borderStyle: "solid", border: "#000",borderWidth: "3px", textTransform: "uppercase"},
          }}
          compFactory={DividerComp}
        />
        <Example
          title="Text Transform - Capitalize"
          nameMap={nameMap}
          config={{
            title: trans("componentDoc.imADivider"),
            align: "center",
            style: {borderStyle: "solid", border: "#000",borderWidth: "3px", textTransform: "capitalize"},
          }}
          compFactory={DividerComp}
        />
        <Example
          title="Text Decoration - Underline"
          nameMap={nameMap}
          config={{
            title: trans("componentDoc.imADivider"),
            align: "center",
            style: {borderStyle: "solid", border: "#000",borderWidth: "3px", textDecoration: "underline"},
          }}
          compFactory={DividerComp}
        />
        <Example
          title="Text Decoration - Line through"
          nameMap={nameMap}
          config={{
            title: trans("componentDoc.imADivider"),
            align: "center",
            style: {borderStyle: "solid", border: "#000",borderWidth: "3px", textDecoration: "line-through"},
          }}
          compFactory={DividerComp}
        />
        <Example
          title="Other Text Properties"
          nameMap={nameMap}
          config={{
            title: trans("componentDoc.imADivider"),
            align: "center",
            style: {
              text: "#E67373",
              textSize: "10px",
              textWeight: "bold",
              fontFamily: "Courier New",
              fontStyle: "italic",
              border: "#000",
              borderWidth: "3px",
              borderStyle: "solid",
            }
          }}
          compFactory={DividerComp}
        />
        <Example
          title="Vertical Divider"
          nameMap={nameMap}
          height={400}
          config={{
            title: trans("componentDoc.imADivider"),
            align: "center",
            style: {borderStyle: "solid", border: "#000",borderWidth: "2px"},
            type: true,
          }}
          compFactory={DividerComp}
        />
        <Example
          title="Component Rotation - 90deg"
          nameMap={nameMap}
          config={{
            title: trans("componentDoc.imADivider"),
            align: "center",
            style: {borderStyle: "solid", border: "#000",borderWidth: "3px", rotation: "90deg"},
          }}
          compFactory={DividerComp}
        />
        <Example
          title="Component Rotation - 180deg"
          nameMap={nameMap}
          config={{
            title: trans("componentDoc.imADivider"),
            align: "center",
            style: {borderStyle: "solid", border: "#000",borderWidth: "3px", rotation: "180deg"},
          }}
          compFactory={DividerComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the Cascader Component."
      >
        <Example
          title="Bounce Animation"
          config={{
            style: {
              borderStyle: "solid",
              border: "#000",
              borderWidth: "2px"
            },
            animationStyle: {
              "animation": "bounce",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={DividerComp}
        />
        <Example
          title="Swing Animation"
          config={{
            style: {
              borderStyle: "solid",
              border: "#000",
              borderWidth: "2px"
            },
            animationStyle: {
              "animation": "swing",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={DividerComp}
        />
        <Example
          title="Tada Animation"
          config={{
            style: {
              borderStyle: "solid",
              border: "#000",
              borderWidth: "2px"
            },
            animationStyle: {
              "animation": "tada",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={DividerComp}
        />
      </ExampleGroup>
    </>
  );
}
