import { SegmentedControlComp } from "comps/comps/selectInputComp/segmentedControl";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function SegmentedControlExample() {
  //   const nameMap: Record<string, string> = {};
  const blackListConfig: string[] = ["options.manual.manual"];
  const options = {
    optionType: "manual",
    manual: {
      manual: [
        {
          value: trans("componentDoc.appleOptionLabel"),
          label: trans("componentDoc.appleOptionLabel"),
          disabled: "",
          hidden: "",
        },
        {
          value: trans("componentDoc.coconutOptionLabel"),
          label: trans("componentDoc.coconutOptionLabel"),
          disabled: "",
          hidden: "",
        },
      ],
    },
  };
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Segmented Control Component."
      >
        <Example
          title={trans("componentDoc.value")}
          config={{
            defaultValue: trans("componentDoc.appleOptionLabel"),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={SegmentedControlComp}
        />
        <Example
          title={trans("componentDoc.noDefaultValue")}
          config={{
            value: trans("componentDoc.noValue"),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={SegmentedControlComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          config={{
            disabled: true,
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={SegmentedControlComp}
        />
        <Example
          title="Hiding the Segmented Control Component"
          config={{
            hidden: true,
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={SegmentedControlComp}
        />
      </ExampleGroup>

      <ExampleGroup 
        title={trans("componentDoc.labelText")} 
        description="The Following Examples Show the different Label alignment of the Segmented Control Component.">
        <Example
          title={trans("componentDoc.leftLeftAlign")}
          config={{
            defaultValue: trans("componentDoc.coconutOptionLabel"),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
              position: "row",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={SegmentedControlComp}
        />
        <Example
          title={trans("componentDoc.leftRightAlign")}
          config={{
            defaultValue: trans("componentDoc.appleOptionLabel"),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
              position: "row",
              align: "right",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={SegmentedControlComp}
        />
        <Example
          title={trans("componentDoc.topLeftAlign")}
          config={{
            defaultValue: trans("componentDoc.appleOptionLabel"),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={SegmentedControlComp}
        />
        <Example
          title={trans("componentDoc.topRightAlign")}
          config={{
            defaultValue: trans("componentDoc.appleOptionLabel"),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
              position: "column",
              align: "right",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={SegmentedControlComp}
        />
        <Example
          title="Displaying Tooltip on Hover"
          config={{
            defaultValue: trans("componentDoc.appleOptionLabel"),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
              tooltip: "This is a Tooltip on Segmented Control component"
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={SegmentedControlComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.validation")}>
        <Example
          title={trans("componentDoc.required")}
          config={{
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
            required: true,
          }}
          blackListConfig={blackListConfig}
          compFactory={SegmentedControlComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties on the Segmented Control Component."
      >
        <Example
          title="Background Color, Border Radius,Style,Width,Color"
          width={500}
          config={{
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
            style: {
              "background": "#00FFFF",
              "border": "#3377FF",
              "radius": "10px",
              "borderWidth": "3px",
              "borderStyle": "solid",
            },
          }}
          compFactory={SegmentedControlComp}
        />
        <Example
          title="Margin & Padding"
          width={500}
          config={{
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
            style: {
              "background": "#00FFFF",
              "border": "#3377FF",
              "radius": "10px",
              "borderWidth": "3px",
              "margin": "10px",
              "padding": "10px",
              "borderStyle": "dashed",
            },
          }}
          compFactory={SegmentedControlComp}
        />
        <Example
          title="Text Color, Size, Weight, Font family, Border properties"
          width={500}
          config={{
            defaultValue: trans("componentDoc.coconutOptionLabel"),
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
            style: {
              "margin": "3px",
              "padding": "3px",
              "textTransform": "Uppercase",
              "textDecoration": "underline",
              "textSize": "13px",
              "textWeight": "bold",
              "fontFamily": "Courier New",
              "fontStyle": "Italic",
              "border": "#36B389",
              "borderStyle": "solid",
              "borderWidth": "3px",
              "background": "#00FFFF",
              "indicatorBackground": "#F4EA05",

            },
          }}
          compFactory={SegmentedControlComp}
        />
        <Example
          title="Rotation - 90deg"
          config={{
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
            style: {
              "rotation": "90deg",
            },
          }}
          compFactory={SegmentedControlComp}
        />
        <Example
          title="Label - Text Color, Size, Weight, Font family, Border properties"
          width={500}
          config={{
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
            labelStyle: {
              "margin": "5px",
              "padding": "5px",
              "label": "#3377FF",
              "textTransform": "Uppercase",
              "textDecoration": "underline",
              "textSize": "13px",
              "textWeight": "bold",
              "fontFamily": "Courier New",
              "fontStyle": "Italic",
              "border": "#36B389",
              "borderStyle": "solid",
              "borderWidth": "2px"
            },
          }}
          compFactory={SegmentedControlComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the Segmented Control Component."
      >
        <Example
          title="Bounce Animation"
          width={500}
          config={{
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
            animationStyle: {
              "animation": "bounce",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={SegmentedControlComp}
        />
        <Example
          title="Swing Animation"
          width={500}
          config={{
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
            animationStyle: {
              "animation": "swing",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={SegmentedControlComp}
        />
        <Example
          title="Tada Animation"
          width={500}
          config={{
            options: options,
            label: {
              text: trans("componentDoc.likedFruits"),
            },
            animationStyle: {
              "animation": "tada",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={SegmentedControlComp}
        />
      </ExampleGroup>
    </>
  );
}
