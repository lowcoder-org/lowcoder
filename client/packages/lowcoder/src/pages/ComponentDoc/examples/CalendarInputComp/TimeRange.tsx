import { TimeRangeComp } from "../../../../comps/comps/dateComp/timeComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function TimeRangeExample() {
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
          config={{
            start: "10:00:00",
            end: "12:00:00",
            format: "hh:mm:ss",
            disabled: false,
            label: {
              text: trans("componentDoc.time"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={TimeRangeComp}
        />
        <Example
          title={trans("componentDoc.noDefaultValue")}
          config={{
            format: "hh:mm:ss",
            placeholder: "Select Time",
            disabled: false,
            label: {
              text: trans("componentDoc.time"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={TimeRangeComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          config={{
            start: "10:00:00",
            end: "12:00:00",
            format: "hh:mm:ss",
            disabled: true,
            label: {
              text: trans("componentDoc.time"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={TimeRangeComp}
        />
        <Example
          title="Placeholder"
          config={{
            placeholder: "Select Time Range",
            label: {
              text: trans("componentDoc.time"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={TimeRangeComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.labelText")} description="">
        <Example
          title={trans("componentDoc.leftLeftAlign")}
          width={350}
          config={{
            start: "10:00:00",
            end: "12:00:00",
            label: {
              text: trans("componentDoc.time"),
              position: "row",
              align: "left",
            },
          }}
          compFactory={TimeRangeComp}
        />
        <Example
          title={trans("componentDoc.leftRightAlign")}
          width={350}
          config={{
            start: "10:00:00",
            end: "12:00:00",
            label: {
              text: trans("componentDoc.time"),
              position: "row",
              align: "right",
            },
          }}
          compFactory={TimeRangeComp}
        />
        <Example
          title={trans("componentDoc.topLeftAlign")}
          config={{
            start: "10:00:00",
            end: "12:00:00",
            label: {
              text: trans("componentDoc.time"),
              position: "column",
              align: "left",
            },
          }}
          compFactory={TimeRangeComp}
        />
        <Example
          title={trans("componentDoc.topRightAlign")}
          config={{
            start: "10:00:00",
            end: "12:00:00",
            label: {
              text: trans("componentDoc.time"),
              position: "column",
              align: "right",
            },
          }}
          compFactory={TimeRangeComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.validation")}>
        <Example
          title={trans("componentDoc.required")}
          config={{
            required: true,
            label: {
              text: trans("componentDoc.time"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={TimeRangeComp}
        />
        <Example
          title={trans("componentDoc.time")}
          config={{
            label: {
              text: trans("componentDoc.time"),
              position: "column",
              align: "left",
            },
            minTime: "11:00:00",
            maxTime: "12:00:00",
          }}
          blackListConfig={blackListConfig}
          compFactory={TimeRangeComp}
        />
        <Example
          title="Time Steps"
          config={{
            required: true,
            hourStep: "2",
            minuteStep: "5",
            secondStep: "15",
          }}
          blackListConfig={blackListConfig}
          compFactory={TimeRangeComp}
        />
        <Example
          title="Show Time ( 12 hours format )"
          config={{
            required: true,
            hourStep: "2",
            minuteStep: "5",
            secondStep: "15",
            use12Hours: true,
          }}
          blackListConfig={blackListConfig}
          compFactory={TimeRangeComp}
        />
        <Example
          title="Time Input Format : HH:mm"
          config={{
            inputFormat: "HH:mm",
            label: {
              text: trans("componentDoc.time"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={TimeRangeComp}
        />
          <Example
          title="Time Input Format : mm:ss"
          config={{
            inputFormat: "mm:ss",
            label: {
              text: trans("componentDoc.time"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={TimeRangeComp}
        />
        <Example
          title="Time Input Format : HH"
          config={{
            inputFormat: "HH",
            label: {
              text: trans("componentDoc.time"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={TimeRangeComp}
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
              text: trans("componentDoc.time"),
              position: "column",
              align: "left",
            },
          }}
          compFactory={TimeRangeComp}
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
              text: trans("componentDoc.time"),
              position: "column",
              align: "left",
            },
          }}
          compFactory={TimeRangeComp}
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
              text: trans("componentDoc.time"),
              position: "column",
              align: "left",
            },
          }}
          compFactory={TimeRangeComp}
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
              text: trans("componentDoc.time"),
              position: "column",
              align: "left",
            },
          }}
          compFactory={TimeRangeComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different Animation Styles on the Time Range Component."
      >
        <Example
          title="Bounce Animation"
          config={{
            showInfo: true,
            animationStyle: {
              "animation": "bounce",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
            label: {
              text: trans("componentDoc.time"),
              position: "column",
              align: "left",
            },
          }}
          compFactory={TimeRangeComp}
        />
        <Example
          title="Swing Animation"
          config={{
            showInfo: true,
            animationStyle: {
              "animation": "swing",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
            label: {
              text: trans("componentDoc.time"),
              position: "column",
              align: "left",
            },
          }}
          compFactory={TimeRangeComp}
        />
        <Example
          title="Tada Animation"
          config={{
            showInfo: true,
            animationStyle: {
              "animation": "tada",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
            label: {
              text: trans("componentDoc.time"),
              position: "column",
              align: "left",
            },
          }}
          compFactory={TimeRangeComp}
        />
      </ExampleGroup>
    </>
  );
}
