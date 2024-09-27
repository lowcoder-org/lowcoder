# Day.js Date handling

Day.js is a lightweight JavaScript library for parsing, validating, manipulating, and formatting dates and times, designed to be a simpler and smaller alternative to Moment.js.&#x20;

Day.js is already included in Lowcoder, so you can directly begin using it to work with dates and times by creating Day.js objects using `dayjs()`. This function accepts various formats, including strings, Date objects, and UNIX timestamps, allowing for flexible date and time manipulation such as adding or subtracting time, formatting dates, and comparing dates.

{% hint style="info" %}
You can read how to use Day.js in their excellent Documentation here: [https://day.js.org/docs/en/get-set/get](https://day.js.org/docs/en/get-set/get)
{% endhint %}

### Day.js Plugins

To enhance the functionality of Day.js, developers can utilize its plugin system, which allows for the inclusion of additional features not available in the core library. Plugins can be added by including their scripts in the project and then registering them with Day.js using `dayjs.extend()`. For instance, if a developer wants to use the `advancedFormat` plugin, they would include the plugin script and then call `window.dayjs.extend(window.dayjs_plugin_advancedFormat)` to make the advanced formatting options available.&#x20;

```javascript
// in your JavaScript for Page or Workspace Level first require the plugin
var advancedFormat = require('dayjs/plugin/advancedFormat');

// then you can extend Day.js by it.
window.dayjs.extend(window.dayjs_plugin_advancedFormat);
```

This modular approach allows you to keep your Apps lightweight by only including the needed features.&#x20;

{% hint style="info" %}
An overview of Day.js Plugins: [https://day.js.org/docs/en/plugin/plugin](https://day.js.org/docs/en/plugin/plugin)
{% endhint %}

When using plugins, it's important to ensure plugins are loaded and extended after the Day.js library is initialized. We have seen cases when this is not automatically the case and so it can mean making use of an additional **JavaScript Query** to make sure the Plugin is loaded and instantiated.

{% embed url="https://app.supademo.com/demo/T6c6mf3uyXdWj7_w-J4o7" %}

{% hint style="info" %}
Day.js plugins on CDNjs: [https://cdnjs.com/libraries/dayjs](https://cdnjs.com/libraries/dayjs)
{% endhint %}

Now you can use Day.js Plugins at all places in Lowcoder that support \{{ \}} Handlebar notation.

```javascript
Quarter: {{dayjs().format('Q')}}

Day of Month with ordinal: {{dayjs().format('Do')}}

Week of year: {{dayjs().format('w')}}

{{dayjs('2013-11-18 11:55').tz('Asia/Taipei')}}

```

### A demo App with Day.js and Plugin usage.

{% file src="../../.gitbook/assets/DayJs with Plugin.json" %}
