import { PageLayoutComp } from "comps/comps/containerComp/pageLayoutComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function PageLayoutExample() {
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
            compFactory={PageLayoutComp}
          />
          <Example
            title="Disabling the Component"
            config={{ 
                disabled: true,
            }}
            compFactory={PageLayoutComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Layout"
          description="The Following Examples Show the Layout options on Component."
        >
          <Example
            title="Hiding the Component"
            config={{ 
                container:{
                  header:{
                    layout:{

                    }
                  },
                  footer:{
                    layout:{

                    }
                  },
                  showHeader: true,
                  showFooter: true,
                  sider:{
                    layout:{
                    }
                  },
                  showSider: true,
                  siderCollapsed: true,
                  siderWidth: "40%",
                }
            }}
            compFactory={PageLayoutComp}
          />
        </ExampleGroup>
      </>
    );
  }