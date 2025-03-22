import { RichTextEditorComp } from "comps/comps/richTextEditorComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function InputExample() {
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the Rich Text Editor Component."
      >
        <Example 
         title={trans("componentDoc.placeholder")}
         width={500}
         height={400}
         config={{
           placeholder: "Let us know about yourself!",
         }}
         compFactory={RichTextEditorComp} 
       />
       <Example
         title="Default Value"
         width={500}
         height={400}
         config={{
          placeholder: "Let us know about yourself!",
          value: "I am an Experienced FullStack Web Developer ...",
         }}
         compFactory={RichTextEditorComp} 
       />
      </ExampleGroup>

      <ExampleGroup 
      title="Layout Options" 
      description="The Following Examples Show the different Layout options of the Rich Text Edito Component.">
        <Example
          title={trans("componentDoc.fixed")}
          width={500}
          config={{
            placeholder: "Let us know about yourself!",
            autoHeight: "fixed",
            contentScrollBar: true,
          }}
          compFactory={RichTextEditorComp}
        />
        <Example
          title={trans("componentDoc.auto")}
          width={500}
          config={{
            placeholder: "Let us know about yourself!",
            autoHeight: "auto",
            hideToolbar: false,
          }}
          compFactory={RichTextEditorComp}
        />
        <Example
          title= "Hide Toolbar"
          width={500}
          height={400}
          config={{
            placeholder: "Let us know about yourself!",
            hideToolbar: true,
          }}
          compFactory={RichTextEditorComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling properties of the Rich Text Editor Component."
      >
        <Example 
         title="Different Styling Properties"
         width={500}
         height={400}
         config={{
           placeholder: "Let us know about yourself!",
           style: {
            "border": "#013AFF",
            "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
            "radius": "10px",
            "borderWidth": "2px"
          },
         }}
         compFactory={RichTextEditorComp} 
       />
      </ExampleGroup>
    </>
  );
}
