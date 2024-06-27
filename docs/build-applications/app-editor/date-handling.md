# Date handling

Day.js is a lightweight JavaScript library for parsing, validating, manipulating, and formatting dates and times, designed to be a simpler and smaller alternative to Moment.js.&#x20;

Day.js is already included in Lowcoder, so you can directly begin using it to work with dates and times by creating Day.js objects using `dayjs()`. This function accepts various formats, including strings, Date objects, and UNIX timestamps, allowing for flexible date and time manipulation such as adding or subtracting time, formatting dates, and comparing dates.

{% hint style="info" %}
You can read how to use Day.js in their excellent Documentation here: [https://day.js.org/docs/en/get-set/get](https://day.js.org/docs/en/get-set/get)
{% endhint %}

### Day.js Plugins

To enhance Day.js's functionality, developers can utilize its plugin system, which allows for the inclusion of additional features not available in the core library.&#x20;

Since Lowcoder Version 2.3.1, we load all DayJS plugins automatically

{% hint style="info" %}
An overview of Day.js Plugins: [https://day.js.org/docs/en/plugin/plugin](https://day.js.org/docs/en/plugin/plugin)
{% endhint %}

You can use Day.js Plugins at all places in Lowcoder that support \{{ \}} Handlebar notation.

```javascript
Quarter: {{dayjs().format('Q')}}

Day of Month with ordinal: {{dayjs().format('Do')}}

Week of year: {{dayjs().format('w')}}

{{dayjs('2013-11-18 11:55').tz('Asia/Taipei')}}

```

