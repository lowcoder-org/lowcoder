import { CardComp } from "comps/comps/containerComp/cardComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function ContentCardExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Card Component."
        >
          <Example
            title="Hiding the Card Component"
            config={{ 
                hidden: true,
            }}
            compFactory={CardComp}
          />
          <Example
            title="Hiding the Title"
            config={{ 
                showTitle: false,
            }}
            compFactory={CardComp}
          />
          <Example
            title="Hiding the Content Title & Description"
            config={{ 
                showMeta: false,
            }}
            compFactory={CardComp}
          />
          <Example
            title="Hiding the Action Items"
            config={{ 
                showActionIcon: false,
            }}
            compFactory={CardComp}
          />
          <Example
            title="Custom text on Title and Description"
            config={{ 
                title: "Jennifer Holmes",
                metaTitle: "Head Cook",
                metaDesc: "Responsible for the daily preparation of food for participants, including the cooking of meals, and maintaining high standards of food quality, food production and portion control using the standardized menu. ",
            }}
            compFactory={CardComp}
          />
        </ExampleGroup>
      </>
    );
  }