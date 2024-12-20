import { TabbedContainerComp } from "comps/comps/tabs/tabbedContainerComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function TabbedContainerExample() {
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
            compFactory={TabbedContainerComp}
          />
          <Example
            title="Disabling the Component"
            config={{ 
                disabled: true,
            }}
            compFactory={TabbedContainerComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Tabs Settings"
          description="The Following Examples Show the Usage of the Tabs on Tabs Component."
        >
          <Example
            title="Multiple Tabs & Setting a default Tab"
            config={{ 
                tabs:{
                    selectedTabKey:"Tab2",
                    manual:[
                        {
                            id:0,
                            label:"Home",
                            value:"Tab1",
                        },
                        {
                            id:1,
                            label:"Business",
                            value:"Tab2",
                        },
                        {
                            id:2,
                            label:"Pricing",
                            value:"Tab3",
                        },
                        {
                            id:3,
                            label:"Customers",
                            value:"Tab4",
                        },
                        {
                            id:4,
                            label:"Onboarding Process",
                            value:"Tab5"
                        },
                        
                    ]
                }
            }}
            compFactory={TabbedContainerComp}
          />
          <Example
            title="Hiding Tabs"
            config={{ 
                showHeader: false,
            }}
            compFactory={TabbedContainerComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Layout"
          description="The Following Examples Show the Layout options of the Tab Component."
        >
          <Example
            title="Tabs Placement - Bottom"
            config={{ 
                placement:"bottom",
            }}
            compFactory={TabbedContainerComp}
          />
          <Example
            title="Tabs Placement - Right"
            config={{ 
                placement:"right",
            }}
            compFactory={TabbedContainerComp}
          />
          <Example
            title="Tabs Placement - Left"
            config={{ 
                placement:"left",
            }}
            compFactory={TabbedContainerComp}
          />
          <Example
            title="Tabs Placement - Top"
            config={{ 
                placement:"top",
            }}
            compFactory={TabbedContainerComp}
          />
          <Example
            title="Tabs Position - Centered"
            config={{ 
                tabsCentered: true,
            }}
            compFactory={TabbedContainerComp}
          />
          <Example
            title="Gap between Tabs"
            config={{ 
                tabsGutter: 100,
            }}
            compFactory={TabbedContainerComp}
          />
        </ExampleGroup>
      </>
    );
  }