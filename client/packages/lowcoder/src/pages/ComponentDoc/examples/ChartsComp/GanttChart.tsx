import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["ganttChart"].comp;

export default function GanttChartExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Component."
      >
        <Example
          title="Default Component"
          width={1000}
          config={{
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Advance Usage"
        description="The Following Examples Show the Advance Usage of the Gantt Chart Component."
      >
        <Example
          title="View Mode - Hour"
          width={1000}
          config={{
            headerHeight: "60",
            activeViewMode: "Hour",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="View Mode - Quarter Day"
          width={1000}
          config={{
            headerHeight: "60",
            activeViewMode: "Quarter Day",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="View Mode - Half Day"
          width={1000}
          config={{
            headerHeight: "60",
            activeViewMode: "Half Day",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="View Mode - Day"
          width={1000}
          config={{
            activeViewMode: "Day",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="View Mode - Week"
          width={1000}
          config={{
            headerHeight: "60",
            activeViewMode: "Week",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="View Mode - Month"
          width={1000}
          config={{
            headerHeight: "60",
            activeViewMode: "Month",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="View Mode - Year"
          width={1000}
          config={{
            headerHeight: "60",
            activeViewMode: "Year",
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Layout"
        description="The Following Examples Show the Layout options on the Gantt Chart Component."
      >
        <Example
          title="Hiding Header"
          width={1000}
          config={{
            showHeaders: false,
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Hiding Table Legend"
          width={1000}
          config={{
            showLegendTable: false,
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Legend Width - 500px"
          width={1000}
          config={{
            legendWidth: "500px",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Header Height - 50"
          width={1000}
          config={{
            headerHeight: "50",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Row Height - 70"
          width={1000}
          config={{
            rowHeight: "70",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Column Width - 100"
          width={1000}
          config={{
            columnWidth: "100",
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>
    </>
  );
}