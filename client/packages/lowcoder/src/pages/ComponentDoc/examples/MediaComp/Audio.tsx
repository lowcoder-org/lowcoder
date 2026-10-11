import { AudioComp } from "comps/comps/mediaComp/audioComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function AudioExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Audio Component."
        >
          <Example
            title="Default Audio Component"
            config={{ 
                src: "https://cdn.pixabay.com/audio/2023/07/06/audio_e12e5bea9d.mp3",

            }}
            compFactory={AudioComp}
          />
          <Example
            title="Auto Play - True"
            config={{ 
                src: "https://cdn.pixabay.com/audio/2023/07/06/audio_e12e5bea9d.mp3",
                autoPlay: true,

            }}
            compFactory={AudioComp}
          />
          <Example
            title="Audio on Loop - True"
            config={{ 
                src: "https://cdn.pixabay.com/audio/2023/07/06/audio_e12e5bea9d.mp3",
                loop: true,
            }}
            compFactory={AudioComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Styling properties and Animations"
          description="The Following Examples Show the Styling properties & Animations of the Audio Component."
        >
          <Example
            title="Margin & Padding"
            config={{ 
                src: "https://cdn.pixabay.com/audio/2023/07/06/audio_e12e5bea9d.mp3",
                style: {
                  margin: "5px",
                  padding: "10px",
                },
            }}
            compFactory={AudioComp}
          />
          <Example
            title="Rotation - 45 Deg"
            config={{ 
                src: "https://cdn.pixabay.com/audio/2023/07/06/audio_e12e5bea9d.mp3",
                style: {
                  rotation: "45deg",
                },
            }}
            compFactory={AudioComp}
          />
          <Example
            title="Rotation - 135 Deg"
            config={{ 
                src: "https://cdn.pixabay.com/audio/2023/07/06/audio_e12e5bea9d.mp3",
                style: {
                  rotation: "135deg",
                },
            }}
            compFactory={AudioComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Animation Style"
          description="The Following Examples Show different animations on the Audio Component."
        >
          <Example
            title="Bounce Animation"
            config={{
              src: "https://cdn.pixabay.com/audio/2023/07/06/audio_e12e5bea9d.mp3",
              animationStyle: {
                "animation": "bounce",
                "animationDelay": "1s",
                "animationDuration": "3s",
                "animationIterationCount": "infinite"
              },
            }}
            compFactory={AudioComp}
          />
          <Example
            title="Swing Animation"
            config={{
              src: "https://cdn.pixabay.com/audio/2023/07/06/audio_e12e5bea9d.mp3",
              animationStyle: {
                "animation": "swing",
                "animationDelay": "1s",
                "animationDuration": "3s",
                "animationIterationCount": "infinite"
              },
            }}
            compFactory={AudioComp}
          />
          <Example
            title="Tada Animation"
            config={{
              src: "https://cdn.pixabay.com/audio/2023/07/06/audio_e12e5bea9d.mp3",
              animationStyle: {
                "animation": "tada",
                "animationDelay": "1s",
                "animationDuration": "3s",
                "animationIterationCount": "infinite"
              },
            }}
            compFactory={AudioComp}
          />
        </ExampleGroup>
      </>
    );
  }