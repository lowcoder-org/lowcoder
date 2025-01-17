import { transferComp } from "comps/comps/transferComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function TransferExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
        >
          <Example
            title="Default Audio Component"
            config={{ 
            }}
            compFactory={transferComp}
          />
        </ExampleGroup>
      </>
    );
  }