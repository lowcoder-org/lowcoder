import { AvatarComp } from "comps/comps/avatar";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";
import { trans } from "i18n/design";

export default function AvatarExample(){
    const nameMap: Record<string, string> = {
        title: "title",
        align: "align",
        color: "color",
        dashed: "dashed",
      };
      return (
        <>
          <ExampleGroup
            title={"Basic Usage"}
          >
          <Example 
            title="Circle Shaped Icon Avatar" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                icon: "/icon:solid/user-secret",
                shape:"circle",
            }} 
            compFactory={AvatarComp} 
          />
          <Example 
            title="Square Shaped Avatar with Title" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                icon: "/icon:solid/user-secret",
                shape:"square",
            }} 
            compFactory={AvatarComp} 
          />
          <Example 
            title="Hiding the Avatar component" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                icon: "/icon:solid/user-secret",
                hidden: true,
            }} 
            compFactory={AvatarComp} 
          />
          <Example 
            title="Avatar with Image" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                src: "https://i.pravatar.cc/300?u=a029026704a",
            }} 
            compFactory={AvatarComp} 
          />
          <Example 
            title="Avatar with Title" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                title: "John",
            }} 
            compFactory={AvatarComp} 
          />
          <Example 
            title="Large size Avatar" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                src: "https://i.pravatar.cc/300?u=a029026704a",
                iconSize: "60",
            }} 
            compFactory={AvatarComp} 
          />
          <Example 
            title="Avatar with Dropdown" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                icon: "/icon:solid/user-secret",
                shape:"circle",
                enableDropdownMenu: true,
                options: {
                    optionType: "manual", 
                    manual: {
                        manual: [
                            {label: "Option 1"}, 
                            {label: "Option 2"}
                        ]
                    }
                }
            }} 
            compFactory={AvatarComp} 
          />
          </ExampleGroup>

          <ExampleGroup
            title={"Label Position & Alignment"}
          >
          <Example 
            title="Avatar with Left Position" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                icon: "/icon:solid/user-secret",
                shape:"circle",
                labelPosition: "left",
            }} 
            compFactory={AvatarComp} 
          />
          <Example 
            title="Avatar with Righ Position" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                icon: "/icon:solid/user-secret",
                shape:"circle",
                labelPosition: "right",
            }} 
            compFactory={AvatarComp} 
          />
          <Example 
            title="Left Alignment" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                icon: "/icon:solid/user-secret",
                shape:"circle",
                alignmentPosition: "left",
            }} 
            compFactory={AvatarComp} 
          />
          <Example 
            title="Right Alignment" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                icon: "/icon:solid/user-secret",
                shape:"circle",
                alignmentPosition: "right",
            }} 
            compFactory={AvatarComp} 
          />
          </ExampleGroup>

          <ExampleGroup
            title={"Advanced Usage"}
          >
          <Example 
            title="Badge type : Dot" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                icon: "/icon:solid/user-secret",
                shape:"circle",
                badgeType: "dot",
                badgeCount:"3",
            }} 
            compFactory={AvatarComp} 
          />
          <Example 
            title="Badge type : Number" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                icon: "/icon:solid/user-secret",
                shape:"circle",
                badgeType: "number",
                badgeCount:"3",
                overflowCount: "10",
            }} 
            compFactory={AvatarComp} 
          />
          <Example 
            title="Badge with Overflow Count" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                icon: "/icon:solid/user-secret",
                shape:"circle",
                badgeType: "number",
                badgeCount:"110",
                overflowCount: "99",
            }} 
            compFactory={AvatarComp} 
          />
          </ExampleGroup>

          <ExampleGroup
            title={"Styling Properties"}
          >
          <Example 
            title="Different Styling properties on the Avatar component" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                src: "https://i.pravatar.cc/300?u=a029026704a",
                iconSize: "60",
                style: {
                  "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                  "margin": "5px",
                  "padding": "10px",
                  "border": "#3377FF",
                  "borderStyle": "solid",
                  "radius": "10px",
                  "borderWidth": "2px"
              },
            }} 
            compFactory={AvatarComp} 
          />
          <Example 
            title="Opacity - 0.25" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                src: "https://i.pravatar.cc/300?u=a029026704a",
                iconSize: "60",
                style: {
                  "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                  "margin": "5px",
                  "padding": "10px",
                  "border": "#3377FF",
                  "borderStyle": "solid",
                  "radius": "10px",
                  "borderWidth": "2px",
                  "opacity": "0.25",
              },
            }} 
            compFactory={AvatarComp} 
          />
          <Example 
            title="Opacity - 0.5" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                src: "https://i.pravatar.cc/300?u=a029026704a",
                iconSize: "60",
                style: {
                  "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                  "margin": "5px",
                  "padding": "10px",
                  "border": "#3377FF",
                  "borderStyle": "solid",
                  "radius": "10px",
                  "borderWidth": "2px",
                  "opacity": "0.5",
              },
            }} 
            compFactory={AvatarComp} 
          />
          <Example 
            title="Opacity - 0.8" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                src: "https://i.pravatar.cc/300?u=a029026704a",
                iconSize: "60",
                style: {
                  "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                  "margin": "5px",
                  "padding": "10px",
                  "border": "#3377FF",
                  "borderStyle": "solid",
                  "radius": "10px",
                  "borderWidth": "2px",
                  "opacity": "0.8",
              },
            }} 
            compFactory={AvatarComp} 
          />
          <Example 
            title="Avatar Styling" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                iconSize: "60",
                avatarStyle: {
                  "background": "#FA0101",
                  "fill": "#36B389"
                },
            }} 
            compFactory={AvatarComp} 
          />
          <Example 
            title="Label Styling" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                iconSize: "40",
                labelStyle: {
                  "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                  "margin": "0px",
                  "padding": "0px",
                  "text": "#FF0505",
                  "textTransform": "Uppercase",
                  "textDecoration": "line-through",
                  "textSize": "15px",
                  "fontStyle": "italic",
                  "border": "#3377FF",
                  "borderStyle": "solid",
                  "radius": "10px",
                  "borderWidth": "2px",
                },
            }} 
            compFactory={AvatarComp} 
          />
          <Example 
            title="Caption Styling" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                iconSize: "60",
                captionStyle: {
                  "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                  "margin": "0px",
                  "padding": "0px",
                  "text": "#FF0505",
                  "textTransform": "lowercase",
                  "textDecoration": "underline",
                  "textSize": "15px",
                  "fontStyle": "italic",
                  "border": "#3377FF",
                  "borderStyle": "solid",
                  "radius": "10px",
                  "borderWidth": "2px",
                },
            }} 
            compFactory={AvatarComp} 
          />
          <Example 
            title="Complete Styling of the Avatar component" 
            hideSettings={true}
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                src: "https://i.pravatar.cc/300?u=a029026704a",
                iconSize: "60",
                style: {
                  "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                  "margin": "5px",
                  "padding": "10px",
                  "border": "#3377FF",
                  "borderStyle": "solid",
                  "radius": "10px",
                  "borderWidth": "2px"
               },
                avatarStyle: {
                  "background": "#FA0101",
                  "fill": "#36B389"
                },
                labelStyle: {
                  "background": "linear-gradient(90deg, #fa709a 0%, #fee140 100%)",
                  "margin": "0px",
                  "padding": "0px",
                  "text": "#FFF",
                  "textTransform": "Uppercase",
                  "textDecoration": "line-through",
                  "textSize": "15px",
                  "fontStyle": "italic",
                  "border": "#3377FF",
                  "borderStyle": "solid",
                  "radius": "10px",
                  "borderWidth": "2px",
                },
                captionStyle: {
                  "background": "linear-gradient(0deg, #f43b47 0%, #453a94 100%)",
                  "margin": "0px",
                  "padding": "0px",
                  "text": "#FFF",
                  "textTransform": "lowercase",
                  "textDecoration": "underline",
                  "textSize": "15px",
                  "fontStyle": "italic",
                  "border": "#3377FF",
                  "borderStyle": "solid",
                  "radius": "10px",
                  "borderWidth": "2px",
                },
            }} 
            compFactory={AvatarComp} 
          />
          </ExampleGroup>
        </>
      );
}