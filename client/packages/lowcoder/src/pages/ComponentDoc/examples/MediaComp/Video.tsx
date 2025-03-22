import { VideoComp } from "comps/comps/mediaComp/videoComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function VideoExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Video Component."
        >
          <Example
            title="Default View"
            width={500}
            height={400}
            config={{ 
                src: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
            }}
            compFactory={VideoComp}
          />
          <Example
            title="Hiding the Video component"
            width={500}
            height={400}
            config={{ 
                src: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
                hidden: true,
            }}
            compFactory={VideoComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Advance Usage"
          description="The Following Examples Show the Advance Usage of the Video Component."
        >
          <Example
            title="Poster URL "
            width={500}
            height={400}
            config={{ 
                src: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
                poster: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
            }}
            compFactory={VideoComp}
          />
          <Example
            title="Volume Control - 0"
            width={500}
            height={400}
            config={{ 
                src: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
                volume: "0",
            }}
            compFactory={VideoComp}
          />
          <Example
            title="Volume Control - 1"
            width={500}
            height={400}
            config={{ 
                src: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
                volume: "1",
            }}
            compFactory={VideoComp}
          />
          <Example
            title="Playback Rate - 1"
            width={500}
            height={400}
            config={{ 
                src: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
                playbackRate: "0.5",
            }}
            compFactory={VideoComp}
          />
          <Example
            title="Playback Rate - 2X"
            width={500}
            height={400}
            config={{ 
                src: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
                playbackRate: "2",
            }}
            compFactory={VideoComp}
          />
          <Example
            title="Auto Play - True"
            width={500}
            height={400}
            config={{ 
                src: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
                autoPlay: true,
            }}
            compFactory={VideoComp}
          />
          <Example
            title="Auto Play - False"
            width={500}
            height={400}
            config={{ 
                src: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
                autoPlay: false,
            }}
            compFactory={VideoComp}
          />
          <Example
            title="Video on Loop - True"
            width={500}
            height={400}
            config={{ 
                src: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
                loop: true,
            }}
            compFactory={VideoComp}
          />
          <Example
            title="Hide Controls - True"
            width={500}
            height={400}
            config={{ 
                src: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
                controls: true,
            }}
            compFactory={VideoComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Styling Properties"
          description="The Following Examples Show the Styling properties of the Video Component."
        >
          <Example
            title="Margin & Padding"
            width={500}
            height={400}
            config={{ 
                src: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
                style: {
                  margin: "5px",
                  padding: "10px",
                },
            }}
            compFactory={VideoComp}
          />
        </ExampleGroup>
      </>
    );
  }