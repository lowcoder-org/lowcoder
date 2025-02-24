import { transferComp } from "comps/comps/transferComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const items = "[\n  {\n    \"key\": \"1\",\n    \"title\": \"Alice Jones\"\n    \"description\" : \"Business Owner\"\n  },\n  {\n    \"key\": \"2\",\n    \"title\": \"James Anderson\"\n  },\n  {\n    \"key\": \"3\",\n    \"title\": \"Philip Salt\"\n  },\n  {\n    \"key\": \"4\",\n    \"title\": \"Martinez\"\n  },\n  {\n    \"key\": \"5\",\n    \"title\": \"Chris Harris\"\n  },\n  {\n    \"key\": \"6\",\n    \"title\": \"John Smith\"\n  },\n  {\n    \"key\": \"7\",\n    \"title\": \"Christina\"\n  }\n]";

export default function TransferExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Transfer Component."
        >
          <Example
            title="Default Transfer Component"
            height={350}
            width={700}
            hideSettings={true}
            config={{
            }}
            compFactory={TransferComp}
          />
          <Example
            title="Transfer Component with Custom Data"
            height={350}
            width={700}
            hideSettings={true}
            config={{
              items: items,
              sourceTitle: "Top Priority Customers",
              targetTitle: "Paid Customers",
            }}
            compFactory={TransferComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Transfer Component."
        >
          <Example
            title="Default Transfer Component"
            height={350}
            width={700}
            hideSettings={true}
            config={{
            }}
            compFactory={TransferComp}
          />
          <Example
            title="Transfer Component with Custom Data"
            height={350}
            width={700}
            hideSettings={true}
            config={{
              items: items,
              sourceTitle: "Top Priority Customers",
              targetTitle: "Paid Customers",
            }}
            compFactory={TransferComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Transfer Component."
        >
          <Example
            title="Default Transfer Component"
            height={350}
            width={700}
            hideSettings={true}
            config={{
            }}
            compFactory={TransferComp}
          />
          <Example
            title="Transfer Component with Custom Data"
            height={350}
            width={700}
            hideSettings={true}
            config={{
              items: items,
              sourceTitle: "Top Priority Customers",
              targetTitle: "Paid Customers",
            }}
            compFactory={transferComp}
          />
        </ExampleGroup>
      </>
    );
  }