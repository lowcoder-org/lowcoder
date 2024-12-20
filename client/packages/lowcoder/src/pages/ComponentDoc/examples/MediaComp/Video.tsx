import { VideoComp } from "comps/comps/mediaComp/videoComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function VideoExample() {
    return (
      <>
        <ExampleGroup
          title="Video Component Usage"
        >
          <Example
            title="Default View"
            config={{ 
                src: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
            }}
            compFactory={VideoComp}
          />
          <Example
            title="Poster URL"
            config={{ 
                src: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
                poster: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
            }}
            compFactory={VideoComp}
          />
          <Example
            title="Volume Control"
            config={{ 
                src: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
                volume: "1",
            }}
            compFactory={VideoComp}
          />
          <Example
            title="Playback Rate"
            config={{ 
                src: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
                playbackRate: "2",
            }}
            compFactory={VideoComp}
          />
          <Example
            title="Auto Play - True"
            config={{ 
                src: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
                autoPlay: true,
            }}
            compFactory={VideoComp}
          />
          <Example
            title="Video on Loop - True"
            config={{ 
                src: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
                loop: true,
            }}
            compFactory={VideoComp}
          />
          <Example
            title="Hide Controls - True"
            config={{ 
                src: "https://www.youtube.com/watch?v=pRpeEdMmmQ0",
                controls: true,
            }}
            compFactory={VideoComp}
          />
        </ExampleGroup>
      </>
    );
  }