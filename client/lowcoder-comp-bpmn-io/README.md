# lowcoder BPMN plugin
This plugin enables the usage of [bpmn-js](https://bpmn-js.io) within lowcoder. To use it open you lowcoder environment and goto plugins and add: **lowcoder_bpmn_plugin**

Properties explained
* **xml**: contains the xml of the bpmn flow. When you load it from a query `{{query1.data.length>0 ? query1.data[0].values : ""}}` then you can used "{{myvalues}}" within the stored xml. Then the {{myvalues}} will be replaces with the one within values otherwise it is removed
* **values**: Object contain values which will be replaced when using a query. Only works in none designer mode
* **Designer mode**: should we use desinger mode. The onChange event is trigger on editing. The data is available by using referencing the `.xml` of the component
* **Image Download**: When enabled you can download the image as svg
* **Download Name**: The name of the image to download
* **onChange**: The event triggers in designer mode when the xml has changed

![bpmn-js](bpmn-js.gif)

## Start

Start dev server to develop your comp lib.

```bash
yarn start

# or

npm start
```

## Build

Build current comp lib into a .tgz file that you can upload it to the Lowcoder Comp Market.

Before build you should change the version in package.json file.

```bash
yarn build

# or

npm run build
```

## Publish
To publish your plugin on NPM, use following command.
```bash
yarn build_publish

# or

npm run build_publish
```
