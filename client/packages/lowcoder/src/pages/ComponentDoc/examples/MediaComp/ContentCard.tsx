import { CardComp } from "comps/comps/containerComp/cardComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

export default function ContentCardExample() {
    return (
      <>
        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Card Component."
        >
          <Example
            title="Hiding the Card Component"
            config={{ 
                hidden: true,
            }}
            compFactory={CardComp}
          />
          <Example
            title="Hiding the Title"
            config={{ 
                showTitle: false,
            }}
            compFactory={CardComp}
          />
          <Example
            title="Hiding the Content Title & Description"
            config={{ 
                showMeta: false,
            }}
            compFactory={CardComp}
          />
          <Example
            title="Hiding the Action Items"
            config={{ 
                showActionIcon: false,
            }}
            compFactory={CardComp}
          />
          <Example
            title="Custom text on Title and Description"
            config={{ 
                title: "Jennifer Holmes",
                metaTitle: "Head Cook",
                metaDesc: "Responsible for the daily preparation of food for participants, including the cooking of meals, and maintaining high standards of food quality, food production and portion control using the standardized menu. ",
            }}
            compFactory={CardComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Styling Properties"
          description="The Following Examples Show the different Styling properties of the Card Component."
        >
          <Example
            title="Backround Color, Icon Color, Padding and Border properties"
            config={{
              title: "Jennifer Holmes",
              metaTitle: "Head Cook",
              metaDesc: "Responsible for the daily preparation of food for participants, including the cooking of meals, and maintaining high standards of food quality, food production and portion control using the standardized menu. ",
              style: {
                "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                "IconColor": "#FF0101",
                "activateColor": "#5589F2",
                "containerBodyPadding": "20px",
                "padding": "10px",
                "border": "#023BFF",
                "borderStyle": "dashed",
                "radius": "20px",
                "borderWidth": "3px",
              },
            }}
            compFactory={CardComp}
          />
          <Example
            title="Box Shadow & Rotation"
            config={{
              title: "Jennifer Holmes",
              metaTitle: "Head Cook",
              metaDesc: "Responsible for the daily preparation of food for participants, including the cooking of meals, and maintaining high standards of food quality, food production and portion control using the standardized menu. ",           
              style: {
                "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                "IconColor": "#FF0101",
                "activateColor": "#5589F2",
                "containerBodyPadding": "20px",
                "padding": "10px",
                "border": "#023BFF",
                "borderStyle": "dashed",
                "radius": "20px",
                "borderWidth": "3px",
                "boxShadow": "16px 16px 16px",
                "boxShadowColor": "#181717",
                "rotation": "45deg"
              },
            }}
            compFactory={CardComp}
          />
          <Example
            title="Header Styling"
            width={500}
            config={{
              title: "Jennifer Holmes",
              metaTitle: "Head Cook",
              metaDesc: "Responsible for the daily preparation of food for participants, including the cooking of meals, and maintaining high standards of food quality, food production and portion control using the standardized menu. ",
              style: {
                "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                "IconColor": "#FF0101",
                "activateColor": "#5589F2",
                "containerBodyPadding": "20px",
                "padding": "10px",
                "border": "#023BFF",
                "borderStyle": "dashed",
                "radius": "20px",
                "borderWidth": "3px",
                "boxShadow": "16px 16px 16px",
                "boxShadowColor": "#181717",
              },
              headerStyle: {
                "background": "linear-gradient(90deg, #fa709a 0%, #fee140 100%)",
                "margin": "10px",
                "padding": "20px",
                "text": "#4A5EC4",
                "textTransform": "Uppercase",
                "textDecoration": "underline",
                "textSize": "20px",
                "textWeight": "bold",
                "fontFamily": "Courier New",
                "fontStyle": "Italic",
                "border": "#FA0101",
                "radius": "20px",
                "borderWidth": "3px",
                "rotation": "-2deg",
             },
            }}
            compFactory={CardComp}
          />
          <Example
            title="Body Styling"
            width={500}
            config={{
              title: "Jennifer Holmes",
              metaTitle: "Head Cook",
              metaDesc: "Responsible for the daily preparation of food for participants, including the cooking of meals, and maintaining high standards of food quality, food production and portion control using the standardized menu. ",
              style: {
                "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                "IconColor": "#FF0101",
                "activateColor": "#5589F2",
                "containerBodyPadding": "20px",
                "padding": "10px",
                "border": "#023BFF",
                "borderStyle": "dashed",
                "radius": "20px",
                "borderWidth": "3px",
                "boxShadow": "16px 16px 16px",
                "boxShadowColor": "#181717",
              },
              headerStyle: {
                "background": "linear-gradient(90deg, #fa709a 0%, #fee140 100%)",
                "margin": "10px",
                "padding": "20px",
                "text": "#4A5EC4",
                "textTransform": "Uppercase",
                "textDecoration": "underline",
                "textSize": "20px",
                "textWeight": "bold",
                "fontFamily": "Courier New",
                "fontStyle": "Italic",
                "border": "#FA0101",
                "radius": "20px",
                "borderWidth": "3px",
                "rotation": "-2deg",
             },
             bodyStyle: {
                "background": "#FFD90D",
                "margin": "5px",
                "padding": "20px",
                "text": "#027B0E",
                "textTransform": "lowercase",
                "textSize": "16px",
                "textWeight": "bold",
                "fontFamily": "Verdana",
                "fontStyle": "Italic",
                "border": "#F76F01",
                "borderStyle": "dashed",
                "radius": "20px",
                "borderWidth": "3px",
                "rotation": "3deg"
              },
            }}
            compFactory={CardComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Animation Style"
          description="The Following Examples Show different Animation Styles on the Content Card Component."
          >
          <Example
            title="Bounce Animation"
            hideSettings={true}
            config={{
                animationStyle: 
                {
                    "animation": "bounce",
                    "animationDelay": "1s",
                    "animationDuration": "3s",
                    "animationIterationCount": "infinite",
                },
                title: "Jennifer Holmes",
                metaTitle: "Head Cook",
                metaDesc: "Responsible for the daily preparation of food for participants, including the cooking of meals, and maintaining high standards of food quality, food production and portion control using the standardized menu. ",
                style: {
                  "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                  "IconColor": "#FF0101",
                  "activateColor": "#5589F2",
                  "containerBodyPadding": "20px",
                  "padding": "10px",
                  "border": "#023BFF",
                  "borderStyle": "dashed",
                  "radius": "20px",
                  "borderWidth": "3px",
                  "boxShadow": "16px 16px 16px",
                  "boxShadowColor": "#181717",
                },
                headerStyle: {
                  "background": "linear-gradient(90deg, #fa709a 0%, #fee140 100%)",
                  "margin": "10px",
                  "padding": "20px",
                  "text": "#4A5EC4",
                  "textTransform": "Uppercase",
                  "textDecoration": "underline",
                  "textSize": "20px",
                  "textWeight": "bold",
                  "fontFamily": "Courier New",
                  "fontStyle": "Italic",
                  "border": "#FA0101",
                  "radius": "20px",
                  "borderWidth": "3px",
                },
                bodyStyle: {
                  "background": "#FFD90D",
                  "margin": "5px",
                  "padding": "20px",
                  "text": "#027B0E",
                  "textTransform": "lowercase",
                  "textSize": "12px",
                  "textWeight": "bold",
                  "fontFamily": "Verdana",
                  "fontStyle": "Italic",
                  "border": "#F76F01",
                  "borderStyle": "solid",
                  "radius": "20px",
                  "borderWidth": "3px",
                },
            }}
            compFactory={CardComp}
          />
          <Example
            title="Swing Animation"
            hideSettings={true}
            config={{
              title: "Jennifer Holmes",
              metaTitle: "Head Cook",
              metaDesc: "Responsible for the daily preparation of food for participants, including the cooking of meals, and maintaining high standards of food quality, food production and portion control using the standardized menu. ",
              style: {
                "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                "IconColor": "#FF0101",
                "activateColor": "#5589F2",
                "containerBodyPadding": "20px",
                "padding": "10px",
                "border": "#023BFF",
                "borderStyle": "dashed",
                "radius": "20px",
                "borderWidth": "3px",
                "boxShadow": "16px 16px 16px",
                "boxShadowColor": "#181717",
              },
              headerStyle: {
                "background": "linear-gradient(90deg, #fa709a 0%, #fee140 100%)",
                "margin": "10px",
                "padding": "20px",
                "text": "#4A5EC4",
                "textTransform": "Uppercase",
                "textDecoration": "underline",
                "textSize": "20px",
                "textWeight": "bold",
                "fontFamily": "Courier New",
                "fontStyle": "Italic",
                "border": "#FA0101",
                "radius": "20px",
                "borderWidth": "3px",
              },
              bodyStyle: {
                "background": "#FFD90D",
                "margin": "5px",
                "padding": "20px",
                "text": "#027B0E",
                "textTransform": "lowercase",
                "textSize": "12px",
                "textWeight": "bold",
                "fontFamily": "Verdana",
                "fontStyle": "Italic",
                "border": "#F76F01",
                "borderStyle": "solid",
                "radius": "20px",
                "borderWidth": "3px",
              },
              animationStyle: {
                "animation": "swing",
                "animationDelay": "1s",
                "animationDuration": "3s",
                "animationIterationCount": "infinite"
              },
            }}
            compFactory={CardComp}
          />
          <Example
            title="Tada Animation"
            hideSettings={true}
            config={{
              title: "Jennifer Holmes",
              metaTitle: "Head Cook",
              metaDesc: "Responsible for the daily preparation of food for participants, including the cooking of meals, and maintaining high standards of food quality, food production and portion control using the standardized menu. ",
              style: {
                "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                "IconColor": "#FF0101",
                "activateColor": "#5589F2",
                "containerBodyPadding": "20px",
                "padding": "10px",
                "border": "#023BFF",
                "borderStyle": "dashed",
                "radius": "20px",
                "borderWidth": "3px",
                "boxShadow": "16px 16px 16px",
                "boxShadowColor": "#181717",
              },
              headerStyle: {
                "background": "linear-gradient(90deg, #fa709a 0%, #fee140 100%)",
                "margin": "10px",
                "padding": "20px",
                "text": "#4A5EC4",
                "textTransform": "Uppercase",
                "textDecoration": "underline",
                "textSize": "20px",
                "textWeight": "bold",
                "fontFamily": "Courier New",
                "fontStyle": "Italic",
                "border": "#FA0101",
                "radius": "20px",
                "borderWidth": "3px",
              },
              bodyStyle: {
                "background": "#FFD90D",
                "margin": "5px",
                "padding": "20px",
                "text": "#027B0E",
                "textTransform": "lowercase",
                "textSize": "12px",
                "textWeight": "bold",
                "fontFamily": "Verdana",
                "fontStyle": "Italic",
                "border": "#F76F01",
                "borderStyle": "solid",
                "radius": "20px",
                "borderWidth": "3px",
              },
              animationStyle: {
                "animation": "tada",
                "animationDelay": "1s",
                "animationDuration": "3s",
                "animationIterationCount": "infinite"
              },
            }}
            compFactory={CardComp}
        />
        </ExampleGroup>
      </>
    );
  }