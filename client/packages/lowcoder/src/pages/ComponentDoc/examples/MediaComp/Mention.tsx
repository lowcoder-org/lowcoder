import { MentionComp } from "comps/comps/textInputComp/mentionComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function MentionCompExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Mention Component."
      >
        <Example
          title="Default Component"
          config={{
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Placeholder Value"
          config={{
            placeholder: "Type @ to see the data",
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Default Value"
          config={{
            value: "John Doe",
          }}
          compFactory={MentionComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the Styling Properties of the Mention Component."
      >
        <Example
          title="Label Name"
          config={{
            label: {
              "text": "Mention Component",
            },
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Label Tooltip"
          config={{
            label: {
              "text": "Mention Component",
              "tooltip": "This is a Mention Component"
            },
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Label Position & Alignment - Left & Left"
          config={{
            label: {
              "text": "Mention Component",
              "position": "row",
              "align": "left"
            },
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Label Position & Alignment - Left & Right"
          config={{
            label: {
              "text": "Mention Component",
              "position": "row",
              "align": "right"
            },
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Label Position & Alignment - Top & Left"
          config={{
            label: {
              "text": "Mention Component",
              "position": "column",
              "align": "left"
            },
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Label Position & Alignment - Top & Right"
          config={{
            label: {
              "text": "Mention Component",
              "position": "column",
              "align": "right"
            },
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Label Width - 10%"
          config={{
            label: {
              "text": "Mention Component",
              "width": "10",
              "widthUnit": "%",
            },
          }}
          compFactory={MentionComp}
        />
        <Example
          title="Label Width - 30%"
          config={{
            label: {
              "text": "Mention Component",
              "width": "47",
              "widthUnit": "%",
            },
          }}
          compFactory={MentionComp}
        />
      </ExampleGroup>
    </>
  );
}
