# Lowcoder Extra Components

This is the workspace for Lowcoder Extra Components like Calendar, Image Editor, Mermaid Charts and eCharts.

## Local Development preparation

Navigate your terminal or bash to your /root folder (lowcoder repository) to install Lowcoder Extra Components dependencies and the Lowcoder SDK

To develop with the Lowcoder Extra Components after you clone the Lowcoder Repository, first make sure the Lowcoder SDK is local built.

```bash
cd client/packages/lowcoder-sdk
yarn build
```

## Start

Now you can start the local dev server for Lowcoder Extra Components to develop and add your Component Plugin

```bash
cd client/packages/lowcoder-comps
yarn start
```

The local dev server will build for roughly a minute and open then a Browser Window on http://localhost:9000/ with the Lowcoder Component Builder. 

## Local development

After the local dev server is started, the Lowcoder Component Builder is prepared. A new browser window should open at http://localhost:9000 This is the Components Preview, which allows you to see your new component in action, as it would work in the Lowcoder Editor.

Data, methods and properties are visible and interactive, so you can test your Component during development. The view will get automatically refreshed.

The Lowcoder Component Builder makes the development & publishing of multiple individual components as bundle possible. Find the /src/comps folder in /lowcoder-comps. Here are existing components to find. It is suggested for new components to create a new folder. In the left navigation of the Components Preview you can switch between your components.

to see your component and include it in the processing on the development server, you have to do the folloiwing steps:

### modify /lowcoder-comps/package.json

```JSON
"yournewcomponent": {
    "name": "Your new Component name",
    "icon": "./icons/your-icon.svg",
    "description": "A Component Plugin to ...",
    "category": "itemHandling",
    "layoutInfo": {
        "w": 6,
        "h": 30
    }
}
```


Please choose one category out of:

 - dashboards
 - layout
 - forms
 - collaboration
 - projectmanagement
 - scheduling
 - documents
 - itemHandling
 - multimedia
 - integration

layoutInfo helps you to define the size (in grid-cells) of your Component in the grid for the very first moment, when a user drags your Component out of the components display on the right side in the Lowcoder Editor.

### modify /lowcoder-comps/src/index.ts

```JavaScript
Add your Component for the exported members of Lowcoder Extra Components 

import { ChartCompWithDefault } from "./comps/chartComp/chartComp";
import { ImageEditorComp } from "./comps/imageEditorComp/index";
import { CalendarComp } from "./comps/calendarComp/calendarComp";
import { MermaidComp } from "comps/mermaidComp";

import { YourComponent } from "comps/yourComponentFolder/yourComponent";

export default {
  chart: ChartCompWithDefault,
  imageEditor: ImageEditorComp,
  calendar: CalendarComp,
  mermaid: MermaidComp,

  yourcomponent: YourComponent,
};
```
Now your Plugin should be visibe and displayed in the Lowcoder Component Builder at http://localhost:9000/

## Build

When you finish development and all tests, you can build the Components to use it in runtime.

This will build the current Component Plugins into a .tgz file that you can upload.

**Before build you should change the version in package.json file.**

```bash
yarn build

# or

npm run build
```

## How to publish a Component Plugin

With the following command you can publish the script to the NPM repository:

```bash
yarn build --publish
```

This command will publis the whole Lowcoder Extra Components bundle to [NPMjs](https://www.npmjs.com/)
Make sure, you updated the Version of Lowcoder Comps before in /lowcoder-comps/package.json

## Contribute your Plugin

If you wish to contribute your plugin and persist it as general Lowcoder Extra Component, please raise a PR to our /dev branch in the Lowcoder Community-Edition Repository https://github.com/lowcoder-org/lowcoder