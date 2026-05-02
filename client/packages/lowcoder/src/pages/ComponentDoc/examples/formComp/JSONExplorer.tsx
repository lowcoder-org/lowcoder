import { JsonExplorerComp } from "comps/comps/jsonComp/jsonExplorerComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const schema='{\n  "title": "User profile",\n  "description": "form example",\n  "type": "object",\n  "required": [\n    "name",\n    "phone"\n  ],\n  "properties": {\n    "name": {\n      "type": "string",\n      "title": "Name"\n    },\n    "phone": {\n      "type": "string",\n      "title": "Phone",\n      "minLength": 11\n    },\n    "birthday": {\n      "type": "string",\n      "title": "Birthday"\n    }\n  }\n}';
const uiSchema='{\n  "name": {\n    "ui:autofocus": true,\n    "ui:emptyValue": ""\n  },\n  "phone": {\n    "ui:help": "Please input a 11 digits number"\n  },\n  "birthday": {\n    "ui:widget": "date"\n  }\n}';
const data='{\n  "name": "Tom",\n  "phone": "13488886666",\n  "birthday": "1980-03-16"\n}';
export default function JsonExplorerExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the JSON Explorer Component."
      >
        <Example
          title="A Simple JSON Explorer Form"
          hideSettings={true}
          config={{
            schema: schema,
            uiSchema: uiSchema,
            data: data,
          }}
          compFactory={JsonExplorerComp}
        />
        <Example
          title="Hiding JSON Explorer Form"
          hideSettings={true}
          config={{
            schema: schema,
            uiSchema: uiSchema,
            data: data,
            hidden: true,
          }}
          compFactory={JsonExplorerComp}
        />
        <Example
          title="JSON Explorer - Non-Expanded by Default"
          hideSettings={true}
          config={{
            schema: schema,
            uiSchema: uiSchema,
            data: data,
            expandToggle: false,
          }}
          compFactory={JsonExplorerComp}
        />
        <Example
          title="JSON Explorer - Indent Level: 5"
          hideSettings={true}
          config={{
            schema: schema,
            uiSchema: uiSchema,
            data: data,
            indent: "5",
          }}
          compFactory={JsonExplorerComp}
        />
        <Example
          title="JSON Explorer - Indent Level: 10"
          hideSettings={true}
          config={{
            schema: schema,
            uiSchema: uiSchema,
            data: data,
            indent: "10",
          }}
          compFactory={JsonExplorerComp}
        />
      </ExampleGroup>
    </>
  );
}
