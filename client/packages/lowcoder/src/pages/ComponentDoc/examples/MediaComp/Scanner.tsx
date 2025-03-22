import { ScannerComp } from "comps/comps/buttonComp/scannerComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function ScannerExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Scanner Component."

      >
        <Example
          title="A Simple Scanner Component"
          config={{
          }}
          compFactory={ScannerComp}
        />
         <Example
          title="Disabling the Scanner Component"
          config={{
            disabled: true,
          }}
          compFactory={ScannerComp}
        />
         <Example
          title="Hiding the Scanner Component"
          config={{
            hidden: true,
          }}
          compFactory={ScannerComp}
        />
        <Example
          title="Continuous Scanning - ON"
          config={{
            continuous: true,
            uniqueData: true,
          }}
          compFactory={ScannerComp}
        />
        <Example
          title="Continuous Scanning - OFF"
          config={{
            continuous: false,
          }}
          compFactory={ScannerComp}
        />
      </ExampleGroup>

      <ExampleGroup
      title="Styling Properties"
      description="The Following Examples Show the different Styling properties of the Scanner Component."
      >
      <Example
        title="Background Color, Margin & Padding"
        config={{
          style: {
            "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
            "margin" : "15px",
            "padding" : "15px",
          },
        }}
        compFactory={ScannerComp}
      />
      <Example
        title="Border Style, Color, Width & Radius"
        config={{
          style: {
            "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
            "margin": "15px",
            "padding": "15px",
            "border": "#FF0303",
            "borderStyle": "dashed",
            "radius": "10px",
            "borderWidth": "3px"
          },
        }}
        compFactory={ScannerComp}
      />
      <Example
        title="Label - Text Color, Size, Weight, Font family, Border properties"
        config={{
          style: {
            "margin": "5px",
            "padding": "5px",
            "label": "#3377FF",
            "textTransform": "Uppercase",
            "textDecoration": "underline",
            "textWeight": "bold",
            "fontFamily": "Courier New",
            "fontStyle": "Italic"
          },
        }}
        compFactory={ScannerComp}
      />
      </ExampleGroup>
    </>
  );
}
