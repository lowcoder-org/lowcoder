import { ResponsiveLayoutComp } from "comps/comps/responsiveLayout/responsiveLayout";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function ResponsiveLayoutExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Component."
        >
          <Example
            title="Hiding the Component"
            config={{ 
                hidden: true,
            }}
            compFactory={ResponsiveLayoutComp}
          />
          <Example
            title="Disabling the Component"
            config={{ 
                disabled: true,
            }}
            compFactory={ResponsiveLayoutComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Layout"
          description="The Following Examples Show the Layout options on Component."
        >
          <Example
            title="Hiding the Component"
            config={{ 
                hidden: true,
            }}
            compFactory={ResponsiveLayoutComp}
          />
          <Example
            title="Disabling the Component"
            config={{ 
                disabled: true,
            }}
            compFactory={ResponsiveLayoutComp}
          />
        </ExampleGroup>
      </>
    );
  }