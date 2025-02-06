import { FileComp } from "comps/comps/fileComp/fileComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function FileExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the File Component."
      >
        <Example
          title="Default File Upload component"
          config={{
          }}
          compFactory={FileComp}
        />
        <Example
          title="Disabling the File Upload component"
          config={{
            disabled: true,
          }}
          compFactory={FileComp}
        />
        <Example
          title="Hiding the File Upload component"
          config={{
            hidden: true,
          }}
          compFactory={FileComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.option")}>
        <Example
          title={trans("componentDoc.singleFileUpload")}
          config={{
            filetype: '[".png", ".pdf", ".word"]',
            uploadType: "single",
          }}
          compFactory={FileComp}
        />
        <Example
          title={trans("componentDoc.multiFileUpload")}
          config={{
            filetype: '[".png", ".pdf", ".word"]',
            uploadType: "multiple",
          }}
          compFactory={FileComp}
        />
        <Example
          title={trans("componentDoc.folderUpload")}
          config={{
            filetype: '[".png", ".pdf", ".word"]',
            uploadType: "directory",
          }}
          compFactory={FileComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.validation")} description="">
        <Example
          title="File Size"
          width={340}
          config={{
            minSize: "100KB",
            maxSize: "100MB",
          }}
          compFactory={FileComp}
        />
        <Example
          title="Maximum File number - 5"
          width={340}
          config={{
            maxFiles: "5",
            minSize: "200KB",
            maxSize: "100MB",
          }}
          compFactory={FileComp}
        />
        <Example
          title="Maximum File number - 10"
          width={340}
          config={{
            maxFiles: "10",
            minSize: "10KB",
            maxSize: "100MB",
          }}
          compFactory={FileComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Advanced Options"
        description="The Following Examples Show the Advance Usage of the File Component."
      >
        <Example
          title="File Upload Type - .png"
          config={{
            fileType: "[\".png\"]",
          }}
          compFactory={FileComp}
        />
        <Example
          title="Multiple File Upload Type - .png"
          config={{
            fileType: "[\".png\",\".pdf\",\".word\"]",
          }}
          compFactory={FileComp}
        />
        <Example
          title="Prefix and Postfix Icons"
          config={{
            prefixIcon: "/icon:solid/angles-up",
            suffixIcon: "/icon:solid/angles-down",
          }}
          compFactory={FileComp}
        />
        <Example
          title="Force Capture - Take a picture and Upload"
          config={{
            forceCapture: true,
            text: "Capture & Upload",
          }}
          compFactory={FileComp}
        />
        <Example
          title="Hide Upload List - Uploaded File won't be shown"
          config={{
            showUploadList: false,
          }}
          compFactory={FileComp}
        />
        <Example
          title="Show Upload List - Uploaded File will be shown"
          config={{
          }}
          compFactory={FileComp}
        />
      </ExampleGroup>
    </>
  );
}
