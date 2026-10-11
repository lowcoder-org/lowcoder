import { uiCompRegistry } from "comps/uiCompRegistry";
import { trans } from "i18n";
import { chartColorPalette } from "lowcoder-design";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const ChartCompWithDefault = uiCompRegistry["imageEditor"].comp;

export default function ImageEditorExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Image Editor Component."
      >
        <Example
          title={trans("componentDoc.default")}
          height={500}
          width={500}
          config={{
            src: "https://photographylife.com/wp-content/uploads/2023/05/Nikon-Z8-Official-Samples-00002.jpg",
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Hiding the Image Editor component"
          height={500}
          width={500}
          config={{
            src: "https://photographylife.com/wp-content/uploads/2023/05/Nikon-Z8-Official-Samples-00002.jpg",
            hidden: true,
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Advanced Options"
        description="The Following Examples Show the Advance Usage of the Image Editor Component."
      >
        <Example
          title="Hiding Crop, Flip and Rotate options from Toolbar"
          height={500}
          width={500}
          config={{
            src: "https://photographylife.com/wp-content/uploads/2023/05/Nikon-Z8-Official-Samples-00002.jpg",
            crop: false,
            flip: false,
            rotate: false,
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Hiding Text, Mask and Filter options from Toolbar"
          height={500}
          width={500}
          config={{
            src: "https://photographylife.com/wp-content/uploads/2023/05/Nikon-Z8-Official-Samples-00002.jpg",
            text: false,
            mask: false,
            filter: false,
          }}
          compFactory={ChartCompWithDefault}
        />
        <Example
          title="Hiding Draw, Shape, Icon options from Toolbar"
          height={500}
          width={500}
          config={{
            src: "https://photographylife.com/wp-content/uploads/2023/05/Nikon-Z8-Official-Samples-00002.jpg",
            draw: false,
            icon: false,
            shape: false,
          }}
          compFactory={ChartCompWithDefault}
        />
      </ExampleGroup>
    </>
  );
}