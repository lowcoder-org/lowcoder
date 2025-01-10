import { ShapeComp } from "comps/comps/shapeComp/shapeComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function ShapeExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
        >
          <Example
            title="A Simple Shape"
            config={{ 
            }}
            compFactory={ShapeComp}
          />
          <Example
            title="Hiding Shape Component"
            config={{ 
              hidden: true,
              icon:"2_misc",
            }}
            compFactory={ShapeComp}
          />
           <Example
            title="Disabling Shape Component"
            config={{ 
              disabled: true,
              icon:"2_polygon",
            }}
            compFactory={ShapeComp}
          />
        </ExampleGroup>
      </>
    );
  }