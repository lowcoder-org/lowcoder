import { TimerComp } from "comps/comps/timerComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function TimerExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
        >
          <Example
            title="Default Value"
            config={{
                defaultValue: "00:00:03:000",
            }}
            compFactory={TimerComp}
          />
          <Example
            title="Hide Buttons"
            config={{
                defaultValue: "00:00:00:000",
                hideButton: true,
            }}
            compFactory={TimerComp}
          />
        </ExampleGroup>
      </>
    );
  }