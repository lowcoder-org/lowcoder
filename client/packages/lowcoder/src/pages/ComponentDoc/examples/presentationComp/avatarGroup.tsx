import { AvatarGroupComp } from "comps/comps/avatarGroup";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";
import { trans } from "i18n/design";

const avatars = {
  "optionType": "manual",
  "manual": {
      "manual": [
          {
              "src": "https:\\/\\/reqres.in\\/img\\/faces\\/3-image.jpg",
              "label": "Ellis",
              "Tooltip": "Ellis"
          },
          {
              "src": "https:\\/\\/reqres.in\\/img\\/faces\\/5-image.jpg",
              "AvatarIcon": "/icon:antd/startwotone",
              "label": "Javas",
              "Tooltip": "Javas"
          },
          {
              "src": "https:\\/\\/i.pravatar.cc\\/300?u=a029026704a",
              "label": "Kirk",
              "Tooltip": "Kirk"
          },
          {
              "src": "https:\\/\\/i.pravatar.cc\\/300?u=a042581f4e4a",
              "label": "Gray",
              "Tooltip": "Gray"
          }
      ]
  },
};

export default function AvatarGroupExample(){
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
            title="Maximum Count on AvatarGoup" 
            config={{
                maxCount: "2",
            }} 
            compFactory={AvatarGroupComp} 
          />
          <Example
            title=""
            config={{
                maxCount: "3",
            }} 
            compFactory={AvatarGroupComp} 
          />
          <Example
            title="Avatar Group component with custom images"
            config={{
                avatarSize: "60",
                avatars: avatars,
            }} 
            compFactory={AvatarGroupComp} 
          />
          <Example
            title="Avatar Size"
            config={{
                avatarSize: "60",
            }} 
            compFactory={AvatarGroupComp} 
          />
          <Example
            title="Hiding Avatar Group component"
            config={{
                hidden: true,
            }} 
            compFactory={AvatarGroupComp} 
          />
          </ExampleGroup>

          <ExampleGroup
            title={"Avatar Group Alignment"}
          >
            <Example
            title="Left"
            config={{
                alignment: "left",
            }} 
            compFactory={AvatarGroupComp} 
          />
          <Example
            title="Right"
            config={{
                alignment: "right",
            }} 
            compFactory={AvatarGroupComp} 
          />
          <Example
            title="Center"
            config={{
                alignment: "center",
            }} 
            compFactory={AvatarGroupComp} 
          />
          </ExampleGroup>

          <ExampleGroup
            title={"Styling properties on Avatar Group component"}
          >
            <Example
                title="Avatar Style"
                config={{
                    autoColor: false,
                    avatar: {
                        fill: "#fff",
                        background: "#F401AE",
                    }
                }} 
            compFactory={AvatarGroupComp} 
          />
          <Example
              title="Avatar Group component styling"
              config={{
                style: {
                  "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                  "margin": "5px",
                  "padding": "10px",
                  "border": "#3377FF",
                  "borderStyle": "dashed",
                  "radius": "10px",
                  "borderWidth": "2px"
                },
              }} 
            compFactory={AvatarGroupComp} 
          />
          </ExampleGroup>
        </>
      );
}