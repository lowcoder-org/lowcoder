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
            compFactory={transferComp}
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
          <Example
            title="Hiding the Transfer component"
            height={350}
            width={700}
            hideSettings={true}
            config={{
              hidden: true,
            }}
            compFactory={transferComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Advance Usage"
          description="The Following Examples Show the Advance Usage of the Transfer Component."
        >
          <Example
            title="Selected Keys"
            height={350}
            width={700}
            hideSettings={true}
            config={{
              targetKeys: "[3,5,2]",
              items: items,
              sourceTitle: "Top Priority Customers",
              targetTitle: "Paid Customers",
            }}
            compFactory={transferComp}
          />
          <Example
            title="Allow Search - False"
            height={350}
            width={700}
            hideSettings={true}
            config={{
              items: items,
              sourceTitle: "Top Priority Customers",
              targetTitle: "Paid Customers",
              showSearch: false,
            }}
            compFactory={transferComp}
          />
          <Example
            title="Allow Search - True"
            height={350}
            width={700}
            hideSettings={true}
            config={{
              items: items,
              sourceTitle: "Top Priority Customers",
              targetTitle: "Paid Customers",
              showSearch: true,
            }}
            compFactory={transferComp}
          />
          <Example
            title="Data Transfer - One Way"
            height={350}
            width={700}
            hideSettings={true}
            config={{
              items: items,
              sourceTitle: "Top Priority Customers",
              targetTitle: "Paid Customers",
              oneWay: true,
            }}
            compFactory={transferComp}
          />
          <Example
            title="Pagination"
            height={350}
            width={700}
            hideSettings={true}
            config={{
              items: items,
              sourceTitle: "Top Priority Customers",
              targetTitle: "Paid Customers",
              pagination: true,
              pageSize: "5",
            }}
            compFactory={transferComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Styling Properties"
          description="The Following Examples Show the different Styling properties of the Transfer Component."
        >
          <Example
            title="Background Color, Border Radius,Style,Width,Color"
            height={350}
            width={700}
            hideSettings={true}
            config={{
              items: items,
              sourceTitle: "Top Priority Customers",
              targetTitle: "Paid Customers",
              style: {
                "background": "#00FFFF",
                "border": "#3377FF",
                "radius": "10px",
                "borderWidth": "3px",
                "borderStyle": "solid",
              },
            }}
            compFactory={transferComp}
          />
          <Example
            title="Margin & Padding"
            height={550}
            width={700}
            hideSettings={true}
            config={{
              items: items,
              sourceTitle: "Top Priority Customers",
              targetTitle: "Paid Customers",
              style: {
                "background": "#00FFFF",
                "border": "#3377FF",
                "radius": "10px",
                "borderWidth": "3px",
                "margin": "10px",
                "padding": "10px",
                "borderStyle": "dashed",
              },
            }}
            compFactory={transferComp}
          />
          <Example
            title="Opacity - 0.2"
            height={350}
            width={700}
            hideSettings={true}
            config={{
              items: items,
              sourceTitle: "Top Priority Customers",
              targetTitle: "Paid Customers",
              style: {
                "opacity": "0.2",
              },
            }}
            compFactory={transferComp}
          />
          <Example
            title="Opacity - 0.5"
            height={350}
            width={700}
            hideSettings={true}
            config={{
              items: items,
              sourceTitle: "Top Priority Customers",
              targetTitle: "Paid Customers",
              style: {
                "opacity": "0.5",
              },
            }}
            compFactory={transferComp}
          />
          <Example
            title="Opacity - 0.7"
            height={350}
            width={700}
            hideSettings={true}
            config={{
              items: items,
              sourceTitle: "Top Priority Customers",
              targetTitle: "Paid Customers",
              style: {
                "opacity": "0.7",
              },
            }}
            compFactory={transferComp}
          />
          <Example
            title="Opacity - 1"
            height={350}
            width={700}
            hideSettings={true}
            config={{
              items: items,
              sourceTitle: "Top Priority Customers",
              targetTitle: "Paid Customers",
              style: {
                "opacity": "1",
              },
            }}
            compFactory={transferComp}
          />
        </ExampleGroup>
      </>
    );
  }