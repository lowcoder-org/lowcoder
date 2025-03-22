import { TableComp } from "comps/comps/tableComp";
import { trans, i18nObjs } from "i18n";
import Example from "../../common/Example";
import ExampleGroup from "../../common/ExampleGroup";

const data = JSON.stringify(i18nObjs.table.defaultData);

const data2 = "[\n {\n  \"id\": 1,\n  \"name\": \"4\",\n  \"date\": \"https://api.dicebear.com/7.x/miniavs/svg?seed=1\",\n  \"department\": \"true\"\n },\n {\n  \"id\": 2,\n  \"name\": \"2\",,\n  \"date\": \"https://api.dicebear.com/7.x/miniavs/svg?seed=1\",\n  \"department\": \"true\"\n },\n {\n  \"id\": 3,\n  \"name\": \"1\",\n  \"date\": \"https://api.dicebear.com/7.x/miniavs/svg?seed=1\",\n  \"department\": \"false\"\n },\n {\n  \"id\": 4,\n  \"name\": \"3\",\n  \"date\": \"https://api.dicebear.com/7.x/miniavs/svg?seed=1\",\n },\n {\n  \"id\": 5,\n  \"name\": \"5\",\n  \"date\": \"https://api.dicebear.com/7.x/miniavs/svg?seed=1\",\n  \"department\": \"true\"\n },\n {\n  \"id\": 6,\n  \"name\": \"2\",\n  \"date\": \"https://api.dicebear.com/7.x/miniavs/svg?seed=1\",\n  \"department\": \"\"\n },\n {\n  \"id\": 7,\n  \"name\": \"4\",\n  \"date\": \"https://api.dicebear.com/7.x/miniavs/svg?seed=1\",\n  \"department\": \"true\"\n },\n {\n  \"id\": 8,\n  \"name\": \"3\",\n  \"date\": \"https://api.dicebear.com/7.x/miniavs/svg?seed=1\",\n  \"department\": \"true\"\n },\n {\n  \"id\": 9,\n  \"name\": \"5\",\n  \"date\": \"https://api.dicebear.com/7.x/miniavs/svg?seed=1\",\n  \"department\": \"true\"\n },\n {\n  \"id\": 10,\n  \"name\": \"2\",\n  \"date\": \"https://api.dicebear.com/7.x/miniavs/svg?seed=1\",\n  \"department\": \"false\"\n }\n]";

const data3 = "[\n {\n  \"id\": 1,\n  \"name\": \"Reagen Gilberthorpe\",\n  \"date\": \"Completed\",\n  \"department\": \"100\"\n },\n {\n  \"id\": 2,\n  \"name\": \"Haroun Lortzing\",\n  \"date\": \"To Do\",\n  \"department\": \"0\"\n },\n {\n  \"id\": 2,\n  \"name\": \"Garret Kilmaster\",\n  \"date\": \"In Progress\",\n  \"department\": \"45\"\n },\n {\n  \"id\": 3,\n  \"name\": \"Israel Harrowsmith\",\n  \"date\": \"Closed\",\n  \"department\": \"100\"\n },\n {\n  \"id\": 1,\n  \"name\": \"Loren O'Lagen\",\n  \"date\": \"Backlog\",\n  \"department\": \"0\"\n },\n {\n  \"id\": 2,\n  \"name\": \"Wallis Hothersall\",\n  \"date\": \"Partially Completed\",\n  \"department\": \"85\"\n },\n {\n  \"id\": 1,\n  \"name\": \"Kaia Biskup\",\n  \"date\": \"To Do\",\n  \"department\": \"0\"\n },\n {\n  \"id\": 3,\n  \"name\": \"Travers Saterweyte\",\n  \"date\": \"Done\",\n  \"department\": \"100\"\n },\n {\n  \"id\": 3,\n  \"name\": \"Mikey Niemetz\",\n  \"date\": \"In Progress\",\n  \"department\": \"45\"\n },\n {\n  \"id\": 1,\n  \"name\": \"Mano Meckiff\",\n  \"date\": \"Completed\",\n  \"department\": \"100\"\n }\n]";

const data4 = "[\n {\n  \"id\": \"https://www.google.com\",\n  \"name\": \"Reagen Gilberthorpe\",\n  \"date\": \"7/5/2022\",\n },\n {\n  \"id\": \"https://www.linkedin.com\",\n  \"name\": \"Haroun Lortzing\",\n  \"date\": \"11/6/2022\",\n },\n {\n  \"id\": \"http://lowcoder.cloud/\",\n  \"name\": \"Garret Kilmaster\",\n  \"date\": \"11/14/2021\",\n },\n {\n  \"id\": \"https://docs.lowcoder.cloud/\",\n  \"name\": \"Israel Harrowsmith\",\n  \"date\": \"4/3/2022\",\n },\n {\n  \"id\": \"https://app.lowcoder.cloud\",\n  \"name\": \"Loren O'Lagen\",\n  \"date\": \"9/10/2022\",\n },\n {\n  \"id\": \"https://www.espncricinfo.com/\",\n  \"name\": \"Wallis Hothersall\",\n  \"date\": \"4/18/2022\",\n },\n {\n  \"id\": \"https://techcrunch.com/\",\n  \"name\": \"Kaia Biskup\",\n  \"date\": \"3/4/2022\",\n },\n {\n  \"id\": \"https://www.apple.com/\",\n  \"name\": \"Travers Saterweyte\",\n  \"date\": \"1/9/2022\",\n },\n {\n  \"id\": \"https://www.amazon.com/\",\n  \"name\": \"Mikey Niemetz\",\n  \"date\": \"1/4/2022\",\n },\n {\n  \"id\": \"https://www.etsy.com/\",\n  \"name\": \"Mano Meckiff\",\n  \"date\": \"2/19/2022\",\n }\n]";

