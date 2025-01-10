import { JsonEditorComp } from "comps/comps/jsonComp/jsonEditorComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const schema='{\n  "title": "User profile",\n  "description": "form example",\n  "type": "object",\n  "required": [\n    "name",\n    "phone"\n  ],\n  "properties": {\n    "name": {\n      "type": "string",\n      "title": "Name"\n    },\n    "phone": {\n      "type": "string",\n      "title": "Phone",\n      "minLength": 11\n    },\n    "birthday": {\n      "type": "string",\n      "title": "Birthday"\n    }\n  }\n}';
const uiSchema='{\n  "name": {\n    "ui:autofocus": true,\n    "ui:emptyValue": ""\n  },\n  "phone": {\n    "ui:help": "Please input a 11 digits number"\n  },\n  "birthday": {\n    "ui:widget": "date"\n  }\n}';
const data='{\n  "name": "Tom",\n  "phone": "13488886666",\n  "birthday": "1980-03-16"\n}';

export default function JsonEditorExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the JSON Editor Component."
      >
        <Example
          title="A Simple JSON Editor Form "
          hideSettings={true}
          config={{
            schema: schema,
            uiSchema: uiSchema,
            data: data,
          }}
          compFactory={JsonEditorComp}
        />
        <Example
          title="Hiding the JSON Editor Form "
          hideSettings={true}
          config={{
            schema: schema,
            uiSchema: uiSchema,
            data: data,
            hidden: true,
          }}
          compFactory={JsonEditorComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Label Layout"
        description="The Following Examples Show the Label Layout on JSON Editor Component."
      >
        <Example
          title="Adding Label on JSON Editor Form "
          hideSettings={true}
          config={{
            schema: schema,
            uiSchema: uiSchema,
            data: data,
            label:{
              text: "JSON Editor Form",
            }
          }}
          compFactory={JsonEditorComp}
        />
        <Example
          title="Adding Tooltip on JSON Editor Form "
          hideSettings={true}
          config={{
            schema: schema,
            uiSchema: uiSchema,
            data: data,
            label:{
              text: "JSON Editor Form",
              tooltip: "This is a ToolTip on JSON Editor Form",
            }
          }}
          compFactory={JsonEditorComp}
        />
        <Example
          title="Label Position - Top"
          hideSettings={true}
          config={{
            schema: schema,
            uiSchema: uiSchema,
            data: data,
            label:{
              text: "JSON Editor Form",
              position: "column",
            }
          }}
          compFactory={JsonEditorComp}
        />
        <Example
          title="Label Position - Left "
          hideSettings={true}
          config={{
            schema: schema,
            uiSchema: uiSchema,
            data: data,
            label:{
              text: "JSON Editor Form",
              position: "row",
            }
          }}
          compFactory={JsonEditorComp}
        />
        <Example
          title="Label Alignment - Right"
          hideSettings={true}
          config={{
            schema: schema,
            uiSchema: uiSchema,
            data: data,
            label:{
              text: "JSON Editor Form",
              position: "column",
              align: "right",
            }
          }}
          compFactory={JsonEditorComp}
        />
        <Example
          title="Label Alignment - Left"
          hideSettings={true}
          config={{
            schema: schema,
            uiSchema: uiSchema,
            data: data,
            label:{
              text: "JSON Editor Form",
              position: "column",
              align: "left",
            }
          }}
          compFactory={JsonEditorComp}
        />
      </ExampleGroup>
    </>
  );
}
