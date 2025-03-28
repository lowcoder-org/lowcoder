import { ListViewComp } from "comps/comps/listViewComp/listViewComp";
import { trans } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const container={
  "layout": {
      "9bb47110": {
          "i": "9bb47110",
          "w": 6,
          "h": 14,
          "x": 0,
          "y": 0
      },
      "aad8227a": {
          "i": "aad8227a",
          "h": 5,
          "w": 17,
          "x": 7,
          "y": 0
      },
      "68e1f6b2": {
          "i": "68e1f6b2",
          "h": 5,
          "w": 17,
          "x": 7,
          "y": 9
      }
  },
  "items": {
      "9bb47110": {
          "compType": "image",
          "comp": {
              "src": "{{currentItem.cover}}",
              "autoHeight": "fixed",
              "restrictPaddingOnRotation": "image",
              "preventStyleOverwriting": false,
              "appliedThemeId": "",
              "version": "latest"
          },
          "name": "image1"
      },
      "aad8227a": {
          "compType": "link",
          "comp": {
              "text": "{{i+1}}. {{currentItem.title}}",
              "onEvent": [
                  {
                      "name": "click",
                      "handler": {
                          "compType": "goToURL",
                          "comp": {
                              "url": "{{currentItem.url}}",
                              "query": [
                                  {}
                              ],
                              "hash": [
                                  {}
                              ],
                              "inNewTab": true
                          },
                          "condition": "",
                          "slowdown": "debounce",
                          "delay": ""
                      }
                  }
              ],
              "preventStyleOverwriting": false,
              "appliedThemeId": "",
              "version": "latest"
          },
          "name": "link1"
      },
      "68e1f6b2": {
          "compType": "rating",
          "comp": {
              "defaultValue": "{{currentItem.rate / 2}}",
              "value": "",
              "max": "5",
              "label": {
                  "text": "",
                  "width": "33",
                  "widthUnit": "%",
                  "position": "row",
                  "align": "right"
              },
              "allowHalf": true,
              "disabled": "true",
              "preventStyleOverwriting": false,
              "appliedThemeId": "",
              "version": "latest"
          },
          "name": "rating1"
      }
  }
};

