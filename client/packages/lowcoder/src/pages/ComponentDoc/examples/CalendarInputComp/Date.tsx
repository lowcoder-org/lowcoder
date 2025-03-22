import { DatePickerComp } from "comps/comps/dateComp/dateComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function DateExample() {
  const blackListConfig: string[] = [trans("componentDoc.labelText")];
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.value")}
          config={{
            value: "2022-01-01",
            format: "YYYY-MM-DD",
            disabled: false,
            label: {
              text: trans("componentDoc.date"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DatePickerComp}
        />
        <Example
          title={trans("componentDoc.noDefaultValue")}
          config={{
            value: trans("componentDoc.noValue"),
            format: "YYYY-MM-DD",
            placeholder: "Select Date",
            disabled: false,
            label: {
              text: trans("componentDoc.date"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DatePickerComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          config={{
            value: "2022-01-01",
            format: "YYYY-MM-DD",
            disabled: true,
            label: {
              text: trans("componentDoc.date"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DatePickerComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Date Component - Picker mode"
        description="The Following Examples Show the different picker modes of the Date Component."
      >
        <Example
          title="Picker mode - Date"
          config={{
            pickerMode: "day",
            label: {
              text: trans("componentDoc.date"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DatePickerComp}
        />
         <Example
          title="Picker mode - Week"
          config={{
            pickerMode: "week",
            label: {
              text: trans("componentDoc.date"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DatePickerComp}
        />
         <Example
          title="Picker mode - Month"
          config={{
            pickerMode: "month",
            label: {
              text: trans("componentDoc.date"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DatePickerComp}
        />
         <Example
          title="Picker mode - Quarter"
          config={{
            pickerMode: "quarter",
            label: {
              text: trans("componentDoc.date"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DatePickerComp}
        />
         <Example
          title="Picker mode - Year"
          config={{
            pickerMode: "year",
            label: {
              text: trans("componentDoc.date"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DatePickerComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.labelText")} description="">
        <Example
          title={trans("componentDoc.leftLeftAlign")}
          config={{
            value: "2022-01-01",
            label: {
              text: trans("componentDoc.date"),
              position: "row",
              align: "left",
            },
          }}
          compFactory={DatePickerComp}
        />
        <Example
          title={trans("componentDoc.leftRightAlign")}
          config={{
            value: "2022-01-01",
            label: {
              text: trans("componentDoc.date"),
              position: "row",
              align: "right",
            },
          }}
          compFactory={DatePickerComp}
        />
        <Example
          title={trans("componentDoc.topLeftAlign")}
          config={{
            value: "2022-01-01",
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "left",
            },
          }}
          compFactory={DatePickerComp}
        />
        <Example
          title={trans("componentDoc.topRightAlign")}
          config={{
            value: "2022-01-01",
            label: {
              text: trans("componentDoc.date"),
              position: "column",
              align: "right",
            },
          }}
          compFactory={DatePickerComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.validation")}>
        <Example
          title={trans("componentDoc.required")}
          config={{
            required: true,
            label: {
              text: trans("componentDoc.date"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DatePickerComp}
        />
        <Example
          title={trans("componentDoc.date")}
          config={{
            value: "2022-01-01",
            label: {
              text: trans("componentDoc.date"),
            },
            minDate: "2022-03-01",
            maxDate: "2022-04-01",
          }}
          blackListConfig={blackListConfig}
          compFactory={DatePickerComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Advance Usage"
        description="The Following Examples Show the Advance Usage of the Date Component."
      >
        <Example
          title="Show Time alongwith Calendar"
          config={{
            showTime: true,
            label: {
              text: trans("componentDoc.date"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DatePickerComp}
        />
        <Example
          title="Show Time in 12 Hours format"
          config={{
            showTime: true,
            use12Hours: true,
            label: {
              text: trans("componentDoc.date"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DatePickerComp}
        />
        <Example
          title="Date Input Format : DD-MM-YYYY"
          config={{
            inputFormat: "DD-MM-YYYY",
            label: {
              text: trans("componentDoc.date"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DatePickerComp}
        />
          <Example
          title="Time Input Format : MM-DD-YYYY"
          config={{
            inputFormat: "MM-DD-YYYY",
            label: {
              text: trans("componentDoc.date"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DatePickerComp}
        />
        <Example
          title="Time Input Format : YYYY-MM-DD"
          config={{
            inputFormat: "YYYY-MM-DD",
            label: {
              text: trans("componentDoc.date"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DatePickerComp}
        />
        <Example
          title="Time Input Format : MM-YYYY"
          config={{
            inputFormat: "MM-YYYY",
            label: {
              text: trans("componentDoc.date"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DatePickerComp}
        />
        <Example
          title="Suffix Icon on Calendar component"
          config={{
            suffixIcon: "/icon:regular/calendar-days",
            label: {
              text: trans("componentDoc.date"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={DatePickerComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties of the Time Component."
      >
        <Example
          title="Time component Styling properties"
          config={{
            label: {
              text: trans("componentDoc.date"),
            },
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
          }}
          compFactory={DatePickerComp}
        />
        <Example
          title="Label Styling properties"
          config={{
            label: {
              text: trans("componentDoc.date"),
            },
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
          }}
          compFactory={DatePickerComp}
        />
        <Example
          title="Input Field Styling properties"
          config={{
            label: {
              text: trans("componentDoc.date"),
            },
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
          }}
          compFactory={DatePickerComp}
        />
        <Example
          title="Children Input Field Styling properties"
          config={{
            label: {
              text: trans("componentDoc.date"),
            },
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
          }}
          compFactory={DatePickerComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different Animation Styles on the Time Component."
      >
        <Example
          title="Bounce Animation"
          config={{
            showInfo: true,
            label: {
              text: trans("componentDoc.date"),
            },
            animationStyle: {
              "animation": "bounce",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={DatePickerComp}
        />
        <Example
          title="Swing Animation"
          config={{
            label: {
              text: trans("componentDoc.date"),
            },
            showInfo: true,
            animationStyle: {
              "animation": "swing",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={DatePickerComp}
        />
        <Example
          title="Tada Animation"
          config={{
            label: {
              text: trans("componentDoc.date"),
            },
            showInfo: true,
            animationStyle: {
              "animation": "tada",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={DatePickerComp}
        />
      </ExampleGroup>
    </>
  );
}
