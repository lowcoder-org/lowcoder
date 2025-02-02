import { ColorPickerComp } from "comps/comps/mediaComp/colorPickerComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function ColorPickerExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Color Picker Component."
        >
          <Example
            title="Setting Default value"
            config={{ 
                value:"#abc",

            }}
            compFactory={ColorPickerComp}
          />
          <Example
            title="Disabling the Component"
            config={{                
                disabled: true,
            }}
            compFactory={ColorPickerComp}
          />
          <Example
            title="Hiding the Component"
            config={{ 
                hidden: true,
            }}
            compFactory={ColorPickerComp}
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
                    text: "Pick Color",
                    tooltip: "This is a ToolTip on ColorPicker Component, which should get dispalyed when User hovers over it",
                }
            }}
            compFactory={ColorPickerComp}
          />
          <Example
            title="Setting Width of the Label"
            config={{                
                label:{
                    text: "Pick Color",
                    width: "15",
                }  
            }}
            compFactory={ColorPickerComp}
          />
          <Example
            title="Label Position - TOP"
            config={{ 
                label:{
                    position: "column",
                }
            }}
            compFactory={ColorPickerComp}
          />
          <Example
            title="Label Alignment - RIGHT"
            config={{ 
                label:{
                    position: "column",
                    align: "right",
                }
            }}
            compFactory={ColorPickerComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Advanced Usage"
          description="The Following Examples Show the Advanced Usage of the Color Picker Component."
        >
          <Example
            title="Triggers Event - Click"
            config={{ 
                trigger: "click",
            }}
            compFactory={ColorPickerComp}
          />
          <Example
            title="Triggers Event - Hover"
            config={{ 
                trigger: "hover",
            }}
            compFactory={ColorPickerComp}
          />
          <Example
            title="Disabling the Alpha Section"
            config={{                
                disabledAlpha: true,
            }}
            compFactory={ColorPickerComp}
          />
          <Example
            title="Show Color Presets"
            config={{ 
                showPresets: true,
            }}
            compFactory={ColorPickerComp}
          />
        </ExampleGroup>
      </>
    );
  }