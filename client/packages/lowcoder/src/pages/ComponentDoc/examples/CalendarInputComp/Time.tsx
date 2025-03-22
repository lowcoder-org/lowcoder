import { TimePickerComp } from "../../../../comps/comps/dateComp/timeComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function TimeExample() {
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
            value: "10:00:00",
            format: "hh:mm:ss",
            disabled: false,
            label: {
              text: trans("componentDoc.time"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={TimePickerComp}
        />
        <Example
          title={trans("componentDoc.noDefaultValue")}
          config={{
            value: trans("componentDoc.noValue"),
            format: "hh:mm:ss",
            placeholder: "Select Time",
            disabled: false,
            label: {
              text: trans("componentDoc.time"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={TimePickerComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          config={{
            value: "10:00:00",
            format: "hh:mm:ss",
            disabled: true,
            label: {
              text: trans("componentDoc.time"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={TimePickerComp}
        />
        <Example
          title="Hiding the Time component"
          config={{
            value: "10:00:00",
            format: "hh:mm:ss",
            hidden: true,
            label: {
              text: trans("componentDoc.time"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={TimePickerComp}
        />
        <Example
          title="Placeholder"
          config={{
            format: "hh:mm:ss",
            placeholder: "Select Time Quickly",
            label: {
              text: trans("componentDoc.time"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={TimePickerComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.labelText")} description="">
        <Example
          title={trans("componentDoc.leftLeftAlign")}
          config={{
            value: "10:00:00",
            label: {
              text: trans("componentDoc.time"),
              position: "row",
              align: "left",
            },
          }}
          compFactory={TimePickerComp}
        />
        <Example
          title={trans("componentDoc.leftRightAlign")}
          config={{
            value: "10:00:00",
            label: {
              text: trans("componentDoc.time"),
              position: "row",
              align: "right",
            },
          }}
          compFactory={TimePickerComp}
        />
        <Example
          title={trans("componentDoc.topLeftAlign")}
          config={{
            value: "10:00:00",
            label: {
              text: trans("componentDoc.time"),
              position: "column",
              align: "left",
            },
          }}
          compFactory={TimePickerComp}
        />
        <Example
          title={trans("componentDoc.topRightAlign")}
          config={{
            value: "10:00:00",
            label: {
              text: trans("componentDoc.time"),
              position: "column",
              align: "right",
            },
          }}
          compFactory={TimePickerComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.validation")}>
        <Example
          title={trans("componentDoc.required")}
          config={{
            required: true,
            label: {
              text: trans("componentDoc.time"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={TimePickerComp}
        />
        <Example
          title="Minimum and Maximum Time Limits"
          config={{
            value: "10:00:00",
            label: {
              text: trans("componentDoc.time"),
            },
            minTime: "11:00:00",
            maxTime: "12:00:00",
          }}
          blackListConfig={blackListConfig}
          compFactory={TimePickerComp}
        />
        <Example
          title="Time Steps"
          config={{
            required: true,
            hourStep: "2",
            minuteStep: "10",
            secondStep: "30",
            label: {
              text: trans("componentDoc.time"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={TimePickerComp}
        />
        <Example
          title= "Show Time ( 12 Hours format )"
          config={{
            required: true,
            hourStep: "2",
            minuteStep: "10",
            secondStep: "30",
            use12Hours: true,
            label: {
              text: trans("componentDoc.time"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={TimePickerComp}
        />
        <Example
          title="Time Input Format : HH:mm"
          config={{
            inputFormat: "HH:mm",
            label: {
              text: trans("componentDoc.time"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={TimePickerComp}
        />
         <Example
          title="Time Input Format : mm:ss"
          config={{
            inputFormat: "mm:ss",
            label: {
              text: trans("componentDoc.time"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={TimePickerComp}
        />
        <Example
          title="Time Input Format : HH"
          config={{
            inputFormat: "HH",
            label: {
              text: trans("componentDoc.time"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={TimePickerComp}
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
              text: trans("componentDoc.time"),
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
          compFactory={TimePickerComp}
        />
        <Example
          title="Label Styling properties"
          config={{
            label: {
              text: trans("componentDoc.time"),
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
          compFactory={TimePickerComp}
        />
        <Example
          title="Input Field Styling properties"
          config={{
            label: {
              text: trans("componentDoc.time"),
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
          compFactory={TimePickerComp}
        />
        <Example
          title="Children Input Field Styling properties"
          config={{
            label: {
              text: trans("componentDoc.time"),
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
          compFactory={TimePickerComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different Animation Styles on the Time Component."
      >
        <Example
          title="Bounce Animation"
          config={{
            label: {
              text: trans("componentDoc.time"),
            },
            showInfo: true,
            animationStyle: {
              "animation": "bounce",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={TimePickerComp}
        />
        <Example
          title="Swing Animation"
          config={{
            label: {
              text: trans("componentDoc.time"),
            },
            showInfo: true,
            animationStyle: {
              "animation": "swing",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={TimePickerComp}
        />
        <Example
          title="Tada Animation"
          config={{
            label: {
              text: trans("componentDoc.time"),
            },
            showInfo: true,
            animationStyle: {
              "animation": "tada",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={TimePickerComp}
        />
      </ExampleGroup>
    </>
  );
}
