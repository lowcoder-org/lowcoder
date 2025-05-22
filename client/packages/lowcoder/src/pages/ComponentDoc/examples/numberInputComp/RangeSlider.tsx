import { RangeSliderComp } from "comps/comps/numberInputComp/rangeSliderComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function RangeSliderExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Range Slider Component."
      >
        <Example
          title={trans("componentDoc.default")}
          config={{
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title={trans("componentDoc.disabled")}
          config={{
            disabled: "true",
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title="Hiding the Range Slider component"
          config={{
            hidden: true,
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title="Step Size - 10"
          config={{
            step: "10",
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title="Step Size - 20"
          config={{
            step: "20",
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title="Setting Minimum & Maximum Values"
          config={{
            min: "30",
            max: "150",
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title="Setting Minimum & Maximum Values"
          config={{
            min: "30",
            max: "150",
            start: "70",
            end: "140",
          }}
          compFactory={RangeSliderComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.labelText")} description="">
        <Example
          title={trans("componentDoc.leftLeftAlign")}
          config={{
            label: {
              text: trans("componentDoc.labelText"),
              position: "row",
              align: "left",
            },
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title={trans("componentDoc.leftRightAlign")}
          config={{
            label: {
              text: trans("componentDoc.labelText"),
              position: "row",
              align: "right",
            },
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title={trans("componentDoc.topLeftAlign")}
          config={{
            label: {
              text: trans("componentDoc.labelText"),
              position: "column",
              align: "left",
            },
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title={trans("componentDoc.topRightAlign")}
          config={{
            label: {
              text: trans("componentDoc.labelText"),
              position: "column",
              align: "right",
            },
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title="Tooltip on Hover"
          config={{
            label: {
              text: trans("componentDoc.labelText"),
              tooltip: "This is a Tooltip displayed on Hover",
            },
          }}
          compFactory={RangeSliderComp}
        />
      </ExampleGroup>

      <ExampleGroup 
        title="Layout Options"
        description="The Following Examples Show the Layout Options of the Slider Component."
      >
        <Example
          title="Prefix Icon"
          config={{
            prefixIcon: "/icon:solid/arrow-down-wide-short",
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title="Suffix Icon"
          config={{
            suffixIcon: "/icon:solid/arrow-up-wide-short",
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title="Prefix & Suffix Icon"
          config={{
            prefixIcon: "/icon:solid/arrow-down-wide-short",
            suffixIcon: "/icon:solid/arrow-up-wide-short",
          }}
          compFactory={RangeSliderComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties on the Range Slider Component."
      >
        <Example
          title="Background Color, Border Radius,Style,Width,Color"
          config={{
            style: {
              "background": "#00FFFF",
              "border": "#3377FF",
              "radius": "10px",
              "borderWidth": "3px",
              "borderStyle": "solid",
            },
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title="Margin & Padding"
          config={{
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
          compFactory={RangeSliderComp}
        />
        <Example
          title="Opacity - 0.2"
          config={{
            style: {
              "opacity": "0.2",
            },
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title="Opacity - 0.5"
          config={{
            style: {
              "opacity": "0.5",
            },
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title="Opacity - 0.7"
          config={{
            style: {
              "opacity": "0.7",
            },
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title="Opacity - 1"
          config={{
            style: {
              "opacity": "1",
            },
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title="Rotation - 90deg"
          config={{
            style: {
              "rotation": "90deg",
            },
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title="Label - Text Color, Size, Weight, Font family, Border properties"
          config={{
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
              "borderWidth": "2px",
            },
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title="Input Field Style"
          config={{
            inputFieldStyle: {
              "fill": "#36B389",
              "thumbBorder": "#222222",
              "thumb": "#FFD501",
              "track": "#E68E50",
              "margin": "5px",
            },
          }}
          compFactory={RangeSliderComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the Slider Component."
      >
        <Example
          title="Bounce Animation"
          config={{
            animationStyle: {
              "animation": "bounce",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite",
            },
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title="Swing Animation"
          config={{
            animationStyle: {
              "animation": "swing",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite",
            },
          }}
          compFactory={RangeSliderComp}
        />
        <Example
          title="Tada Animation"
          config={{
            animationStyle: {
              "animation": "tada",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite",
            },
          }}
          compFactory={RangeSliderComp}
        />
      </ExampleGroup>
    </>
  );
}
