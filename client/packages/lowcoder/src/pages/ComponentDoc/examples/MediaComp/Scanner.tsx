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
    </>
  );
}
