import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["treeChart"].comp;

const defaultDataSource = "[\n  {\n    \"date\": \"2021-09\",\n    \"department\": \"Administration\",\n    \"spending\": 9003,\n    \"budget\": 8000\n  },\n  {\n    \"date\": \"2021-09\",\n    \"department\": \"Finance\",\n    \"spending\": 3033,\n    \"budget\": 4000\n  },\n  {\n    \"date\": \"2021-09\",\n    \"department\": \"Sales\",\n    \"spending\": 9230,\n    \"budget\": 8000\n  },\n  {\n    \"date\": \"2021-10\",\n    \"department\": \"Administration\",\n    \"spending\": 13032,\n    \"budget\": 15000\n  },\n  {\n    \"date\": \"2021-10\",\n    \"department\": \"Finance\",\n    \"spending\": 2300,\n    \"budget\": 5000\n  },\n  {\n    \"date\": \"2021-10\",\n    \"department\": \"Sales\",\n    \"spending\": 7323.5,\n    \"budget\": 8000\n  },\n  {\n    \"date\": \"2021-11\",\n    \"department\": \"Administration\",\n    \"spending\": 13000,\n    \"budget\": 16023\n  },\n  {\n    \"date\": \"2021-11\",\n    \"department\": \"Finance\",\n    \"spending\": 3569.5,\n    \"budget\": 3000\n  },\n  {\n    \"date\": \"2021-11\",\n    \"department\": \"Sales\",\n    \"spending\": 10000,\n    \"budget\": 9932\n  },\n  {\n    \"date\": \"2021-12\",\n    \"department\": \"Administration\",\n    \"spending\": 18033,\n    \"budget\": 20000\n  },\n  {\n    \"date\": \"2021-12\",\n    \"department\": \"Finance\",\n    \"spending\": 4890,\n    \"budget\": 4500\n  },\n  {\n    \"date\": \"2021-12\",\n    \"department\": \"Sales\",\n    \"spending\": 9322,\n    \"budget\": 8000\n  }\n]";

const defaultEchartsJsonOption = "{\n  \"xAxis\": {\n    \"data\": [\n      \"Day 1\",\n      \"Day 2\",\n      \"Day 3\",\n      \"Day 4\",\n      \"Day 5\"\n    ]\n  },\n  \"data\": [\n    [\n      100,\n      200,\n      50,\n      150\n    ],\n    [\n      120,\n      220,\n      80,\n      180\n    ],\n    [\n      80,\n      150,\n      60,\n      130\n    ],\n    [\n      130,\n      230,\n      110,\n      190\n    ],\n    [\n      90,\n      180,\n      70,\n      160\n    ]\n  ]\n}";

const data = JSON.stringify(defaultDataSource);
const echartsOption = JSON.stringify(defaultEchartsJsonOption);

export default function TreeChartExample() {
  const blackListConfig: string[] = ["data", "echartsOption", "series"];
  const series = [
    {
        "columnName": "spending",
        "seriesName": "Spending",
        "dataIndex": "f011b34c"
    },
    {
        "columnName": "budget",
        "seriesName": "Budget",
        "dataIndex": "30e02269"
    }
];
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.default")}
          width={500}
          height={300}
          blackListConfig={blackListConfig}
          config={{
            mode: "json",
            data: data,
            series: series,
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>
    </>
  );
}
