import { DateRangeComp } from "comps/comps/dateComp/dateComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function DateRangeExample() {
  const nameMap: Record<string, string> = {
    start: trans("componentDoc.defaultStartDateValue"),
    end: trans("componentDoc.defaultEndDateValue"),
  };
  const blackListConfig: string[] = [
    trans("componentDoc.labelText"),
    trans("componentDoc.labelPosition"),
    trans("componentDoc.labelAlign"),
    "start",
    "end",
  ];
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.value")}
          width={500}
          config={{
            start: "2022-01-01",
            end: "2022-02-01",
            format: "YYYY-MM-DD",
            disabled: false,
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          nameMap={nameMap}
          blackListConfig={blackListConfig.slice(0, 3)}
          compFactory={DateRangeComp}
        />
        <Example
          title={trans("componentDoc.noDefaultValue")}
          width={500}
          config={{
            value: trans("componentDoc.noValue"),
            format: "YYYY-MM-DD",
            disabled: false,
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          nameMap={nameMap}
          blackListConfig={blackListConfig.slice(0, 3)}
          compFactory={DateRangeComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          width={500}
          config={{
            start: "2022-01-01",
            end: "2022-02-01",
            format: "YYYY-MM-DD",
            disabled: true,
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          nameMap={nameMap}
          blackListConfig={blackListConfig.slice(0, 3)}
          compFactory={DateRangeComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Date Component - Picker mode"
        description="The Following Examples Show the different picker modes of the Date Range Component."
      >
        <Example
          title="Picker mode - Date"
          width={500}
          config={{
            pickerMode: "day",
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DateRangeComp}
        />
          <Example
          title="Picker mode - Week"
          width={500}
          config={{
            pickerMode: "week",
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DateRangeComp}
        />
          <Example
          title="Picker mode - Month"
          width={500}
          config={{
            pickerMode: "month",
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DateRangeComp}
        />
          <Example
          title="Picker mode - Quarter"
          width={500}
          config={{
            pickerMode: "quarter",
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DateRangeComp}
        />
          <Example
          title="Picker mode - Year"
          width={500}
          config={{
            pickerMode: "year",
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DateRangeComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.labelText")} description="">
        <Example
          title={trans("componentDoc.leftLeftAlign")}
          width={400}
          config={{
            start: "2022-01-01",
            end: "2022-02-01",
            label: {
              text: trans("componentDoc.date"),
              position: "row",
              align: "left",
            },
          }}
          nameMap={nameMap}
          compFactory={DateRangeComp}
        />
        <Example
          title={trans("componentDoc.leftRightAlign")}
          width={400}
          config={{
            start: "2022-01-01",
            end: "2022-02-01",
            label: {
              text: trans("componentDoc.date"),
              position: "row",
              align: "right",
            },
          }}
          nameMap={nameMap}
          compFactory={DateRangeComp}
        />
        <Example
          title={trans("componentDoc.topLeftAlign")}
          config={{
            start: "2022-01-01",
            end: "2022-02-01",
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          nameMap={nameMap}
          compFactory={DateRangeComp}
        />
        <Example
          title={trans("componentDoc.topRightAlign")}
          config={{
            start: "2022-01-01",
            end: "2022-02-01",
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "right",
            },
          }}
          nameMap={nameMap}
          compFactory={DateRangeComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.validation")}>
        <Example
          title={trans("componentDoc.required")}
          config={{
            required: true,
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          nameMap={nameMap}
          blackListConfig={blackListConfig.slice(0, 3)}
          compFactory={DateRangeComp}
        />
        <Example
          title={trans("componentDoc.date")}
          config={{
            start: "2022-01-01",
            end: "2022-02-01",
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
            minDate: "2022-03-01",
            maxDate: "2022-04-01",
          }}
          nameMap={nameMap}
          blackListConfig={blackListConfig.slice(0, 3)}
          compFactory={DateRangeComp}
        />
        <Example
          title="Show Time"
          config={{
            required: true,
            showTime: true,
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          nameMap={nameMap}
          blackListConfig={blackListConfig.slice(0, 3)}
          compFactory={DateRangeComp}
        />
        <Example
          title="Show Time ( 12 hours format )"
          config={{
            required: true,
            showTime: true,
            use12Hours: true,
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          nameMap={nameMap}
          blackListConfig={blackListConfig.slice(0, 3)}
          compFactory={DateRangeComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Advance Usage"
        description="The Following Examples Show the Advance Usage of the Date Range Component."
      >
        <Example
          title="Show Time alongwith Calendar"
          width={500}
          config={{
            showTime: true,
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DateRangeComp}
        />
        <Example
          title="Show Time in 12 Hours format"
          width={500}
          config={{
            showTime: true,
            use12Hours: true,
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DateRangeComp}
        />
        <Example
          title="Date Input Format : DD-MM-YYYY"
          width={500}
          config={{
            inputFormat: "DD-MM-YYYY",
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DateRangeComp}
        />
          <Example
          title="Time Input Format : MM-DD-YYYY"
          width={500}
          config={{
            inputFormat: "MM-DD-YYYY",
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DateRangeComp}
        />
        <Example
          title="Time Input Format : YYYY-MM-DD"
          width={500}
          config={{
            inputFormat: "YYYY-MM-DD",
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DateRangeComp}
        />
        <Example
          title="Time Input Format : MM-YYYY"
          width={500}
          config={{
            inputFormat: "MM-YYYY",
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DateRangeComp}
        />
        <Example
          title="Suffix Icon on Calendar component"
          width={500}
          config={{
            suffixIcon: "/icon:regular/calendar-days",
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DateRangeComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties of the Time Range Component."
      >
        <Example
          title="Time Range component Styling properties"
          config={{
            style: {
              "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
              "margin": "10px",
              "padding": "10px",
              "text": "#222222",
              "textSize": "20px",
              "textWeight": "bold",
              "fontStyle": "italic",
              "border": "#222222",
              "borderStyle": "solid",
              "radius": "10px",
              "borderWidth": "2px",
            },
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          compFactory={DateRangeComp}
        />
        <Example
          title="Label Styling properties"
          config={{
            labelStyle: {
              "margin": "5px",
              "padding": "5px",
              "label": "#01865B",
              "textTransform": "Uppercase",
              "textDecoration": "underline",
              "textSize": "18px",
              "textWeight": "bold",
              "fontStyle": "italic",
              "border": "#222222",
              "borderWidth": "2px",
              "borderStyle": "solid",
            },
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          compFactory={DateRangeComp}
        />
        <Example
          title="Input Field Styling properties"
          config={{
            inputFieldStyle: {
              "background": "linear-gradient(45deg, #d53369 0%, #daae51 100%)",
              "border": "#222222",
              "radius": "10px",
              "text": "#222222",
              "margin": "5px",
              "padding": "10px",
              "borderStyle": "dashed",
              "borderWidth": "3px",
              "accent": "#36B389"
            },
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          compFactory={DateRangeComp}
        />
        <Example
          title="Children Input Field Styling properties"
          config={{
            childrenInputFieldStyle: {
              "margin": "5px",
              "padding": "20px",
              "text": "#3377FF",
              "textDecoration": "underline",
              "textSize": "15px",
              "textWeight": "bold",
              "fontFamily": "Courier New",
              "fontStyle": "italic",
              "border": "#36B389",
              "borderStyle": "solid",
              "radius": "10px",
              "borderWidth": "3px",
              "background": "#11F7E9"
            },
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          compFactory={DateRangeComp}
        />
      </ExampleGroup>
    </>
  );
}
