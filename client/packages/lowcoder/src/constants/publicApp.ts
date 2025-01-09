export const PUBLIC_APP_ID = "public_app";
export const PUBLIC_APP_ORG_ID = "645b53eb86b4c862d8ae0fb9";

export const publicAppResponse = {
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {
    headers: {} as any,
  },
  data: {
    code: 1,
    success: true,
    message: "",
    data: {
      orgCommonSettings: undefined,
      applicationDSL: {
        "ui": {
          "compType": "normal",
          "comp": {}
        },
        "refTree": {
          "value": ""
        },
        "hooks": [
          {
            "compType": "urlParams",
            "comp": {},
            "name": "url"
          },
          {
            "compType": "dayJsLib",
            "comp": {},
            "name": "dayjs"
          },
          {
            "compType": "lodashJsLib",
            "comp": {},
            "name": "_"
          },
          {
            "compType": "utils",
            "comp": {},
            "name": "utils"
          },
          {
            "compType": "message",
            "comp": {},
            "name": "message"
          },
          {
            "compType": "toast",
            "comp": {},
            "name": "toast"
          },
          {
            "compType": "localStorage",
            "comp": {},
            "name": "localStorage"
          },
          {
            "compType": "currentUser",
            "comp": {},
            "name": "currentUser"
          },
          {
            "compType": "screenInfo",
            "comp": {},
            "name": "screenInfo"
          },
          {
            "compType": "theme",
            "comp": {},
            "name": "theme"
          }
        ],
        "settings": {
          "title": "",
          "description": "",
          "category": "Business",
          "showHeaderInPublic": true,
          "themeId": "default",
          "preventAppStylesOverwriting": true,
          "disableCollision": false,
          "lowcoderCompVersion": "latest",
          "maxWidth": {
            "dropdown": "1920",
            "input": 0
          },
          "gridRowCount": "Infinity",
          "gridPaddingX": "20",
          "gridPaddingY": "20"
        },
        "preload": {
          "script": "",
          "css": "",
          "globalCSS": ""
        }
      },
      moduleDSL: {},
      applicationInfoView: {
        "orgId": "",
        "applicationId": PUBLIC_APP_ID,
        "name": "Public App",
        "createAt": 1735651262539,
        "createBy": "",
        "role": "owner",
        "applicationType": 1,
        "applicationStatus": "NORMAL",
        "folderId": '',
        "lastViewTime": 0,
        "lastModifyTime": 1735747724691,
        "lastEditedAt": 1735737886323,
        "folder": false,
        "extra": {},
        "editingUserId": "",
      },
    }
  }
};

export const publicAppJSDatasourceResponse = {
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {
    headers: {} as any,
  },
  data: {
    code: 1,
    data: [],
    message: "",
    success: true,
    total: 0,
  }
};