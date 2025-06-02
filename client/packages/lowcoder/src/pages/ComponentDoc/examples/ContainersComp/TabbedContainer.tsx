import { TabbedContainerComp } from "comps/comps/tabs/tabbedContainerComp";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const container={
  "0": {
      "layout": {
          "acf186c7": {
              "i": "acf186c7",
              "h": 24,
              "w": 7,
              "x": 6,
              "y": 0,
              "pos": 0
          }
      },
      "items": {
          "acf186c7": {
              "compType": "text",
              "comp": {
                  "text": "### This is Tab # 1",
                  "autoHeight": "auto",
                  "type": "markdown",
                  "horizontalAlignment": "left",
                  "contentScrollBar": true,
                  "verticalAlignment": "center",
                  "margin": {
                      "left": "",
                      "right": "",
                      "top": "",
                      "bottom": ""
                  },
                  "padding": {
                      "left": "",
                      "right": "",
                      "top": "",
                      "bottom": ""
                  },
                  "preventStyleOverwriting": false,
                  "appliedThemeId": "",
                  "version": "latest"
              },
              "name": "text1"
          }
      }
  },
  "1": {
      "layout": {
          "e7160f3d": {
              "i": "e7160f3d",
              "h": 6,
              "w": 7,
              "x": 7,
              "y": 2,
              "pos": 0
          }
      },
      "items": {
          "e7160f3d": {
              "compType": "text",
              "comp": {
                  "text": "### This is Tab # 2",
                  "autoHeight": "auto",
                  "type": "markdown",
                  "horizontalAlignment": "left",
                  "contentScrollBar": true,
                  "verticalAlignment": "center",
                  "margin": {
                      "left": "",
                      "right": "",
                      "top": "",
                      "bottom": ""
                  },
                  "padding": {
                      "left": "",
                      "right": "",
                      "top": "",
                      "bottom": ""
                  },
                  "preventStyleOverwriting": false,
                  "appliedThemeId": "",
                  "version": "latest"
              },
              "name": "text2"
          }
      }
  },
  "2": {
      "layout": {
          "480e1038": {
              "i": "480e1038",
              "h": 6,
              "w": 7,
              "x": 7,
              "y": 1,
              "pos": 0
          }
      },
      "items": {
          "480e1038": {
              "compType": "text",
              "comp": {
                  "text": "### This is Tab # 3",
                  "autoHeight": "auto",
                  "type": "markdown",
                  "horizontalAlignment": "left",
                  "contentScrollBar": true,
                  "verticalAlignment": "center",
                  "margin": {
                      "left": "",
                      "right": "",
                      "top": "",
                      "bottom": ""
                  },
                  "padding": {
                      "left": "",
                      "right": "",
                      "top": "",
                      "bottom": ""
                  },
                  "preventStyleOverwriting": false,
                  "appliedThemeId": "",
                  "version": "latest"
              },
              "name": "text3"
          }
      }
  },
  "3": {
      "layout": {
          "69edd323": {
              "i": "69edd323",
              "h": 6,
              "w": 7,
              "x": 7,
              "y": 1,
              "pos": 0
          }
      },
      "items": {
          "69edd323": {
              "compType": "text",
              "comp": {
                  "text": "### This is Tab # 4",
                  "autoHeight": "auto",
                  "type": "markdown",
                  "horizontalAlignment": "left",
                  "contentScrollBar": true,
                  "verticalAlignment": "center",
                  "margin": {
                      "left": "",
                      "right": "",
                      "top": "",
                      "bottom": ""
                  },
                  "padding": {
                      "left": "",
                      "right": "",
                      "top": "",
                      "bottom": ""
                  },
                  "preventStyleOverwriting": false,
                  "appliedThemeId": "",
                  "version": "latest"
              },
              "name": "text4"
          }
      }
  },
  "4": {
      "layout": {
          "2038ea0e": {
              "i": "2038ea0e",
              "h": 6,
              "w": 7,
              "x": 8,
              "y": 1,
              "pos": 0
          }
      },
      "items": {
          "2038ea0e": {
              "compType": "text",
              "comp": {
                  "text": "### This is Tab # 5",
                  "autoHeight": "auto",
                  "type": "markdown",
                  "horizontalAlignment": "left",
                  "contentScrollBar": true,
                  "verticalAlignment": "center",
                  "margin": {
                      "left": "",
                      "right": "",
                      "top": "",
                      "bottom": ""
                  },
                  "padding": {
                      "left": "",
                      "right": "",
                      "top": "",
                      "bottom": ""
                  },
                  "preventStyleOverwriting": false,
                  "appliedThemeId": "",
                  "version": "latest"
              },
              "name": "text5"
          }
      }
  }
};

