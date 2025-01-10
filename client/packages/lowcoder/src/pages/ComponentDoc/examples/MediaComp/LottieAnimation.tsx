import { JsonLottieComp } from "comps/comps/jsonComp/jsonLottieComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function JsonLottieAnimationExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
        >
          <Example
            title="An Animated Star Icon"
            config={{ 
            }}
            compFactory={JsonLottieComp}
          />
          <Example
            title="Hiding the Star Icon"
            config={{ 
              hidden: true,
            }}
            compFactory={JsonLottieComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Interaction with Animated Icons"
        >
          <Example
            title="Endless Loop"
            config={{ 
              loop: "endless",
            }}
            compFactory={JsonLottieComp}
          />
          <Example
            title="Single Loop"
            config={{ 
              loop: "single",
            }}
            compFactory={JsonLottieComp}
          />
          <Example
            title="Speed - 0.5X"
            config={{ 
              loop: "endless",
              speed: "0.5",
            }}
            compFactory={JsonLottieComp}
          />
          <Example
            title="Speed - 2X"
            config={{ 
              loop: "endless",
              speed: "2",
            }}
            compFactory={JsonLottieComp}
          />
          <Example
            title="Speed - 5X"
            config={{ 
              loop: "endless",
              speed: "5",
            }}
            compFactory={JsonLottieComp}
          />
          <Example
            title="Animation Start - On Hover"
            config={{ 
              loop: "endless",
              speed: "1.5",
              animationStart: "on Hover",
            }}
            compFactory={JsonLottieComp}
          />
          <Example
            title="Animation Start - Auto"
            config={{ 
              loop: "endless",
              speed: "1.5",
              animationStart: "Auto",
            }}
            compFactory={JsonLottieComp}
          />
        </ExampleGroup>
      </>
    );
  }