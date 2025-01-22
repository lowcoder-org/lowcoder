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
            noOfRows: "[\n  {\n    \"rate\": \"9.2\",\n    \"title\": \"The Shawshank Redemption\",\n    \"url\": \"https://www.imdb.com/title/tt0111161/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_UY67_CR0,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.2\",\n    \"title\": \"The Godfather\",\n    \"url\": \"https://www.imdb.com/title/tt0068646/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_UY67_CR1,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.0\",\n    \"title\": \"The Dark Knight\",\n    \"url\": \"https://www.imdb.com/title/tt0468569/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_UY67_CR0,0,45,67_AL_.jpg\"\n  }\n]",
          }}
          blackListConfig={blackListConfig}
          compFactory={ListViewComp}
        />
        <Example
          title="Hiding the List View Component"
          hideSettings
          config={{
            container: container,
            hidden: "true",
            noOfRows: "[\n  {\n    \"rate\": \"9.2\",\n    \"title\": \"The Shawshank Redemption\",\n    \"url\": \"https://www.imdb.com/title/tt0111161/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_UY67_CR0,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.2\",\n    \"title\": \"The Godfather\",\n    \"url\": \"https://www.imdb.com/title/tt0068646/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_UY67_CR1,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.0\",\n    \"title\": \"The Dark Knight\",\n    \"url\": \"https://www.imdb.com/title/tt0468569/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_UY67_CR0,0,45,67_AL_.jpg\"\n  }\n]",
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
            noOfRows: "[\n  {\n    \"rate\": \"9.2\",\n    \"title\": \"The Shawshank Redemption\",\n    \"url\": \"https://www.imdb.com/title/tt0111161/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_UY67_CR0,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.2\",\n    \"title\": \"The Godfather\",\n    \"url\": \"https://www.imdb.com/title/tt0068646/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_UY67_CR1,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.0\",\n    \"title\": \"The Dark Knight\",\n    \"url\": \"https://www.imdb.com/title/tt0468569/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_UY67_CR0,0,45,67_AL_.jpg\"\n  }\n]",
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
            noOfRows: "[\n  {\n    \"rate\": \"9.2\",\n    \"title\": \"The Shawshank Redemption\",\n    \"url\": \"https://www.imdb.com/title/tt0111161/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_UY67_CR0,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.2\",\n    \"title\": \"The Godfather\",\n    \"url\": \"https://www.imdb.com/title/tt0068646/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_UY67_CR1,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.0\",\n    \"title\": \"The Dark Knight\",\n    \"url\": \"https://www.imdb.com/title/tt0468569/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_UY67_CR0,0,45,67_AL_.jpg\"\n  }\n]",
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
            noOfRows: "[\n  {\n    \"rate\": \"9.2\",\n    \"title\": \"The Shawshank Redemption\",\n    \"url\": \"https://www.imdb.com/title/tt0111161/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_UY67_CR0,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.2\",\n    \"title\": \"The Godfather\",\n    \"url\": \"https://www.imdb.com/title/tt0068646/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_UY67_CR1,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.0\",\n    \"title\": \"The Dark Knight\",\n    \"url\": \"https://www.imdb.com/title/tt0468569/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_UY67_CR0,0,45,67_AL_.jpg\"\n  }\n]",
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
            noOfRows: "[\n  {\n    \"rate\": \"9.2\",\n    \"title\": \"The Shawshank Redemption\",\n    \"url\": \"https://www.imdb.com/title/tt0111161/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_UY67_CR0,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.2\",\n    \"title\": \"The Godfather\",\n    \"url\": \"https://www.imdb.com/title/tt0068646/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_UY67_CR1,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.0\",\n    \"title\": \"The Dark Knight\",\n    \"url\": \"https://www.imdb.com/title/tt0468569/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_UY67_CR0,0,45,67_AL_.jpg\"\n  }\n]",
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
            noOfRows: "[\n  {\n    \"rate\": \"9.2\",\n    \"title\": \"The Shawshank Redemption\",\n    \"url\": \"https://www.imdb.com/title/tt0111161/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_UY67_CR0,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.2\",\n    \"title\": \"The Godfather\",\n    \"url\": \"https://www.imdb.com/title/tt0068646/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_UY67_CR1,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.0\",\n    \"title\": \"The Dark Knight\",\n    \"url\": \"https://www.imdb.com/title/tt0468569/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_UY67_CR0,0,45,67_AL_.jpg\"\n  }\n]",
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
            noOfRows: "[\n  {\n    \"rate\": \"9.2\",\n    \"title\": \"The Shawshank Redemption\",\n    \"url\": \"https://www.imdb.com/title/tt0111161/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_UY67_CR0,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.2\",\n    \"title\": \"The Godfather\",\n    \"url\": \"https://www.imdb.com/title/tt0068646/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_UY67_CR1,0,45,67_AL_.jpg\"\n  },\n  {\n    \"rate\": \"9.0\",\n    \"title\": \"The Dark Knight\",\n    \"url\": \"https://www.imdb.com/title/tt0468569/\",\n    \"cover\": \"https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_UY67_CR0,0,45,67_AL_.jpg\"\n  }\n]",
          }}
          blackListConfig={blackListConfig}
          compFactory={ListViewComp}
        />
      </ExampleGroup>
    </>
  );
}
