import { ContainerComp } from "comps/comps/containerComp/containerComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function ContainerExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Container Component."
        >
          <Example
            title="Hiding the Component"
            config={{ 
                hidden: true,
            }}
            compFactory={ContainerComp}
          />
          <Example
            title="Disabling the Component"
            config={{ 
                disabled: true,
            }}
            compFactory={ContainerComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Layout"
          description="The Following Examples Show the Layout options of the Container Component."
        >
          <Example
            title="Setting the Inner Container Properties"
            config={{ 
                container:{
                    showHeader: true,
                    showBody: true,
                    showFooter: true,
                }
            }}
            compFactory={ContainerComp}
          />
        </ExampleGroup>
      </>
    );
  }