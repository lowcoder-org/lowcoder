import { TourComp } from "comps/comps/tourComp/tourComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function TourExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
        >
          <Example
            title="Default Audio Component"
            config={{ 
            }}
            compFactory={TourComp}
          />
        </ExampleGroup>
      </>
    );
  }