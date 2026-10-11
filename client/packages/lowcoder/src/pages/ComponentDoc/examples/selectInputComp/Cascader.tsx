import { CascaderWithDefault } from "comps/comps/selectInputComp/cascaderComp";
import { trans, i18nObjs } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const options = '[\n {\n  "value": "California",\n  "label": "California",\n  "children": [\n   {\n    "value": "San Francisco",\n    "label": "San Francisco",\n    "children": [\n     {\n      "value": "The Golden Gate Bridge",\n      "label": "The Golden Gate Bridge"\n     }\n    ]\n   }\n  ]\n },\n {\n  "value": "New South Wales",\n  "label": "New South Wales",\n  "children": [\n   {\n    "value": "Sydney",\n    "label": "Sydney",\n    "children": [\n     {\n      "value": "Sydney Opera House",\n      "label": "Sydney Opera House"\n     }\n    ]\n   }\n  ]\n }\n]';

export default function CascaderExample() {
  const blackListConfig: string[] = ["options"];

  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.value")}
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            disabled: false,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CascaderWithDefault}
        />
        <Example
          title={trans("componentDoc.noDefaultValue")}
          config={{
            value: trans("componentDoc.noValue"),
            disabled: false,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CascaderWithDefault}
        />
        <Example
          title={trans("componentDoc.disabled")}
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            disabled: true,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CascaderWithDefault}
        />
        <Example
          title={trans("componentDoc.placeholder")}
          config={{
            value: trans("componentDoc.noValue"),
            disabled: false,
            options: options,
            placeholder: trans("componentDoc.pleaseSelect"),
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CascaderWithDefault}
        />
        <Example
          title="Hiding the Cascader component"
          config={{
            value: trans("componentDoc.noValue"),
            hidden: true,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CascaderWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.labelText")} description="">
        <Example
          title={trans("componentDoc.leftLeftAlign")}
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
              position: "row",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CascaderWithDefault}
        />
        <Example
          title={trans("componentDoc.leftRightAlign")}
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
              position: "row",
              align: "right",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CascaderWithDefault}
        />
        <Example
          title={trans("componentDoc.topLeftAlign")}
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
              position: "column",
              align: "left",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CascaderWithDefault}
        />
        <Example
          title={trans("componentDoc.topRightAlign")}
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
              position: "column",
              align: "right",
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CascaderWithDefault}
        />
        <Example
          title="Tooltip"
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
              tooltip: "This is a Tooltip on Cascader component"
            },
          }}
          blackListConfig={blackListConfig}
          compFactory={CascaderWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.advanced")}>
        <Example
          title={trans("componentDoc.allowClear")}
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
            },
            allowClear: true,
          }}
          blackListConfig={blackListConfig}
          compFactory={CascaderWithDefault}
        />
        <Example
          title="Searchable Options - True"
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
            },
            showSearch: true,
          }}
          blackListConfig={blackListConfig}
          compFactory={CascaderWithDefault}
        />
        <Example
          title="Searchable Options - False"
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
            },
            showSearch: false,
          }}
          blackListConfig={blackListConfig}
          compFactory={CascaderWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties on the Cascader Component."
      >
        <Example
          title="Background Color, Border Radius,Style,Width,Color"
          width={500}
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
            },
            style: {
              "background": "#00FFFF",
              "border": "#3377FF",
              "radius": "10px",
              "borderWidth": "3px",
              "borderStyle": "solid",
            },
          }}
          compFactory={CascaderWithDefault}
        />
        <Example
          title="Margin & Padding"
          width={500}
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
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
          compFactory={CascaderWithDefault}
        />
        <Example
          title="Opacity - 0.2"
          width={500}
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
            },
            style: {
              "opacity": "0.2",
            },
          }}
          compFactory={CascaderWithDefault}
        />
        <Example
          title="Opacity - 0.5"
          width={500}
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
            },
            style: {
              "opacity": "0.5",
            },
          }}
          compFactory={CascaderWithDefault}
        />
        <Example
          title="Opacity - 0.7"
          width={500}
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
            },
            style: {
              "opacity": "0.7",
            },
          }}
          compFactory={CascaderWithDefault}
        />
        <Example
          title="Opacity - 1"
          width={500}
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
            },
            style: {
              "opacity": "1",
            },
          }}
          compFactory={CascaderWithDefault}
        />
        <Example
          title="Rotation - 90deg"
          width={500}
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
            },
            style: {
              "rotation": "90deg",
            },
          }}
          compFactory={CascaderWithDefault}
        />
        <Example
          title="Label - Text Color, Size, Weight, Font family, Border properties"
          width={500}
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
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
          compFactory={CascaderWithDefault}
        />
        <Example
          title="Input Field Style"
          width={500}
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
            },
            style: {
              "background": "#00FFFF",
              "border": "#3377FF",
              "radius": "10px",
              "borderWidth": "3px",
              "margin": "10px",
              "padding": "10px",
              "borderStyle": "solid",
            },
            inputFieldStyle: {
              "background": "#00BCA1",
              "border": "#013AFF",
              "radius": "10px",
              "text": "#222222"
            },
          }}
          compFactory={CascaderWithDefault}
        />
        <Example
          title="Children Input Field Styling properties"
          config={{
            value: `["zhejiang","hangzhou","xihu"]`,
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
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
          compFactory={CascaderWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the Cascader Component."
      >
        <Example
          title="Bounce Animation"
          config={{
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
            },
            animationStyle: {
              "animation": "bounce",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={CascaderWithDefault}
        />
        <Example
          title="Swing Animation"
          config={{
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
            },
            animationStyle: {
              "animation": "swing",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={CascaderWithDefault}
        />
        <Example
          title="Tada Animation"
          config={{
            options: options,
            label: {
              text: trans("componentDoc.pleaseSelectCity"),
            },
            animationStyle: {
              "animation": "tada",
              "animationDelay": "1s",
              "animationDuration": "3s",
              "animationIterationCount": "infinite"
            },
          }}
          compFactory={CascaderWithDefault}
        />
      </ExampleGroup>
    </>
  );
}