const columns = [
  {
      "title": "ID",
      "showTitle": true,
      "isCustom": false,
      "dataIndex": "id",
      "width": "55",
      "autoWidth": "fixed",
      "render": {
          "compType": "text",
          "comp": {
              "text": "{{currentCell}}"
          }
      },
      "align": "left",
      "fixed": "close",
      "editable": true,
      "background": "",
      "margin": "",
      "text": "",
      "border": "",
      "borderWidth": "",
      "radius": "",
      "textSize": "",
      "textWeight": "normal",
      "fontFamily": "sans-serif",
      "fontStyle": "normal",
      "textOverflow": "ellipsis",
      "linkColor": "#3377ff",
      "linkHoverColor": "",
      "linkActiveColor": "",
      "summaryColumns": [
          {
              "isCustom": false,
              "dataIndex": "",
              "render": {
                  "compType": "text",
                  "comp": {}
              },
              "align": "left",
              "background": "",
              "margin": "",
              "text": "",
              "border": "",
              "radius": "",
              "textSize": "",
              "textWeight": "normal",
              "fontFamily": "sans-serif",
              "fontStyle": "normal",
              "textOverflow": "ellipsis",
              "linkColor": "#3377ff",
              "linkHoverColor": "",
              "linkActiveColor": ""
          },
          {
              "isCustom": false,
              "dataIndex": "",
              "render": {
                  "compType": "text",
                  "comp": {}
              },
              "align": "left",
              "background": "",
              "margin": "",
              "text": "",
              "border": "",
              "radius": "",
              "textSize": "",
              "textWeight": "normal",
              "fontFamily": "sans-serif",
              "fontStyle": "normal",
              "textOverflow": "ellipsis",
              "linkColor": "#3377ff",
              "linkHoverColor": "",
              "linkActiveColor": ""
          },
          {
              "isCustom": false,
              "dataIndex": "",
              "render": {
                  "compType": "text",
                  "comp": {}
              },
              "align": "left",
              "background": "",
              "margin": "",
              "text": "",
              "border": "",
              "radius": "",
              "textSize": "",
              "textWeight": "normal",
              "fontFamily": "sans-serif",
              "fontStyle": "normal",
              "textOverflow": "ellipsis",
              "linkColor": "#3377ff",
              "linkHoverColor": "",
              "linkActiveColor": ""
          }
      ]
  },
  {
      "title": "Name",
      "showTitle": true,
      "isCustom": false,
      "dataIndex": "name",
      "width": "200",
      "autoWidth": "fixed",
      "render": {
          "compType": "text",
          "comp": {
              "text": "{{currentCell}}"
          }
      },
      "align": "left",
      "fixed": "close",
      "editable": true,
      "background": "",
      "margin": "",
      "text": "",
      "border": "",
      "borderWidth": "",
      "radius": "",
      "textSize": "",
      "textWeight": "normal",
      "fontFamily": "sans-serif",
      "fontStyle": "normal",
      "textOverflow": "ellipsis",
      "linkColor": "#3377ff",
      "linkHoverColor": "",
      "linkActiveColor": "",
      "summaryColumns": [
          {
              "isCustom": false,
              "dataIndex": "",
              "render": {
                  "compType": "text",
                  "comp": {}
              },
              "align": "left",
              "background": "",
              "margin": "",
              "text": "",
              "border": "",
              "radius": "",
              "textSize": "",
              "textWeight": "normal",
              "fontFamily": "sans-serif",
              "fontStyle": "normal",
              "textOverflow": "ellipsis",
              "linkColor": "#3377ff",
              "linkHoverColor": "",
              "linkActiveColor": ""
          },
          {
              "isCustom": false,
              "dataIndex": "",
              "render": {
                  "compType": "text",
                  "comp": {}
              },
              "align": "left",
              "background": "",
              "margin": "",
              "text": "",
              "border": "",
              "radius": "",
              "textSize": "",
              "textWeight": "normal",
              "fontFamily": "sans-serif",
              "fontStyle": "normal",
              "textOverflow": "ellipsis",
              "linkColor": "#3377ff",
              "linkHoverColor": "",
              "linkActiveColor": ""
          },
          {
              "isCustom": false,
              "dataIndex": "",
              "render": {
                  "compType": "text",
                  "comp": {}
              },
              "align": "left",
              "background": "",
              "margin": "",
              "text": "",
              "border": "",
              "radius": "",
              "textSize": "",
              "textWeight": "normal",
              "fontFamily": "sans-serif",
              "fontStyle": "normal",
              "textOverflow": "ellipsis",
              "linkColor": "#3377ff",
              "linkHoverColor": "",
              "linkActiveColor": ""
          }
      ]
  },
  {
      "title": "Date",
      "showTitle": true,
      "isCustom": false,
      "dataIndex": "date",
      "width": "110",
      "autoWidth": "fixed",
      "render": {
          "compType": "text",
          "comp": {
              "text": "{{currentCell}}"
          }
      },
      "align": "left",
      "fixed": "close",
      "editable": true,
      "background": "",
      "margin": "",
      "text": "",
      "border": "",
      "borderWidth": "",
      "radius": "",
      "textSize": "",
      "textWeight": "normal",
      "fontFamily": "sans-serif",
      "fontStyle": "normal",
      "textOverflow": "ellipsis",
      "linkColor": "#3377ff",
      "linkHoverColor": "",
      "linkActiveColor": "",
      "summaryColumns": [
          {
              "isCustom": false,
              "dataIndex": "",
              "render": {
                  "compType": "text",
                  "comp": {}
              },
              "align": "left",
              "background": "",
              "margin": "",
              "text": "",
              "border": "",
              "radius": "",
              "textSize": "",
              "textWeight": "normal",
              "fontFamily": "sans-serif",
              "fontStyle": "normal",
              "textOverflow": "ellipsis",
              "linkColor": "#3377ff",
              "linkHoverColor": "",
              "linkActiveColor": ""
          },
          {
              "isCustom": false,
              "dataIndex": "",
              "render": {
                  "compType": "text",
                  "comp": {}
              },
              "align": "left",
              "background": "",
              "margin": "",
              "text": "",
              "border": "",
              "radius": "",
              "textSize": "",
              "textWeight": "normal",
              "fontFamily": "sans-serif",
              "fontStyle": "normal",
              "textOverflow": "ellipsis",
              "linkColor": "#3377ff",
              "linkHoverColor": "",
              "linkActiveColor": ""
          },
          {
              "isCustom": false,
              "dataIndex": "",
              "render": {
                  "compType": "text",
                  "comp": {}
              },
              "align": "left",
              "background": "",
              "margin": "",
              "text": "",
              "border": "",
              "radius": "",
              "textSize": "",
              "textWeight": "normal",
              "fontFamily": "sans-serif",
              "fontStyle": "normal",
              "textOverflow": "ellipsis",
              "linkColor": "#3377ff",
              "linkHoverColor": "",
              "linkActiveColor": ""
          }
      ]
  },
  {
      "title": "Department",
      "showTitle": true,
      "isCustom": false,
      "dataIndex": "department",
      "width": "250",
      "autoWidth": "fixed",
      "render": {
          "compType": "tag",
          "comp": {
              "text": "{{currentCell}}",
              "tagColors": {
                  "optionType": "manual",
                  "manual": {
                      "manual": [
                          {
                              "label": "Tag1",
                              "icon": "/icon:solid/tag",
                              "color": "#f50"
                          },
                          {
                              "label": "Tag2",
                              "icon": "/icon:solid/tag",
                              "color": "#2db7f5"
                          }
                      ]
                  },
                  "mapData": {
                      "data": "[]",
                      "mapData": {
                          "color": ""
                      }
                  }
              }
          }
      },
      "align": "left",
      "fixed": "close",
      "editable": true,
      "background": "",
      "margin": "",
      "text": "",
      "border": "",
      "borderWidth": "",
      "radius": "",
      "textSize": "",
      "textWeight": "normal",
      "fontFamily": "sans-serif",
      "fontStyle": "normal",
      "textOverflow": "ellipsis",
      "linkColor": "#3377ff",
      "linkHoverColor": "",
      "linkActiveColor": "",
      "summaryColumns": [
          {
              "isCustom": false,
              "dataIndex": "",
              "render": {
                  "compType": "text",
                  "comp": {}
              },
              "align": "left",
              "background": "",
              "margin": "",
              "text": "",
              "border": "",
              "radius": "",
              "textSize": "",
              "textWeight": "normal",
              "fontFamily": "sans-serif",
              "fontStyle": "normal",
              "textOverflow": "ellipsis",
              "linkColor": "#3377ff",
              "linkHoverColor": "",
              "linkActiveColor": ""
          },
          {
              "isCustom": false,
              "dataIndex": "",
              "render": {
                  "compType": "text",
                  "comp": {}
              },
              "align": "left",
              "background": "",
              "margin": "",
              "text": "",
              "border": "",
              "radius": "",
              "textSize": "",
              "textWeight": "normal",
              "fontFamily": "sans-serif",
              "fontStyle": "normal",
              "textOverflow": "ellipsis",
              "linkColor": "#3377ff",
              "linkHoverColor": "",
              "linkActiveColor": ""
          },
          {
              "isCustom": false,
              "dataIndex": "",
              "render": {
                  "compType": "text",
                  "comp": {}
              },
              "align": "left",
              "background": "",
              "margin": "",
              "text": "",
              "border": "",
              "radius": "",
              "textSize": "",
              "textWeight": "normal",
              "fontFamily": "sans-serif",
              "fontStyle": "normal",
              "textOverflow": "ellipsis",
              "linkColor": "#3377ff",
              "linkHoverColor": "",
              "linkActiveColor": ""
          }
      ]
  }
];
const expansion = {
  "expandable": true,
  "slot": {
      "container": {
          "layout": {
              "d7274235": {
                  "i": "d7274235",
                  "h": 8,
                  "w": 24,
                  "x": 0,
                  "y": 0,
                  "pos": 0
              }
          },
          "items": {
              "d7274235": {
                  "compType": "text",
                  "comp": {
                      "text": "### You can configure/add any component inside the Exapandable Table View",
                      "autoHeight": "auto",
                      "type": "markdown",
                      "horizontalAlignment": "center",
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
                      "showDataLoadingIndicators": false,
                      "preventStyleOverwriting": false,
                      "appliedThemeId": "",
                      "version": "latest"
                  },
                  "name": "text1"
              }
          }
      }
  }
};
const style= {
  "margin": "10px",
  "padding": "20px",
  "borderStyle": "dashed",
  "borderWidth": "3px",
  "background": "linear-gradient(135deg, #72afd3 0%, #96e6a1 100%)",
  "border": "#000",
  "radius": "10px"
};
const headerStyle = {
  "margin": "10px",
  "fontFamily": "Courier New",
  "fontStyle": "italic",
  "text": "#222222",
  "headerBackground": "#F7A007",
  "border": "#E67373",
  "borderWidth": "7px",
  "textSize": "25px"
};
const toolbarStyle = {
  "margin": "0px",
  "background": "#F7A007",
  "border": "#E67373",
  "toolbarText": "#FFFFFF"
};
const rowStyle = {
  "borderWidth": "10px",
  "borderStyle": "dashed",
  "background": "linear-gradient(0deg, #fdfbfb 0%, #ebedee 100%)",
  "border": "#222222",
  "radius": "10px",
  "selectedRowBackground": "#3377FF",
  "hoverRowBackground": "#FFF6E6",
  "alternateBackground": "linear-gradient(0deg, #FFFFFF 0%, rgba(235, 237, 238, 1) 100%)"
};
const columnStyle = {
  "background": "linear-gradient(90deg, RGBA(247, 160, 7, 1) 0%, rgba(254,225,64,1) 100%)",
  "border": "#222222",
  "margin": "10px",
  "radius": "10px",
  "text": "#000000",
  "textSize": "15px",
  "textWeight": "bold",
  "fontFamily": "Courier New",
  "fontStyle": "italic"
};
const summaryRowStyle = {
  "borderWidth": "5px",
  "borderStyle": "dashed",
  "background": "#D7D9E0",
  "border": "#222222",
  "radius": "10px",
  "margin": "1px",
  "text": "#FFFFFF",
  "textSize": "15px",
  "textWeight": "bold",
  "fontFamily": "Courier New",
  "fontStyle": "italic"
};

