import { AutoCompleteComp } from "comps/comps/autoCompleteComp/autoCompleteComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const items= "[\n  {\n    \"value\": \"1-BeiJing\",\n    \"label\": \"Beijing\"\n  },\n  {\n    \"value\": \"2-ShangHai\",\n    \"label\": \"Shanghai\"\n  },\n  {\n    \"value\": \"3-GuangDong\",\n    \"label\": \"Guandong\"\n  },\n  {\n    \"value\": \"4-ShenZhen\",\n    \"label\": \"Shenzhen\"\n  }\n]";

export default function AutoCompleteExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Auto-Complete Component."
      >
        <Example
          title="A simple Auto-Complete Component"
          config={{
            items: items,
          }}
          compFactory={AutoCompleteComp}
        />
        <Example
          title="Hiding the Auto-Complete Component"
          config={{
            items: items,
            hidden: true,
          }}
          compFactory={AutoCompleteComp}
        />
        <Example
          title="Disabling the Auto-Complete Component"
          config={{
            items: items,
            disabled: true,
          }}
          compFactory={AutoCompleteComp}
        />
        <Example
          title="Auto-Complete Component - Placeholder"
          config={{
            items: items,
            placeholder: "This is an Auto-Complete Component",
          }}
          compFactory={AutoCompleteComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Label & Layout"
        description="The Following Examples Show the Layout of the Auto-Complete Component."
      >
        <Example
          title="Left-Left Alignment"
          config={{
            items: items,
            label:{
              align: "left",
              position: "row",
            }
          }}
          compFactory={AutoCompleteComp}
        />
        <Example
          title="Left-Right Alignment"
          config={{
            items: items,
            label:{
              align: "right",
              position: "row",
            }
          }}
          compFactory={AutoCompleteComp}
        />
        <Example
          title="Top-Left Alignment"
          config={{
            items: items,
            label:{
              align: "left",
              position: "column",
            }
          }}
          compFactory={AutoCompleteComp}
        />
        <Example
          title="Top-Right Alignment"
          config={{
            items: items,
            label:{
              align: "right",
              position: "column",
            }
          }}
          compFactory={AutoCompleteComp}
        />
      </ExampleGroup>
    </>
  );
}