const tab={
  "manual": [
      {
          "id": 0,
          "label": "Tab1",
          "key": "Tab1",
          "iconPosition": "left"
      },
      {
          "id": 1,
          "label": "Tab2",
          "key": "Tab2",
          "iconPosition": "left"
      },
      {
          "id": 2,
          "label": "Tab3",
          "key": "Tab3",
          "iconPosition": "left"
      },
      {
          "id": 3,
          "label": "Tab4",
          "key": "Tab4",
          "iconPosition": "left"
      },
      {
          "id": 4,
          "label": "Tab5",
          "key": "Tab5",
          "iconPosition": "left"
      }
  ]
};

export default function TabbedContainerExample() {
    return (
      <>

        <ExampleGroup
          title="Basic Usage"
          description="The Following Examples Show the Basic Usage of the Tabbed Container Component."
        >
          <Example
            title="Default Tabbed Container Component"
            hideSettings={true}
            config={{
            }}
            compFactory={TabbedContainerComp}
          />
          <Example
            title="Hiding the Tabbed Container Component"
            hideSettings={true}
            config={{ 
              containers: container,
              tabs: tab,
              hidden: true,
            }}
            compFactory={TabbedContainerComp}
          />
          <Example
            title="Disabling the Tabbed Container Component"
            hideSettings={true}
            config={{
              containers: container,
              tabs: tab,
              disabled: true,
            }}
            compFactory={TabbedContainerComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Tabs Settings"
          description="The Following Examples Show the Usage of the Tabs on Tabs Component."
        >
          <Example
            title="Multiple Tabs & Setting a default Tab"
            hideSettings={true}
            config={{ 
              containers: container,
              tabs: tab,
              selectedTabKey: "Tab3",
            }}
            compFactory={TabbedContainerComp}
          />
          <Example
            title="Hiding Tabs"
            hideSettings={true}
            config={{
              containers: container,
              tabs: tab,
              showHeader: false,
            }}
            compFactory={TabbedContainerComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Layout"
          description="The Following Examples Show the Layout options of the Tab Component."
        >
          <Example
            title="Tabs Placement - Bottom"
            hideSettings={true}
            config={{
              containers: container,
              tabs: tab,
              placement:"bottom",
            }}
            compFactory={TabbedContainerComp}
          />
          <Example
            title="Tabs Placement - Right"
            hideSettings={true}
            config={{
              containers: container,
              tabs: tab,
              placement:"right",
            }}
            compFactory={TabbedContainerComp}
          />
          <Example
            title="Tabs Placement - Left"
            hideSettings={true}
            config={{ 
              containers: container,
              tabs: tab,
              placement:"left",
            }}
            compFactory={TabbedContainerComp}
          />
          <Example
            title="Tabs Placement - Top"
            hideSettings={true}
            config={{ 
              containers: container,
              tabs: tab,
              placement:"top",
            }}
            compFactory={TabbedContainerComp}
          />
          <Example
            title="Tabs Position - Centered"
            hideSettings={true}
            config={{
              containers: container,
              tabs: tab, 
              tabsCentered: true,
            }}
            compFactory={TabbedContainerComp}
          />
          <Example
            title="Gap between Tabs"
            hideSettings={true}
            config={{
              containers: container,
              tabs: tab, 
              tabsGutter: 100,
            }}
            compFactory={TabbedContainerComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Styling Properties"
          description="The Following Examples Show the different Styling Properties of the Tabbed Container Component."
        >
          <Example
            title="Overall Component Styling"
            hideSettings={true}
            config={{ 
              containers: container,
              tabs: tab,
              style: {
                "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                "margin": "5px",
                "padding": "15px",
                "tabText": "#7F7F86",
                "textTransform": "Uppercase",
                "textDecoration": "underline",
                "textSize": "20px",
                "textWeight": "bold",
                "fontFamily": "Courier New",
                "fontStyle": "italic",
                "border": "#5589F2",
                "borderStyle": "solid",
                "radius": "20px",
                "borderWidth": "3px",
                "accent": "#222222",
              },
            }}
            compFactory={TabbedContainerComp}
          />
          <Example
            title="Header Styling"
            hideSettings={true}
            config={{ 
              containers: container,
              tabs: tab,
              style: {
                "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                "margin": "5px",
                "padding": "15px",
                "tabText": "#7F7F86",
                "textTransform": "Uppercase",
                "textDecoration": "underline",
                "textSize": "20px",
                "textWeight": "bold",
                "fontFamily": "Courier New",
                "fontStyle": "italic",
                "border": "#5589F2",
                "borderStyle": "solid",
                "radius": "20px",
                "borderWidth": "3px",
                "accent": "#222222",
              },
              headerStyle:{
                "containerHeaderPadding": "10px",
                "headerBackground": "#FFE607"
              },
            }}
            compFactory={TabbedContainerComp}
          />
          <Example
            title="Body Styling"
            hideSettings={true}
            config={{ 
              containers: container,
              tabs: tab,
              style: {
                "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                "margin": "5px",
                "padding": "15px",
                "tabText": "#7F7F86",
                "textTransform": "Uppercase",
                "textDecoration": "underline",
                "textSize": "20px",
                "textWeight": "bold",
                "fontFamily": "Courier New",
                "fontStyle": "italic",
                "border": "#5589F2",
                "borderStyle": "solid",
                "radius": "20px",
                "borderWidth": "3px",
                "accent": "#222222",
              },
              headerStyle:{
                "containerHeaderPadding": "10px",
                "headerBackground": "#FFE607",
              },
              bodyStyle:{
                "containerBodyPadding": "20px",
                "background": "#E1825A",
              },
            }}
            compFactory={TabbedContainerComp}
          />
        </ExampleGroup>

        <ExampleGroup
          title="Animation Style"
          description="The Following Examples Show different Animation Styles on the Tabbed Container Component."
          >
          <Example
              title="Bounce Animation"
              hideSettings={true}
              config={{
                containers: container,
                tabs: tab,
                style: {
                  "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                  "margin": "5px",
                  "padding": "15px",
                  "tabText": "#7F7F86",
                  "textTransform": "Uppercase",
                  "textDecoration": "underline",
                  "textSize": "20px",
                  "textWeight": "bold",
                  "fontFamily": "Courier New",
                  "fontStyle": "italic",
                  "border": "#5589F2",
                  "borderStyle": "solid",
                  "radius": "20px",
                  "borderWidth": "3px",
                  "accent": "#222222",
                },
                headerStyle:{
                  "containerHeaderPadding": "10px",
                  "headerBackground": "#FFE607",
                },
                bodyStyle:{
                  "containerBodyPadding": "20px",
                  "background": "#E1825A",
                },
                animationStyle: 
                {
                    "animation": "bounce",
                    "animationDelay": "1s",
                    "animationDuration": "3s",
                    "animationIterationCount": "infinite",
                },
              }}
              compFactory={TabbedContainerComp}
          />
          <Example
              title="Swing Animation"
              hideSettings={true}
              config={{
                containers: container,
                tabs: tab,
                style: {
                  "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                  "margin": "5px",
                  "padding": "15px",
                  "tabText": "#7F7F86",
                  "textTransform": "Uppercase",
                  "textDecoration": "underline",
                  "textSize": "20px",
                  "textWeight": "bold",
                  "fontFamily": "Courier New",
                  "fontStyle": "italic",
                  "border": "#5589F2",
                  "borderStyle": "solid",
                  "radius": "20px",
                  "borderWidth": "3px",
                  "accent": "#222222",
                },
                headerStyle:{
                  "containerHeaderPadding": "10px",
                  "headerBackground": "#FFE607",
                },
                bodyStyle:{
                  "containerBodyPadding": "20px",
                  "background": "#E1825A",
                },
                animationStyle: {
                    "animation": "swing",
                    "animationDelay": "1s",
                    "animationDuration": "3s",
                    "animationIterationCount": "infinite"
                },
              }}
              compFactory={TabbedContainerComp}
          />
          <Example
              title="Tada Animation"
              hideSettings={true}
              config={{
                containers: container,
                tabs: tab,
                style: {
                  "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
                  "margin": "5px",
                  "padding": "15px",
                  "tabText": "#7F7F86",
                  "textTransform": "Uppercase",
                  "textDecoration": "underline",
                  "textSize": "20px",
                  "textWeight": "bold",
                  "fontFamily": "Courier New",
                  "fontStyle": "italic",
                  "border": "#5589F2",
                  "borderStyle": "solid",
                  "radius": "20px",
                  "borderWidth": "3px",
                  "accent": "#222222",
                },
                headerStyle:{
                  "containerHeaderPadding": "10px",
                  "headerBackground": "#FFE607",
                },
                bodyStyle:{
                  "containerBodyPadding": "20px",
                  "background": "#E1825A",
                },
                animationStyle: {
                    "animation": "tada",
                    "animationDelay": "1s",
                    "animationDuration": "3s",
                    "animationIterationCount": "infinite"
                },
              }}
              compFactory={TabbedContainerComp}
        />
        </ExampleGroup>
      </>
    );
  }