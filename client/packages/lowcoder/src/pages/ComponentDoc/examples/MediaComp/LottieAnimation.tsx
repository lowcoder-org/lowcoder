import { JsonLottieComp } from "comps/comps/jsonComp/jsonLottieComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function JsonLottieAnimationExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Lottie Animation Component."
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
          title="Interaction with Lottie Animations"
          description="The Following Examples Show other properties of the Lottie Animation Component."
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

        <ExampleGroup
          title="Styling Properties"
          description="The Following Examples Show the different Styling properties of the Lottie Animation Component."
        >
          <Example
            title="Background Color"
            config={{
              container: {
                "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
              },
            }}
            compFactory={JsonLottieComp}
          />
          <Example
            title="Margin & Padding"
            config={{
              container: {
                "margin": "15px",
                "padding": "15px",
              },
            }}
            compFactory={JsonLottieComp}
          />
          <Example
            title="Rotation - 45 Deg"
            config={{
              container: {
                "rotation": "45deg"
              },
            }}
            compFactory={JsonLottieComp}
          />
          <Example
            title="Rotation - 90 Deg"
            config={{
              container: {
                "rotation": "90deg"
              },
            }}
            compFactory={JsonLottieComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Animation Style"
          description="The Following Examples Show the different Animations of the Lottie Animation Component."
        >
          <Example
            title="Bounce Animation"
            config={{
              animationStyle: {
                "animation": "bounce",
                "animationDelay": "1s",
                "animationDuration": "3s",
                "animationIterationCount": "infinite"
              },
            }}
            compFactory={JsonLottieComp}
          />
          <Example
            title="Swing Animation"
            config={{
              animationStyle: {
                "animation": "swing",
                "animationDelay": "1s",
                "animationDuration": "3s",
                "animationIterationCount": "infinite"
              },
            }}
            compFactory={JsonLottieComp}
          />
          <Example
            title="Tada Animation"
            config={{
              animationStyle: {
                "animation": "tada",
                "animationDelay": "1s",
                "animationDuration": "3s",
                "animationIterationCount": "infinite"
              },
            }}
            compFactory={JsonLottieComp}
          />
        </ExampleGroup>
      </>
    );
  }