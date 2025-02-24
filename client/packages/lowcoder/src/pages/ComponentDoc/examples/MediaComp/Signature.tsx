import { SignatureComp } from "comps/comps/signatureComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function SignatureExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Signature Component."
        >
            <Example
            title="Showing Hints/Placeholder Text"
            config={{ 
                tips: "This is a Signature Component. Please, Sign here",
            }}
            compFactory={SignatureComp}
          />
          <Example
            title="Hiding the Signature Component"
            config={{ 
                hidden: true,
            }}
            compFactory={SignatureComp}
          />
          <Example
            title="Show/Hide the Undo Icon"
            config={{ 
                showUndo: false,
            }}
            compFactory={SignatureComp}
          />
          <Example
            title="Show/Hide the Clear Icon"
            config={{ 
                showClear: false,
            }}
            compFactory={SignatureComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Label Positioning & Alignment"
          description="The Following Examples Show the Label Positioning & Alignment of the Color Picker Component."
        >
          <Example
            title="Setting Label Text and ToolTip"
            config={{ 
                label:{
                    text: "Sign Here",
                    tooltip: "This is a ToolTip on Signature Component, which should get dispalyed when User hovers over it",
                }
            }}
            compFactory={SignatureComp}
          />
          <Example
            title="Setting Width of the Label"
            config={{                
                label:{
                    text: "Sign Here",
                    width: "15",
                }  
            }}
            compFactory={SignatureComp}
          />
          <Example
            title="Label Position - TOP"
            config={{ 
                label:{
                    text: "Sign Here",
                    position: "column",
                }
            }}
            compFactory={SignatureComp}
          />
          <Example
            title="Label Alignment - RIGHT"
            config={{ 
                label:{
                    text: "Sign Here",
                    position: "column",
                    align: "right",
                }
            }}
            compFactory={SignatureComp}
          />
        </ExampleGroup>
      </>
    );
  }