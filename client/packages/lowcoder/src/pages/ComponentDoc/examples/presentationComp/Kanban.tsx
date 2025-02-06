import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["kanban"].comp;

const assigneeOptions = "[\n  {\n    \"id\": \"1\",\n    \"name\": \"Nancy Davloio\"\n  },\n  {\n    \"id\": \"2\",\n    \"name\": \"Andrew Fuller\"\n  },\n  {\n    \"id\": \"3\",\n    \"name\": \"James Wilson\"\n  },\n  {\n    \"id\": \"4\",\n    \"name\": \"George Linde\"\n  }\n]";

const data = {
  "optionType": "manual",
  "manual": {
      "manual": [
          {
              "label": "Task - 29001",
              "status": "Open",
              "summary": "Analyze customer requirements.",
              "priority": "High",
              "tags": "Bug, Release Bug",
              "estimate": "0",
              "assignee": "Nancy Davloio",
              "rankId": "1",
              "id": "0"
          },
          {
              "label": "Task - 29002",
              "status": "InProgress",
              "summary": "Add responsive support to applicaton",
              "priority": "Low",
              "tags": "Story, Kanban",
              "estimate": "0",
              "assignee": "Nancy Davloio",
              "rankId": "1",
              "id": "1"
          },
          {
              "label": "Task - 29003",
              "status": "Open",
              "summary": "Resolve Frontend issues",
              "priority": "Medium",
              "tags": "Frontend, UI/UX",
              "estimate": "2",
              "assignee": "Andrew Fuller",
              "rankId": "1",
              "id": "2"
          },
          {
              "label": "Task - 29004",
              "status": "Open",
              "summary": "Setup Docker",
              "priority": "1",
              "tags": "Docker, Setup",
              "estimate": "2",
              "assignee": "James Wilson",
              "rankId": "0",
              "id": "3"
          },
          {
              "label": "Task - 29005",
              "status": "Open",
              "summary": "Setup Staging Server",
              "priority": "High",
              "tags": "Testing, BE",
              "estimate": "0",
              "assignee": "George Linde",
              "rankId": "0",
              "id": "4"
          },
          {
              "label": "Task - 29006",
              "status": "InProgress",
              "summary": "Implment Payment module",
              "priority": "High",
              "tags": "Subscription, BE",
              "estimate": "2",
              "assignee": "James Wilson",
              "rankId": "0",
              "id": "5"
          },
          {
              "label": "Task - 29007",
              "status": "InProgress",
              "summary": "Setup Project Documentation",
              "priority": "High",
              "tags": "Docs, Requirements",
              "estimate": "3",
              "assignee": "George Linde",
              "rankId": "0",
              "id": "6"
          },
          {
              "label": "Task - 29008",
              "status": "Review",
              "summary": "Setup MySQL DB",
              "priority": "High",
              "tags": "DB Setup",
              "estimate": "0",
              "assignee": "Andrew Fuller",
              "rankId": "0",
              "id": "7"
          },
          {
              "label": "Task - 29009",
              "status": "Review",
              "summary": "Project Setup",
              "priority": "High",
              "tags": "Setup",
              "estimate": "0",
              "assignee": "James Wilson",
              "rankId": "0",
              "id": "8"
          },
          {
              "label": "Task - 29010",
              "status": "Close",
              "summary": "Finalize Project Timelines",
              "priority": "High",
              "tags": "Setup, Timeline",
              "estimate": "0",
              "assignee": "Nancy Davloio",
              "rankId": "0",
              "id": "9"
          }
      ]
  },
  "mapData": {
      "data": "[{\"label\":\"Task - 29001\",\"status\":\"Open\",\"summary\":\"Analyze customer requirements.\",\"type\":\"\",\"priority\":\"High\",\"tags\":\"Bug, Release Bug\",\"estimate\":0,\"assignee\":\"Nancy Davloio\",\"rankId\":1,\"id\":0},{\"label\":\"Task - 29002\",\"status\":\"InProgress\",\"summary\":\"Add responsive support to applicaton\",\"type\":\"\",\"priority\":\"Low\",\"tags\":\"Story, Kanban\",\"estimate\":0,\"assignee\":\"Nancy Davloio\",\"rankId\":1,\"id\":1},{\"label\":\"Option 1\",\"status\":\"Open\",\"summary\":\"\",\"type\":\"\",\"priority\":\"\",\"tags\":\"\",\"estimate\":0,\"assignee\":\"\",\"rankId\":0,\"id\":2},{\"label\":\"Option 2\",\"status\":\"Open\",\"summary\":\"\",\"type\":\"\",\"priority\":\"\",\"tags\":\"\",\"estimate\":0,\"assignee\":\"\",\"rankId\":0,\"id\":3},{\"label\":\"Option 3\",\"status\":\"Open\",\"summary\":\"\",\"type\":\"\",\"priority\":\"\",\"tags\":\"\",\"estimate\":0,\"assignee\":\"\",\"rankId\":0,\"id\":4},{\"label\":\"Option 4\",\"status\":\"InProgress\",\"summary\":\"\",\"type\":\"\",\"priority\":\"\",\"tags\":\"\",\"estimate\":0,\"assignee\":\"\",\"rankId\":0,\"id\":5},{\"label\":\"Option 5\",\"status\":\"InProgress\",\"summary\":\"\",\"type\":\"\",\"priority\":\"\",\"tags\":\"\",\"estimate\":0,\"assignee\":\"\",\"rankId\":0,\"id\":6},{\"label\":\"Option 6\",\"status\":\"Review\",\"summary\":\"\",\"type\":\"\",\"priority\":\"\",\"tags\":\"\",\"estimate\":0,\"assignee\":\"\",\"rankId\":0,\"id\":7},{\"label\":\"Option 7\",\"status\":\"Review\",\"summary\":\"\",\"type\":\"\",\"priority\":\"\",\"tags\":\"\",\"estimate\":0,\"assignee\":\"\",\"rankId\":0,\"id\":8},{\"label\":\"Option 8\",\"status\":\"Close\",\"summary\":\"\",\"type\":\"\",\"priority\":\"\",\"tags\":\"\",\"estimate\":0,\"assignee\":\"\",\"rankId\":0,\"id\":9}]",
      "mapData": {
          "status": "Open"
      }
  }
};

export default function KanbanExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Kanban Component."
      >
        <Example
          title="Default View"
          hideSettings={true}
          width={1000}
          config={{
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Custom View"
          hideSettings={true}
          width={1000}
          config={{
            data: data,
            assigneeOptions: assigneeOptions,
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>
    </>
  );
}