export default function ListViewExample() {

  const blackListConfig: string[] = [
    "container"
  ];

  const rows= "[\n  {\n    \"rate\": \"9.2\",\n    \"title\": \"The Shawshank Redemption\",\n    \"url\": \"https://www.imdb.com/title/tt0111161/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_UY67_CR0,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.2\",\n    \"title\": \"The Godfather\",\n    \"url\": \"https://www.imdb.com/title/tt0068646/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_UY67_CR1,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.0\",\n    \"title\": \"The Dark Knight\",\n    \"url\": \"https://www.imdb.com/title/tt0468569/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_UY67_CR0,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.0\",\n    \"title\": \"The Godfather Part II\",\n    \"url\": \"https://www.imdb.com/title/tt0071562/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMWMwMGQzZTItY2JlNC00OWZiLWIyMDctNDk2ZDQ2YjRjMWQ0XkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_UY67_CR1,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.0\",\n    \"title\": \"12 Angry Men\",\n    \"url\": \"https://www.imdb.com/title/tt0050083/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMWU4N2FjNzYtNTVkNC00NzQ0LTg0MjAtYTJlMjFhNGUxZDFmXkEyXkFqcGdeQXVyNjc1NTYyMjg@._V1_UX45_CR0,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"8.9\",\n    \"title\": \"Schindler's List\",\n    \"url\": \"https://www.imdb.com/title/tt0108052/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BNDE4OTMxMTctNmRhYy00NWE2LTg3YzItYTk3M2UwOTU5Njg4XkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_UX45_CR0,0,45,67_AL_.jpg\"\n  }\n]";

  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description="The Following Examples Show the Basic Usage of the ListView Component."

      >
        <Example
          title="A simple List View Component"
          hideSettings
          config={{
            container: container,
            noOfRows: rows,
          }}
          blackListConfig={blackListConfig}
          compFactory={ListViewComp}
        />
        <Example
          title="Hiding the List View Component"
          hideSettings
          config={{
            container: container,
            hidden: true,
            noOfRows: rows,
          }}
          blackListConfig={blackListConfig}
          compFactory={ListViewComp}
        />
        <Example
          title="List View Component - Page Size"
          hideSettings
          config={{
            container: container,
            pagination:{
              pageSize:"2",
            },
            noOfRows: rows,
          }}
          blackListConfig={blackListConfig}
          compFactory={ListViewComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="ListView - Pagination"
        description="The Following Examples Show the usage of Pagination on the ListView Component."

      >
        <Example
          title="List View Component - Page Size"
          hideSettings
          config={{
            container: container,
            pagination:{
              pageSize:"2",
            },
            noOfRows: rows,
          }}
          blackListConfig={blackListConfig}
          compFactory={ListViewComp}
        />
        <Example
          title="List View Component - Show Quick Jumper"
          hideSettings
          config={{
            container: container,
            pagination:{
              pageSize:"2",
              showQuickJumper: true,
            },
            noOfRows: rows,          
          }}
          blackListConfig={blackListConfig}
          compFactory={ListViewComp}
        />
        <Example
          title="List View Component - Show Page Size Changer Option"
          hideSettings
          config={{
            container: container,
            pagination:{
              pageSize:"2",
              showQuickJumper: true,
              showSizeChanger: true,
              pageSizeOptions: "[2,4,6,8]",

            },
            noOfRows: rows,
          }}
          blackListConfig={blackListConfig}
          compFactory={ListViewComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="ListView - Layout"
        description="The Following Examples Show the usage of Layout Options on the ListView Component."

      >
        <Example
          title="List View Layout - Horizontal"
          hideSettings
          config={{
            container: container,
            horizontal: true,
            minHorizontalWidth: "200px",
            pagination:{
              pageSize:"2",
            },
            noOfRows: rows,
          }}
          blackListConfig={blackListConfig}
          compFactory={ListViewComp}
        />
        <Example
          title="List View Layout - Vertical"
          hideSettings
          config={{
            container: container,
            pagination:{
              pageSize:"2",
              showQuickJumper: true,
            },
            noOfRows: rows,
          }}
          blackListConfig={blackListConfig}
          compFactory={ListViewComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Styling Properties"
        description="The Following Examples Show the different Styling Properties on the ListView Component."

      >
        <Example
          title="Background Color, Border Color & Radius"
          hideSettings
          config={{
            container: container,
            style: {
              "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
              "border": "#043CFF",
              "radius": "20px",
            },
            noOfRows: rows,
          }}
          blackListConfig={blackListConfig}
          compFactory={ListViewComp}
        />
        <Example
          title="Rotation - 45 Deg"
          hideSettings
          config={{
            container: container,
            style: {
              "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
              "border": "#043CFF",
              "radius": "20px",
              "rotation": "45deg"
            },
            noOfRows: rows,
          }}
          blackListConfig={blackListConfig}
          compFactory={ListViewComp}
        />
        <Example
          title="Rotation - 135 Deg"
          hideSettings
          config={{
            container: container,
            style: {
              "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
              "border": "#043CFF",
              "radius": "20px",
              "rotation": "135deg"
            },
            noOfRows: rows,
          }}
          blackListConfig={blackListConfig}
          compFactory={ListViewComp}
        />
      </ExampleGroup>

      <ExampleGroup
        title="Animation Style"
        description="The Following Examples Show different animations on the List View Component."
        >
        <Example
          title="Bounce Animation"
          hideSettings={true}
          config={{
            noOfRows: rows,
            container: container, 
            animationStyle: {
            "animation": "bounce",
            "animationDelay": "1s",
            "animationDuration": "3s",
            "animationIterationCount": "infinite"
            },
          }}
          compFactory={ListViewComp}
        />
        <Example
          title="Swing Animation"
          hideSettings={true}
          config={{
            noOfRows: rows,
            container: container, 
            animationStyle: {
            "animation": "swing",
            "animationDelay": "1s",
            "animationDuration": "3s",
            "animationIterationCount": "infinite"
            },
          }}
          compFactory={ListViewComp}
        />
        <Example
          title="Tada Animation"
          hideSettings={true}
          config={{
            noOfRows: rows,
            container: container, 
            animationStyle: {
            "animation": "tada",
            "animationDelay": "1s",
            "animationDuration": "3s",
            "animationIterationCount": "infinite"
            },
          }}
          compFactory={ListViewComp}
        />
      </ExampleGroup>
    </>
  );
}
