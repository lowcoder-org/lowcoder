import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["bpmnEditor"].comp;

export default function BPMNEditorExample() {
  return (
    <>
      <ExampleGroup
        title="Basic Usage"
        description="The Following Examples Show the Basic Usage of the BPMN Editor Component."
      >
        <Example
          title="Default Component"
          height={400}
          width={1000}
          hideSettings={true}
          config={{
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Designer Mode"
          height={400}
          width={1000}
          hideSettings={true}
          config={{
            designer: true,
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Hiding the Logo"
          height={400}
          width={1000}
          hideSettings={true}
          config={{
            showLogo: false,
            designer: true,
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Allowing to Download the Image"
          height={400}
          width={1000}
          hideSettings={true}
          config={{
            designer: true,
            svgDownload: true,
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Naming Downloaded File - Click on Download link"
          height={400}
          width={1000}
          hideSettings={true}
          config={{
            designer: true,
            svgDownload: true,
            imageName: "Lowcoder_Image",
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the Styling properties of the BPMN Editor Component."
      >
        <Example
          title="Body - Background Color, Border, Text Size and Margins"
          height={400}
          width={1000}
          hideSettings={true}
          config={{
            designer: true,
            styles: {
              "margin": "10px",
              "textSize": "30px",
              "backgroundColor": "#D7D9E0",
              "border": "#222222",
              "radius": "20px",
              "borderWidth": "3px",
            },
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>
    </>
  );
}