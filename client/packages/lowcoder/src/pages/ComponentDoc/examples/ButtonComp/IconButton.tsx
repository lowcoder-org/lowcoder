import { ControlButton } from "comps/comps/meetingComp/controlButton";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function IconButtonExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Icon Button Component."
      >
        <Example
          title="A Simple Icon button"
          width={120}
          config={{ 
            prefixIcon: "/icon:solid/align-justify",
        }}
          compFactory={ControlButton}
        />
        <Example
          title={trans("componentDoc.loading")}
          width={120}
          config={{
            prefixIcon: "/icon:solid/align-justify",
            loading: true, 
          }}
          compFactory={ControlButton}
        />
        <Example
          title={trans("componentDoc.disabled")}
          width={120}
          config={{
            disabled: true,
            prefixIcon: "/icon:solid/align-justify",
          }}
          compFactory={ControlButton}
        />
        <Example
          title="Hiding the Icon Button"
          width={120}
          config={{
            hidden: true,
            prefixIcon: "/icon:solid/align-justify",
          }}
          compFactory={ControlButton}
        />
      </ExampleGroup>
      
      <ExampleGroup 
        title="Layout & Style"
        description="The Following Examples Show the Layout & Style options on Float Button Component."
      >
        <Example
          title={trans("componentDoc.danger")}
          width={120}
          config={{
            prefixIcon: "/icon:solid/ellipsis-vertical",
            style: { 
              backgroundColor: "#CD574C", 
              borderColor: "#AC3A32", 
              color: "#E0ECF6" },
          }}
          compFactory={ControlButton}
        />
        <Example
          title={trans("componentDoc.warning")}
          width={120}
          config={{
            prefixIcon: "/icon:solid/square-caret-right",
            style: { 
              backgroundColor: "#F4A125", 
              borderColor: "#DA7D16", 
              color: "#000000" },
          }}
          compFactory={ControlButton}
        />
        <Example
          title={trans("componentDoc.success")}
          width={120}
          config={{
            prefixIcon: "/icon:antd/audiofilled",
            style: { 
              backgroundColor: "#5E8D6E", 
              borderColor: "#40694E", 
              color: "#E0ECF6" },
          }}
          compFactory={ControlButton}
        />
        <Example
          title="Icon Size - 30px"
          width={120}
          config={{
            prefixIcon: "/icon:antd/audiofilled",
            iconSize: "30px",
            style: { 
              backgroundColor: "#5E8D6E", 
              borderColor: "#40694E", 
              color: "#E0ECF6" },
          }}
          compFactory={ControlButton}
        />
        <Example
          title="Icon Size - 40px"
          width={120}
          config={{
            prefixIcon: "/icon:antd/audiofilled",
            iconSize: "40px",
            style: { 
              backgroundColor: "#5E8D6E", 
              borderColor: "#40694E", 
              color: "#E0ECF6" },
          }}
          compFactory={ControlButton}
        />
      </ExampleGroup>
    </>
  );
}