export default function TableExample() {
  const blackListConfig: string[] = ["data", "size"];
  const nameMap: Record<string, string> = {
    size: trans("componentDoc.tableSize"),
  };
  return (
    <>
      <ExampleGroup
        title={trans("componentDoc.basicUsage")}
        description={trans("componentDoc.basicDemoDescription")}
      >
        <Example
          title={trans("componentDoc.default")}
          width={400}
          config={{
            data: data,
            size: "middle",
          }}
          blackListConfig={blackListConfig}
          nameMap={nameMap}
          compFactory={TableComp}
        />
        <Example
          title={trans("componentDoc.small")}
          width={400}
          config={{
            data: data,
            size: "small",
          }}
          blackListConfig={blackListConfig}
          nameMap={nameMap}
          compFactory={TableComp}
        />
        <Example
          title={trans("componentDoc.large")}
          width={400}
          config={{
            data: data,
            size: "large",
          }}
          blackListConfig={blackListConfig}
          nameMap={nameMap}
          compFactory={TableComp}
        />
      </ExampleGroup>

      <ExampleGroup title="Layout">
        <Example
          title={trans("componentDoc.hideHeader")}
          width={400}
          config={{ data: data, hideHeader: true }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Hide Footer"
          width={400}
          config={{ data: data, hideToolbar: true }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title={trans("componentDoc.hideBordered")}
          width={400}
          config={{ data: data, hideBordered: true }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.selectionMode")}>
        <Example
          title="Single - Only single Row can be selected"
          width={800}
          hideSettings={true}
          config={{ 
            data: data,
            rowStyle: rowStyle,
            selection: 
              { 
                mode: "single", 
              } 
            }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Multiple - Multiple Rows can be selected"
          width={800}
          hideSettings={true}
          config={{ 
            data: data,
            rowStyle: rowStyle, 
            selection:
              { 
                mode: "multi", 
              } 
            }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Close - No Row can be selected"
          width={800}
          hideSettings={true}
          config={{
            data: data, 
            rowStyle: rowStyle,
            selection:
              { 
                mode: "close", 
              } 
            }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Showing Loading bars"
          width={800}
          hideSettings={true}
          config={{ 
            data: data, 
            hideBordered: true,
            loading: true, 
            }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
      </ExampleGroup>

      <ExampleGroup title="Editable Table & Edit modes">
        <Example
          title="Edit Mode - Single Click"
          width={400}
          config={{ 
            data: data, 
            columns: columns,
            editModeClicks: "single",
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Edit Mode - Double Click"
          width={400}
          config={{ 
            data: data, 
            columns: columns,
            editModeClicks: "double",
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
      </ExampleGroup>

      <ExampleGroup title={trans("componentDoc.paginationSetting")}>
        <Example
          title={trans("componentDoc.paginationShowQuickJumper")}
          width={400}
          config={{ data: data, hideHeader: true, pagination: { showQuickJumper: true } }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title={trans("componentDoc.paginationHideOnSinglePage")}
          width={400}
          config={{
            data: '[\n {\n  "id": 1,\n  "name": "Lucy",\n  "phoneNumber": "17137564247"}]',
            hideBordered: true,
            pagination: { hideOnSinglePage: true },
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title={trans("componentDoc.paginationShowSizeChanger")}
          width={400}
          config={{
            data: data,
            pagination: { showSizeChanger: true, pageSizeOptions: "[5, 10, 20, 50]" },
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
      </ExampleGroup>

      <ExampleGroup title="Toolbar Settings">
        <Example
          title="Bottom Position"
          width={400}
          config={{ 
            data: data,
            toolbar:{position:"below", showFilter:true, showDownload:true,showRefresh:true,columnSetting:true},
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Top Position"
          width={400}
          config={{ 
            data: data,
            toolbar:{position:"above", showFilter:true, showDownload:true,showRefresh:true,columnSetting:true},
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="No Toolbar"
          width={400}
          config={{ 
            data: data,
            toolbar:{position:"close"},
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Hiding Filter icon"
          width={400}
          config={{ 
            data: data,
            toolbar:{position:"below", showFilter:false, showDownload:true,showRefresh:true,columnSetting:true},
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Hiding Download Icon"
          width={400}
          config={{ 
            data: data,
            toolbar:{position:"below", showFilter:true, showDownload:false,showRefresh:true,columnSetting:true},
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Hiding Refresh Icon"
          width={400}
          config={{ 
            data: data,
            toolbar:{position:"below", showFilter:true, showDownload:true,showRefresh:false,columnSetting:true},
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Hiding Column Visibility Icon"
          width={400}
          config={{ 
            data: data,
            toolbar:{position:"below", showFilter:true, showDownload:true,showRefresh:true,columnSetting:false},
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
      </ExampleGroup>

      <ExampleGroup title="Summary and Inline Rows">
        <Example
          title="Summary Rows"
          width={400}
          config={{ 
            data: data,
            showSummary: true,
            summaryRows: "2",
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Add Inline Rows - Start writing into the last Row of this Table :"
          width={400}
          config={{ 
            data: data,
            inlineAddNewRow: true,
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
      </ExampleGroup>

      <ExampleGroup title="Row Style">
        <Example
          title="Hiding Vertical Row Grid Borders"
          width={400}
          config={{ 
            data: data,
            showRowGridBorder: false,
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Hiding Horizontal Row Grid Borders"
          width={400}
          config={{ 
            data: data,
            showHRowGridBorder: false,
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
      </ExampleGroup>

      <ExampleGroup title="Expandable View">
        <Example
          title="Expandable View"
          width={800}
          hideSettings={true}
          config={{ 
            data: data,
            expansion: expansion,
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
      </ExampleGroup>

      <ExampleGroup title="Styling Properties">
        <Example
          title="Table Styling"
          width={800}
          hideSettings={true}
          config={{ 
            data: data,
            style: style,
            toolbar:{position:"below", showFilter:true, showDownload:true,showRefresh:true,columnSetting:true},
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Header Styling"
          width={800}
          hideSettings={true}
          config={{ 
            data: data,
            headerStyle: headerStyle,
            toolbar:{position:"below", showFilter:true, showDownload:true,showRefresh:true,columnSetting:true},
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Toolbar Styling"
          width={800}
          hideSettings={true}
          config={{ 
            data: data,
            toolbarStyle: toolbarStyle,
            toolbar:{position:"below", showFilter:true, showDownload:true,showRefresh:true,columnSetting:true},
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Row Styling"
          width={800}
          hideSettings={true}
          config={{ 
            data: data,
            rowStyle: rowStyle,
            toolbar:{position:"below", showFilter:true, showDownload:true,showRefresh:true,columnSetting:true},
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Column Styling"
          width={800}
          hideSettings={true}
          config={{ 
            data: data,
            columnsStyle: columnStyle,
            toolbar:{position:"below", showFilter:true, showDownload:true,showRefresh:true,columnSetting:true},
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Summary Rows Styling"
          width={800}
          hideSettings={true}
          config={{ 
            data: data,
            showSummary: true,
            summaryRows: "2",
            columns: [
              {
                  "title": "ID",
                  "showTitle": true,
                  "isCustom": false,
                  "dataIndex": "id",
                  "width": "68",
                  "autoWidth": "fixed",
                  "render": {
                      "compType": "text",
                      "comp": {
                          "text": "{{currentCell}}"
                      }
                  },
                  "align": "left",
                  "fixed": "close",
                  "background": "",
                  "margin": "",
                  "text": "",
                  "border": "",
                  "borderWidth": "",
                  "radius": "",
                  "textSize": "",
                  "textWeight": "normal",
                  "fontFamily": "sans-serif",
                  "fontStyle": "normal",
                  "textOverflow": "ellipsis",
                  "linkColor": "#3377ff",
                  "linkHoverColor": "",
                  "linkActiveColor": "",
                  "summaryColumns": [
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {
                                  "text": "10"
                              }
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {
                                  "text": "20"
                              }
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      }
                  ]
              },
              {
                  "title": "Name",
                  "showTitle": true,
                  "isCustom": false,
                  "dataIndex": "name",
                  "width": "200",
                  "autoWidth": "fixed",
                  "render": {
                      "compType": "text",
                      "comp": {
                          "text": "{{currentCell}}"
                      }
                  },
                  "align": "left",
                  "fixed": "close",
                  "background": "",
                  "margin": "",
                  "text": "",
                  "border": "",
                  "borderWidth": "",
                  "radius": "",
                  "textSize": "",
                  "textWeight": "normal",
                  "fontFamily": "sans-serif",
                  "fontStyle": "normal",
                  "textOverflow": "ellipsis",
                  "linkColor": "#3377ff",
                  "linkHoverColor": "",
                  "linkActiveColor": "",
                  "summaryColumns": [
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {
                                  "text": "John"
                              }
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {
                                  "text": "Daniel"
                              }
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      }
                  ]
              },
              {
                  "title": "Date",
                  "showTitle": true,
                  "isCustom": false,
                  "dataIndex": "date",
                  "width": "110",
                  "autoWidth": "fixed",
                  "render": {
                      "compType": "text",
                      "comp": {
                          "text": "{{currentCell}}"
                      }
                  },
                  "align": "left",
                  "fixed": "close",
                  "background": "",
                  "margin": "",
                  "text": "",
                  "border": "",
                  "borderWidth": "",
                  "radius": "",
                  "textSize": "",
                  "textWeight": "normal",
                  "fontFamily": "sans-serif",
                  "fontStyle": "normal",
                  "textOverflow": "ellipsis",
                  "linkColor": "#3377ff",
                  "linkHoverColor": "",
                  "linkActiveColor": "",
                  "summaryColumns": [
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {
                                  "text": "{{Date()}}"
                              }
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {
                                  "text": "{{Date()}}"
                              }
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      }
                  ]
              },
              {
                  "title": "Department",
                  "showTitle": true,
                  "isCustom": false,
                  "dataIndex": "department",
                  "width": "250",
                  "autoWidth": "fixed",
                  "render": {
                      "compType": "tag",
                      "comp": {
                          "text": "{{currentCell}}",
                          "tagColors": {
                              "optionType": "manual",
                              "manual": {
                                  "manual": [
                                      {
                                          "label": "Tag1",
                                          "icon": "/icon:solid/tag",
                                          "color": "#f50"
                                      },
                                      {
                                          "label": "Tag2",
                                          "icon": "/icon:solid/tag",
                                          "color": "#2db7f5"
                                      }
                                  ]
                              },
                              "mapData": {
                                  "data": "[]",
                                  "mapData": {
                                      "color": ""
                                  }
                              }
                          }
                      }
                  },
                  "align": "left",
                  "fixed": "close",
                  "background": "",
                  "margin": "",
                  "text": "",
                  "border": "",
                  "borderWidth": "",
                  "radius": "",
                  "textSize": "",
                  "textWeight": "normal",
                  "fontFamily": "sans-serif",
                  "fontStyle": "normal",
                  "textOverflow": "ellipsis",
                  "linkColor": "#3377ff",
                  "linkHoverColor": "",
                  "linkActiveColor": "",
                  "summaryColumns": [
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "tag",
                              "comp": {
                                  "text": "TAX",
                                  "tagColors": {
                                      "optionType": "manual",
                                      "manual": {
                                          "manual": [
                                              {
                                                  "label": "Tag1",
                                                  "icon": "/icon:solid/tag",
                                                  "color": "#f50"
                                              },
                                              {
                                                  "label": "Tag2",
                                                  "icon": "/icon:solid/tag",
                                                  "color": "#2db7f5"
                                              }
                                          ]
                                      },
                                      "mapData": {
                                          "data": "[]",
                                          "mapData": {
                                              "color": ""
                                          }
                                      }
                                  }
                              }
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "tag",
                              "comp": {
                                  "text": "TAX",
                                  "tagColors": {
                                      "optionType": "manual",
                                      "manual": {
                                          "manual": [
                                              {
                                                  "label": "Tag1",
                                                  "icon": "/icon:solid/tag",
                                                  "color": "#f50"
                                              },
                                              {
                                                  "label": "Tag2",
                                                  "icon": "/icon:solid/tag",
                                                  "color": "#2db7f5"
                                              }
                                          ]
                                      },
                                      "mapData": {
                                          "data": "[]",
                                          "mapData": {
                                              "color": ""
                                          }
                                      }
                                  }
                              }
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      }
                  ]
              }
          ],
            summaryRowStyle: summaryRowStyle,
            toolbar:{position:"below", showFilter:true, showDownload:true,showRefresh:true,columnSetting:true},
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
      </ExampleGroup>


      <ExampleGroup title="Column Types">
        <Example
          title="Column Types : Number, Text, Date, Date & Time, Tag"
          width={800}
          hideSettings={true}
          config={{
            columns: [
              {
                  "title": "Number",
                  "showTitle": true,
                  "isCustom": false,
                  "dataIndex": "id",
                  "width": "55",
                  "autoWidth": "fixed",
                  "render": {
                      "compType": "number",
                      "comp": {
                          "text": "{{currentCell}}",
                          "step": "1"
                      }
                  },
                  "align": "left",
                  "fixed": "close",
                  "background": "",
                  "margin": "",
                  "text": "",
                  "border": "",
                  "borderWidth": "",
                  "radius": "",
                  "textSize": "",
                  "textWeight": "normal",
                  "fontFamily": "sans-serif",
                  "fontStyle": "normal",
                  "textOverflow": "ellipsis",
                  "linkColor": "#3377ff",
                  "linkHoverColor": "",
                  "linkActiveColor": "",
                  "summaryColumns": [
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      }
                  ]
              },
              {
                  "title": "Text",
                  "showTitle": true,
                  "isCustom": false,
                  "dataIndex": "name",
                  "width": "200",
                  "autoWidth": "fixed",
                  "render": {
                      "compType": "text",
                      "comp": {
                          "text": "{{currentCell}}"
                      }
                  },
                  "align": "left",
                  "fixed": "close",
                  "background": "",
                  "margin": "",
                  "text": "",
                  "border": "",
                  "borderWidth": "",
                  "radius": "",
                  "textSize": "",
                  "textWeight": "normal",
                  "fontFamily": "sans-serif",
                  "fontStyle": "normal",
                  "textOverflow": "ellipsis",
                  "linkColor": "#3377ff",
                  "linkHoverColor": "",
                  "linkActiveColor": "",
                  "summaryColumns": [
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      }
                  ]
              },
              {
                  "title": "Date",
                  "showTitle": true,
                  "isCustom": false,
                  "dataIndex": "date",
                  "width": "110",
                  "autoWidth": "fixed",
                  "render": {
                      "compType": "date",
                      "comp": {
                          "text": "{{currentCell}}",
                          "format": "YYYY-MM-DD",
                          "inputFormat": "YYYY-MM-DD"
                      }
                  },
                  "align": "left",
                  "fixed": "close",
                  "background": "",
                  "margin": "",
                  "text": "",
                  "border": "",
                  "borderWidth": "",
                  "radius": "",
                  "textSize": "",
                  "textWeight": "normal",
                  "fontFamily": "sans-serif",
                  "fontStyle": "normal",
                  "textOverflow": "ellipsis",
                  "linkColor": "#3377ff",
                  "linkHoverColor": "",
                  "linkActiveColor": "",
                  "summaryColumns": [
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      }
                  ]
              },
              {
                  "title": "Date Time",
                  "showTitle": true,
                  "isCustom": true,
                  "dataIndex": "4be1c6fe",
                  "autoWidth": "auto",
                  "render": {
                      "compType": "dateTime",
                      "comp": {
                          "text": "{{Date()}}",
                          "format": "YYYY-MM-DD HH:mm:ss",
                          "inputFormat": "YYYY-MM-DD HH:mm:ss"
                      }
                  },
                  "align": "left",
                  "fixed": "close",
                  "background": "",
                  "margin": "",
                  "text": "",
                  "border": "",
                  "borderWidth": "",
                  "radius": "",
                  "textSize": "",
                  "textWeight": "normal",
                  "fontFamily": "sans-serif",
                  "fontStyle": "normal",
                  "textOverflow": "ellipsis",
                  "linkColor": "#3377ff",
                  "linkHoverColor": "",
                  "linkActiveColor": "",
                  "summaryColumns": [
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      }
                  ]
              },
              {
                  "title": "Tag",
                  "showTitle": true,
                  "isCustom": false,
                  "dataIndex": "department",
                  "width": "250",
                  "autoWidth": "fixed",
                  "render": {
                      "compType": "tag",
                      "comp": {
                          "text": "{{currentCell}}",
                          "tagColors": {
                              "optionType": "manual",
                              "manual": {
                                  "manual": [
                                      {
                                          "label": "Tag1",
                                          "icon": "/icon:solid/tag",
                                          "color": "#f50"
                                      },
                                      {
                                          "label": "Tag2",
                                          "icon": "/icon:solid/tag",
                                          "color": "#2db7f5"
                                      }
                                  ]
                              },
                              "mapData": {
                                  "data": "[]",
                                  "mapData": {
                                      "color": ""
                                  }
                              }
                          }
                      }
                  },
                  "align": "left",
                  "fixed": "close",
                  "background": "",
                  "margin": "",
                  "text": "",
                  "border": "",
                  "borderWidth": "",
                  "radius": "",
                  "textSize": "",
                  "textWeight": "normal",
                  "fontFamily": "sans-serif",
                  "fontStyle": "normal",
                  "textOverflow": "ellipsis",
                  "linkColor": "#3377ff",
                  "linkHoverColor": "",
                  "linkActiveColor": "",
                  "summaryColumns": [
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      }
                  ]
              },
          ],
            data: data,
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Column Types : Avatar, Ratings, Image, Markdown, Boolean, Switch"
          width={800}
          hideSettings={true}
          config={{ 
            data: data2,
            columns: [
              {
                  "title": "Avatars",
                  "showTitle": true,
                  "isCustom": false,
                  "dataIndex": "id",
                  "width": "144",
                  "autoWidth": "fixed",
                  "render": {
                      "compType": "avatars",
                      "comp": {
                          "maxCount": "3",
                          "avatarSize": "40",
                          "alignment": "center",
                          "autoColor": true,
                          "avatars": {
                              "optionType": "manual",
                              "manual": {
                                  "manual": [
                                      {
                                          "src": "https://api.dicebear.com/7.x/miniavs/svg?seed=1",
                                          "label": "I"
                                      },
                                      {
                                          "AvatarIcon": "/icon:antd/startwotone"
                                      },
                                      {
                                          "label": "R"
                                      },
                                      {
                                          "label": "M"
                                      }
                                  ]
                              },
                              "mapData": {
                                  "data": "[]"
                              }
                          }
                      }
                  },
                  "align": "left",
                  "fixed": "close",
                  "background": "",
                  "margin": "",
                  "text": "",
                  "border": "",
                  "borderWidth": "",
                  "radius": "",
                  "textSize": "",
                  "textWeight": "normal",
                  "fontFamily": "sans-serif",
                  "fontStyle": "normal",
                  "textOverflow": "ellipsis",
                  "linkColor": "#3377ff",
                  "linkHoverColor": "",
                  "linkActiveColor": "",
                  "summaryColumns": [
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      }
                  ]
              },
              {
                  "title": "Ratings",
                  "showTitle": true,
                  "isCustom": false,
                  "dataIndex": "name",
                  "width": "107",
                  "autoWidth": "fixed",
                  "render": {
                      "compType": "rating",
                      "comp": {
                          "text": "{{currentCell}}"
                      }
                  },
                  "align": "left",
                  "fixed": "close",
                  "background": "",
                  "margin": "",
                  "text": "",
                  "border": "",
                  "borderWidth": "",
                  "radius": "",
                  "textSize": "",
                  "textWeight": "normal",
                  "fontFamily": "sans-serif",
                  "fontStyle": "normal",
                  "textOverflow": "ellipsis",
                  "linkColor": "#3377ff",
                  "linkHoverColor": "",
                  "linkActiveColor": "",
                  "summaryColumns": [
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      }
                  ]
              },
              {
                  "title": "Image",
                  "showTitle": true,
                  "isCustom": false,
                  "dataIndex": "date",
                  "width": "110",
                  "autoWidth": "fixed",
                  "render": {
                      "compType": "image",
                      "comp": {
                          "src": "{{currentCell}}",
                          "size": "50"
                      }
                  },
                  "align": "left",
                  "fixed": "close",
                  "background": "",
                  "margin": "",
                  "text": "",
                  "border": "",
                  "borderWidth": "",
                  "radius": "",
                  "textSize": "",
                  "textWeight": "normal",
                  "fontFamily": "sans-serif",
                  "fontStyle": "normal",
                  "textOverflow": "ellipsis",
                  "linkColor": "#3377ff",
                  "linkHoverColor": "",
                  "linkActiveColor": "",
                  "summaryColumns": [
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      }
                  ]
              },
              {
                  "title": "Markdown",
                  "showTitle": true,
                  "isCustom": true,
                  "dataIndex": "4be1c6fe",
                  "width": "249.796875",
                  "autoWidth": "fixed",
                  "render": {
                      "compType": "markdown",
                      "comp": {
                          "text": "{{Date()}}"
                      }
                  },
                  "align": "left",
                  "fixed": "close",
                  "background": "",
                  "margin": "",
                  "text": "",
                  "border": "",
                  "borderWidth": "",
                  "radius": "",
                  "textSize": "",
                  "textWeight": "normal",
                  "fontFamily": "sans-serif",
                  "fontStyle": "normal",
                  "textOverflow": "ellipsis",
                  "linkColor": "#3377ff",
                  "linkHoverColor": "",
                  "linkActiveColor": "",
                  "summaryColumns": [
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      }
                  ]
              },
              {
                  "title": "Boolean",
                  "showTitle": true,
                  "isCustom": false,
                  "dataIndex": "department",
                  "width": "89.3984375",
                  "autoWidth": "fixed",
                  "render": {
                      "compType": "boolean",
                      "comp": {
                          "text": "{{currentCell}}",
                          "falseValues": "x",
                          "iconNull": "/icon:antd/dashoutlined"
                      }
                  },
                  "align": "left",
                  "fixed": "close",
                  "background": "",
                  "margin": "",
                  "text": "",
                  "border": "",
                  "borderWidth": "",
                  "radius": "",
                  "textSize": "",
                  "textWeight": "normal",
                  "fontFamily": "sans-serif",
                  "fontStyle": "normal",
                  "textOverflow": "ellipsis",
                  "linkColor": "#3377ff",
                  "linkHoverColor": "",
                  "linkActiveColor": "",
                  "summaryColumns": [
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      }
                  ]
              },
              {
                  "title": "Switch",
                  "showTitle": true,
                  "isCustom": true,
                  "dataIndex": "9f0b04b5",
                  "autoWidth": "auto",
                  "render": {
                      "compType": "switch",
                      "comp": {
                          "value": "",
                          "switchState": "{{currentRow.department}}"
                      }
                  },
                  "align": "left",
                  "fixed": "close",
                  "background": "",
                  "margin": "",
                  "text": "",
                  "border": "",
                  "borderWidth": "",
                  "radius": "",
                  "textSize": "",
                  "textWeight": "normal",
                  "fontFamily": "sans-serif",
                  "fontStyle": "normal",
                  "textOverflow": "ellipsis",
                  "linkColor": "#3377ff",
                  "linkHoverColor": "",
                  "linkActiveColor": "",
                  "summaryColumns": [
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      },
                      {
                          "isCustom": false,
                          "dataIndex": "",
                          "render": {
                              "compType": "text",
                              "comp": {}
                          },
                          "align": "left",
                          "background": "",
                          "margin": "",
                          "text": "",
                          "border": "",
                          "radius": "",
                          "textSize": "",
                          "textWeight": "normal",
                          "fontFamily": "sans-serif",
                          "fontStyle": "normal",
                          "textOverflow": "ellipsis",
                          "linkColor": "#3377ff",
                          "linkHoverColor": "",
                          "linkActiveColor": ""
                      }
                  ]
              }
          ],
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Column Types : Select, Dropdown, Status, Progress"
          width={800}
          hideSettings={true}
          config={{
            data: data3,
            columns: [
                {
                    "title": "Select",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "id",
                    "width": "85",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "select",
                        "comp": {
                            "text": "{{currentCell}}",
                            "options": {
                                "optionType": "manual",
                                "manual": {
                                    "manual": [
                                        {
                                            "value": "1",
                                            "label": "Option 1"
                                        },
                                        {
                                            "value": "2",
                                            "label": "Option 2"
                                        },
                                        {
                                            "value": "3",
                                            "label": "Option 3"
                                        }
                                    ]
                                },
                                "mapData": {
                                    "data": "[]"
                                }
                            }
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "editable": true,
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Dropdown",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "name",
                    "width": "82.2421875",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "dropdown",
                        "comp": {
                            "buttonType": "primary",
                            "label": "",
                            "prefixIcon": "/icon:solid/ellipsis-vertical",
                            "options": {
                                "optionType": "manual",
                                "manual": {
                                    "manual": [
                                        {
                                            "label": "Option 1"
                                        },
                                        {
                                            "label": "Option 2"
                                        }
                                    ]
                                },
                                "mapData": {
                                    "data": "[]"
                                }
                            }
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Status",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "date",
                    "width": "110",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "badgeStatus",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Progress",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "department",
                    "width": "250",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "progress",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                }
            ],
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Column Types: Link, Links, Button,"
          width={800}
          hideSettings={true}
          config={{
            data: data4,
            columns: [
                {
                    "title": "Link",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "id",
                    "width": "143",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "link",
                        "comp": {
                            "text": "{{currentCell}}",
                            "onClick": {
                                "compType": "goToURL",
                                "comp": {
                                    "url": "{{currentCell}}",
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
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Links",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "name",
                    "width": "200",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "links",
                        "comp": {
                            "options": {
                                "manual": [
                                    {
                                        "label": "Google",
                                        "onClick": {
                                            "compType": "goToURL",
                                            "comp": {
                                                "url": "https://www.google.com",
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
                                    },
                                    {
                                        "label": "Facebook",
                                        "onClick": {
                                            "compType": "goToURL",
                                            "comp": {
                                                "url": "https://www.facebook.com",
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
                                    },
                                    {
                                        "label": "Linkedin",
                                        "onClick": {
                                            "compType": "goToURL",
                                            "comp": {
                                                "url": "https://www.linkedin.com",
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
                                ]
                            }
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Button",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "date",
                    "width": "110",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "button",
                        "comp": {
                            "text": "{{currentRow.id}}",
                            "buttonType": "primary",
                            "onClick": {
                                "compType": "goToURL",
                                "comp": {
                                    "url": "{{currentRow.id}}",
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
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                }
            ],
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
      </ExampleGroup>

      <ExampleGroup title="Individual Column Properties">
        <Example
          title="Fixed Column - Left side ( scroll to right to see the effect )"
          width={400}
          hideSettings={true}
          config={{ 
            data: data,
            columns : [
                {
                    "title": "ID",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "id",
                    "width": "55",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "left",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Name",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "name",
                    "width": "200",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Date",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "date",
                    "width": "110",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Department",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "department",
                    "width": "250",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "tag",
                        "comp": {
                            "text": "{{currentCell}}",
                            "tagColors": {
                                "optionType": "manual",
                                "manual": {
                                    "manual": [
                                        {
                                            "label": "Tag1",
                                            "icon": "/icon:solid/tag",
                                            "color": "#f50"
                                        },
                                        {
                                            "label": "Tag2",
                                            "icon": "/icon:solid/tag",
                                            "color": "#2db7f5"
                                        }
                                    ]
                                },
                                "mapData": {
                                    "data": "[]",
                                    "mapData": {
                                        "color": ""
                                    }
                                }
                            }
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                }
            ],
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Fixed Column - Right side ( scroll to left to see the effect )"
          width={400}
          hideSettings={true}
          config={{ 
            data: data,
            columns : [
                {
                    "title": "ID",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "id",
                    "width": "55",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "right",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Name",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "name",
                    "width": "200",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Date",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "date",
                    "width": "110",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Department",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "department",
                    "width": "250",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "tag",
                        "comp": {
                            "text": "{{currentCell}}",
                            "tagColors": {
                                "optionType": "manual",
                                "manual": {
                                    "manual": [
                                        {
                                            "label": "Tag1",
                                            "icon": "/icon:solid/tag",
                                            "color": "#f50"
                                        },
                                        {
                                            "label": "Tag2",
                                            "icon": "/icon:solid/tag",
                                            "color": "#2db7f5"
                                        }
                                    ]
                                },
                                "mapData": {
                                    "data": "[]",
                                    "mapData": {
                                        "color": ""
                                    }
                                }
                            }
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                }
            ],
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Sortable Columns"
          width={800}
          hideSettings={true}
          config={{ 
            data: data,
            columns: [
                {
                    "title": "ID",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "id",
                    "sortable": true,
                    "width": "55",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Name",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "name",
                    "sortable": true,
                    "width": "200",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Date",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "date",
                    "sortable": true,
                    "width": "110",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Department",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "department",
                    "sortable": true,
                    "width": "250",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "tag",
                        "comp": {
                            "text": "{{currentCell}}",
                            "tagColors": {
                                "optionType": "manual",
                                "manual": {
                                    "manual": [
                                        {
                                            "label": "Tag1",
                                            "icon": "/icon:solid/tag",
                                            "color": "#f50"
                                        },
                                        {
                                            "label": "Tag2",
                                            "icon": "/icon:solid/tag",
                                            "color": "#2db7f5"
                                        }
                                    ]
                                },
                                "mapData": {
                                    "data": "[]",
                                    "mapData": {
                                        "color": ""
                                    }
                                }
                            }
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                }
            ],
            }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Individual Columns Styling"
          width={800}
          hideSettings={true}
          config={{ 
            data: data,
            rowStyle: {
                "selectedRowBackground": "#E68E50",
                "hoverRowBackground": "#36B389",
                "alternateBackground": "#36B389",
            },
            columns:[
                {
                    "title": "ID",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "id",
                    "width": "55",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "#D7D9E0",
                    "margin": "",
                    "text": "#FFFFFF",
                    "border": "#222222",
                    "borderWidth": "",
                    "radius": "5px",
                    "textSize": "20px",
                    "textWeight": "bold",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Name",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "name",
                    "width": "200",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "#5589F2",
                    "margin": "",
                    "text": "#FFFFFF",
                    "border": "#222222",
                    "borderWidth": "",
                    "radius": "5px",
                    "textSize": "20px",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Date",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "date",
                    "width": "110",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "#E68E50",
                    "margin": "",
                    "text": "#FFFFFF",
                    "border": "#222222",
                    "borderWidth": "",
                    "radius": "5px",
                    "textSize": "20px",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Department",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "department",
                    "width": "250",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "tag",
                        "comp": {
                            "text": "{{currentCell}}",
                            "tagColors": {
                                "optionType": "manual",
                                "manual": {
                                    "manual": [
                                        {
                                            "label": "Tag1",
                                            "icon": "/icon:solid/tag",
                                            "color": "#f50"
                                        },
                                        {
                                            "label": "Tag2",
                                            "icon": "/icon:solid/tag",
                                            "color": "#2db7f5"
                                        }
                                    ]
                                },
                                "mapData": {
                                    "data": "[]",
                                    "mapData": {
                                        "color": ""
                                    }
                                }
                            }
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "#36B389",
                    "margin": "",
                    "text": "#FFFFFF",
                    "border": "#222222",
                    "borderWidth": "",
                    "radius": "5px",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                }
            ],
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Prefix Icons on Columns"
          width={800}
          hideSettings={true}
          config={{ 
            data: data,
            columns: [
                {
                    "title": "ID",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "id",
                    "width": "55",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}",
                            "prefixIcon": "/icon:solid/angles-right"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Name",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "name",
                    "width": "200",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}",
                            "prefixIcon": "/icon:solid/person"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Date",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "date",
                    "width": "110",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}",
                            "prefixIcon": "/icon:solid/business-time"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Department",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "department",
                    "width": "250",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "tag",
                        "comp": {
                            "text": "{{currentCell}}",
                            "tagColors": {
                                "optionType": "manual",
                                "manual": {
                                    "manual": [
                                        {
                                            "label": "Tag1",
                                            "icon": "/icon:solid/tag",
                                            "color": "#f50"
                                        },
                                        {
                                            "label": "Tag2",
                                            "icon": "/icon:solid/tag",
                                            "color": "#2db7f5"
                                        }
                                    ]
                                },
                                "mapData": {
                                    "data": "[]",
                                    "mapData": {
                                        "color": ""
                                    }
                                }
                            }
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                }
            ],
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Suffix Icons on Columns"
          width={800}
          hideSettings={true}
          config={{ 
            data: data,
            columns: [
                {
                    "title": "ID",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "id",
                    "width": "55",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}",
                            "suffixIcon": "/icon:solid/ellipsis-vertical"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Name",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "name",
                    "width": "200",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}",
                            "suffixIcon": "/icon:solid/person-circle-check"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Date",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "date",
                    "width": "110",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}",
                            "suffixIcon": "/icon:solid/calendar-days"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Department",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "department",
                    "width": "250",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "tag",
                        "comp": {
                            "text": "{{currentCell}}",
                            "tagColors": {
                                "optionType": "manual",
                                "manual": {
                                    "manual": [
                                        {
                                            "label": "Tag1",
                                            "icon": "/icon:solid/tag",
                                            "color": "#f50"
                                        },
                                        {
                                            "label": "Tag2",
                                            "icon": "/icon:solid/tag",
                                            "color": "#2db7f5"
                                        }
                                    ]
                                },
                                "mapData": {
                                    "data": "[]",
                                    "mapData": {
                                        "color": ""
                                    }
                                }
                            }
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                }
            ],
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Column Tooltip"
          width={800}
          hideSettings={true}
          config={{ 
            data: data,
            columns: [
                {
                    "title": "ID",
                    "titleTooltip": "ID",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "id",
                    "width": "55",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Name",
                    "titleTooltip": "Name",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "name",
                    "width": "200",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Date",
                    "titleTooltip": "Date",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "date",
                    "width": "110",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Department",
                    "titleTooltip": "Department",
                    "showTitle": true,
                    "isCustom": false,
                    "dataIndex": "department",
                    "width": "250",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "tag",
                        "comp": {
                            "text": "{{currentCell}}",
                            "tagColors": {
                                "optionType": "manual",
                                "manual": {
                                    "manual": [
                                        {
                                            "label": "Tag1",
                                            "icon": "/icon:solid/tag",
                                            "color": "#f50"
                                        },
                                        {
                                            "label": "Tag2",
                                            "icon": "/icon:solid/tag",
                                            "color": "#2db7f5"
                                        }
                                    ]
                                },
                                "mapData": {
                                    "data": "[]",
                                    "mapData": {
                                        "color": ""
                                    }
                                }
                            }
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                }
            ],
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
        <Example
          title="Title Tooltip"
          width={800}
          hideSettings={true}
          config={{ 
            data: data,
            columns: [
                {
                    "title": "ID",
                    "titleTooltip": "ID",
                    "showTitle": true,
                    "cellTooltip": {
                        "tooltip": "{{currentCell}}"
                    },
                    "isCustom": false,
                    "dataIndex": "id",
                    "width": "55",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Name",
                    "titleTooltip": "Name",
                    "showTitle": true,
                    "cellTooltip": {
                        "tooltip": "{{currentCell}}"
                    },
                    "isCustom": false,
                    "dataIndex": "name",
                    "width": "200",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Date",
                    "titleTooltip": "Date",
                    "showTitle": true,
                    "cellTooltip": {
                        "tooltip": "{{currentCell}}"
                    },
                    "isCustom": false,
                    "dataIndex": "date",
                    "width": "110",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "text",
                        "comp": {
                            "text": "{{currentCell}}"
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                },
                {
                    "title": "Department",
                    "titleTooltip": "Department",
                    "showTitle": true,
                    "cellTooltip": {
                        "tooltip": "{{currentCell}}"
                    },
                    "isCustom": false,
                    "dataIndex": "department",
                    "width": "250",
                    "autoWidth": "fixed",
                    "render": {
                        "compType": "tag",
                        "comp": {
                            "text": "{{currentCell}}",
                            "tagColors": {
                                "optionType": "manual",
                                "manual": {
                                    "manual": [
                                        {
                                            "label": "Tag1",
                                            "icon": "/icon:solid/tag",
                                            "color": "#f50"
                                        },
                                        {
                                            "label": "Tag2",
                                            "icon": "/icon:solid/tag",
                                            "color": "#2db7f5"
                                        }
                                    ]
                                },
                                "mapData": {
                                    "data": "[]",
                                    "mapData": {
                                        "color": ""
                                    }
                                }
                            }
                        }
                    },
                    "align": "left",
                    "fixed": "close",
                    "background": "",
                    "margin": "",
                    "text": "",
                    "border": "",
                    "borderWidth": "",
                    "radius": "",
                    "textSize": "",
                    "textWeight": "normal",
                    "fontFamily": "sans-serif",
                    "fontStyle": "normal",
                    "textOverflow": "ellipsis",
                    "linkColor": "#3377ff",
                    "linkHoverColor": "",
                    "linkActiveColor": "",
                    "summaryColumns": [
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        },
                        {
                            "isCustom": false,
                            "dataIndex": "",
                            "render": {
                                "compType": "text",
                                "comp": {}
                            },
                            "align": "left",
                            "background": "",
                            "margin": "",
                            "text": "",
                            "border": "",
                            "radius": "",
                            "textSize": "",
                            "textWeight": "normal",
                            "fontFamily": "sans-serif",
                            "fontStyle": "normal",
                            "textOverflow": "ellipsis",
                            "linkColor": "#3377ff",
                            "linkHoverColor": "",
                            "linkActiveColor": ""
                        }
                    ]
                }
            ],
          }}
          blackListConfig={blackListConfig}
          compFactory={TableComp}
        />
      </ExampleGroup>
    </>
  );
}
