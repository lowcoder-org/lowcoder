import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["calendar"].comp;

export default function CalendarExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Calendar Component."
      >
        <Example
          title="Default Calendar"
          width={700}
          height={600}
          config={{
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Hiding the Calendar component"
          width={700}
          height={600}
          config={{
            hidden: true,
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Advanced Options"
        description="The Following Examples Show the Advance usage/options of the Calendar Component."
      >
        <Example
          title="Editable - Double Click on a slot to add the Event"
          width={700}
          height={600}
          config={{
            editable: true,
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Non-Editable - New Events can't be added to a Calendar"
          width={700}
          height={600}
          config={{
            editable: false,
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Hiding Event Times"
          width={700}
          height={600}
          config={{
            showEventTime: false,
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Hiding Weekends"
          width={700}
          height={600}
          config={{
            showWeekends: false,
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Hiding All Day Option"
          width={700}
          height={600}
          config={{
            showAllDay: false,
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Layout"
        description="The Following Examples Show different Layout options of the Calendar Component."
      >
        <Example
          title="Initial Calendar View - Year"
          width={700}
          height={600}
          config={{
            currentFreeView: "multiMonthYear",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Initial Calendar View - Month"
          width={700}
          height={600}
          config={{
            currentFreeView: "dayGridMonth",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Initial Calendar View - Week"
          width={700}
          height={600}
          config={{
            currentFreeView: "timeGridWeek",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Initial Calendar View - Week"
          width={700}
          height={600}
          config={{
            currentFreeView: "dayGridWeek",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Initial Calendar View - Day Event List"
          width={700}
          height={600}
          config={{
            currentFreeView: "dayGridDay",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Initial Calendar View - Time Event List"
          width={700}
          height={600}
          config={{
            currentFreeView: "timeGridDay",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Initial Calendar View - Event List"
          width={700}
          height={600}
          config={{
            currentFreeView: "listWeek",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Start From - Saturday"
          width={700}
          height={600}
          config={{
            firstDay: 6,
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Start From - Monday"
          width={700}
          height={600}
          config={{
            firstDay: 1,
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Show Vertical ScrollBar"
          width={700}
          height={600}
          config={{
            showVerticalScrollbar: true,
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties of the Calendar Component."
      >
        <Example
          title="Background Color"
          width={700}
          height={600}
          config={{
            style: {
              "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Border Properties : Color and Radius"
          width={700}
          height={600}
          config={{
            style: {
              "border": "#053AF9",
              "radius": "10px",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Text Color"
          width={700}
          height={600}
          config={{
            style: {
              "text": "#EF0404",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Button Background Color & Text Color"
          width={700}
          height={600}
          config={{
            style: {
              "headerBtnBackground": "#36B389",
              "btnText": "#080808",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Title Color"
          width={700}
          height={600}
          config={{
            style: {
              "title": "#FFA608",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Selected Background Color - Select any time slot to see the Color"
          width={700}
          height={600}
          config={{
            style: {
              "selectBackground": "#FFA608",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Modal Style"
        description="The Following Examples Show the different Styling properties on the Modal of the Calendar Component."
      >
        <Example
          title="Background Color"
          width={700}
          height={600}
          config={{
            modalStyle: {
              "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Border Properties - Color, Width & Style"
          width={700}
          height={600}
          config={{
            modalStyle: {
              "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
              "border": "#053CFF",
              "borderWidth": "2px",
              "borderStyle": "dashed",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Input Text Color & Input fields Background Color"
          width={700}
          height={600}
          config={{
            modalStyle: {
              "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
              "text": "#FFFFFF",
              "labelBackground": "#0702F2"
            },
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different Animation Styles on the Calendar Component."
      >
        <Example
          title="Bounce Animation"
          width={700}
          height={600}
          config={{
            animationStyle: {
              "animation": "bounce",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Swing Animation"
          width={700}
          height={600}
          config={{
            animationStyle: {
              "animation": "swing",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Tada Animation"
          width={700}
          height={600}
          config={{
            animationStyle: {
              "animation": "tada",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>
    </>
  );
}