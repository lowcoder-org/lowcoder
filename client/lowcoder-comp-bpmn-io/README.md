# Using the Lowcoder BPMN.io plugin

![bpmn-js](https://github.com/sjhoeksma/lowcoder/blob/lowcoder-bpmn-plugin/client/lowcoder-comp-bpmn-io/bpmn-js.gif?raw=true)
This plugin enables the usage of [bpmn-js](https://bpmn-js.io) within lowcoder. To use this plugin. Open your lowcoder environment goto the app. Select insert tab, extensions and plugins and add: **lowcoder-comp-bpmn-io**

Edit properties explained:
* **xml**: contains the xml of the bpmn flow. When you load it from a query in none designer mode, for example by `{{query1.data.length>0 ? query1.data[0].xml : ""}}` you can replace variables ex."{{myvalues}}" stored within xml. For example the {{myvalues}} will be replaces with the one within **values** otherwise it is removed
* **values**: Object contain values which will be replaced when using a query. Only works in none designer mode
* **Designer mode**: should we use desinger mode. The onChange event is trigger on editing. The data is available by using referencing `.xml` of the component
* **Image Download**: when enabled you can download the image as svg using the icon in upper rightcorner
* **Download Name**: The name of the image to download
* **onChange**: This event triggers in designer mode when the xml has changed. You can access the changed xml by referencing `.xml` of the component
* **Show BPMN.io logo**: You can turn of the BPMN.io logo, but make sure your are [entitled](https://forum.bpmn.io/t/license-questions/85)
