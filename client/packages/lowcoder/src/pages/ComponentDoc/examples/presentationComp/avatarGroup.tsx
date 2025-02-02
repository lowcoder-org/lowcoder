import { AvatarGroupComp } from "comps/comps/avatarGroup";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";
import { trans } from "i18n/design";

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
            title="Avatar Size"
            config={{
                avatarSize: "60",
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
            title={"Avatar Group Styling"}
          >
            <Example
                title=""
                config={{
                    autoColor: false,
                    avatar: {
                        fill: "#fff",
                        background: "#F401AE",
                    }
                }} 
            compFactory={AvatarGroupComp} 
          />
          </ExampleGroup>
        </>
      );
}