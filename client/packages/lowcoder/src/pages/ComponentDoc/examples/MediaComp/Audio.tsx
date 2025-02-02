import { AudioComp } from "comps/comps/mediaComp/audioComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function AudioExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
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
      </>
    );
  }