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
            title="Avatar with Image" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                icon: "/icon:solid/user-secret",
                shape:"square",
            }} 
            compFactory={AvatarComp} 
          />
          <Example 
            title="Large size Avatar" 
            config={{
                avatarCatption: "user@email.com",
                avatarLabel: "User",
                icon: "/icon:solid/user",
                shape:"cirlce",
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
        </>
      );
}