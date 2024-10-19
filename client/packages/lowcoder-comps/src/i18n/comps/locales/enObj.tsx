import { I18nObjects } from "./types";
import { chartColorPalette } from "lowcoder-sdk";


const defaultMapData = {
  tooltip: {
    trigger: "item"
  },
  animation: true,
  series: [
    {
      name: 'Population',
      type: 'scatter',
      coordinateSystem: 'gmap',
      itemStyle: {
        color: "#00c1de"
      },
      data: [
        { "name":"Azerbaijan","value":[47.395,40.43,8352021] },
        { "name":"Albania","value":[20.068,41.143,3153731] },
        { "name":"Armenia","value":[44.563,40.534,3017661] },
        { "name":"Bosnia and Herzegovina","value":[17.786,44.169,3915238] },
        { "name":"Bulgaria","value":[25.231,42.761,7744591] },
        { "name":"Cyprus","value":[33.219,35.043,836321] },
        { "name":"Denmark","value":[9.264,56.058,5416945] },
        { "name":"Ireland","value":[-8.152,53.177,4143294] },
        { "name":"Estonia","value":[25.793,58.674,1344312] },
        { "name":"Austria","value":[14.912,47.683,8291979] },
        { "name":"Czech Republic","value":[15.338,49.743,10191762] },
        { "name":"Finland","value":[26.272,64.504,5246004] },
        { "name":"France","value":[2.55,46.565,60990544] },
        { "name":"Georgia","value":[43.518,42.176,4473409] },
        { "name":"Germany","value":[9.851,51.11,82652369] },
        { "name":"Greece","value":[21.766,39.666,11099737] },
        { "name":"Croatia","value":[16.693,45.723,455149] },
        { "name":"Hungary","value":[19.134,47.07,10086387] },
        { "name":"Iceland","value":[-18.48,64.764,295732] },
        { "name":"Israel","value":[34.851,31.026,6692037] },
        { "name":"Italy","value":[12.8,42.7,5864636] },
        { "name":"Latvia","value":[25.641,56.858,2301793] },
        { "name":"Belarus","value":[28.047,53.54,9795287] },
        { "name":"Lithuania","value":[23.897,55.336,3425077] },
        { "name":"Slovakia","value":[19.491,48.707,5386995] },
        { "name":"Liechtenstein","value":[9.555,47.153,34598] },
        { "name":"The former Yugoslav Republic of Macedonia","value":[21.698,41.6,2033655] },
        { "name":"Malta","value":[14.442,35.89,402617] },
        { "name":"Belgium","value":[4.664,50.643,10398049] },
        { "name":"Faroe Islands","value":[-6.864,62.05,48205] },
        { "name":"Andorra","value":[1.576,42.549,73483] },
        { "name":"Luxembourg","value":[6.088,49.771,456613] },
        { "name":"Monaco","value":[7.412,43.75,325] },
        { "name":"Montenegro","value":[19.254,42.792,607969] },
        { "name":"Netherlands","value":[5.389,52.077,1632769] },
        { "name":"Norway","value":[8.74,61.152,4638836] },
        { "name":"Poland","value":[19.401,52.125,38195558] },
        { "name":"Portugal","value":[-8.058,40.309,10528226] },
        { "name":"Romania","value":[24.969,45.844,21627557] },
        { "name":"Republic of Moldova","value":[28.599,47.193,3876661] },
        { "name":"Slovenia","value":[14.827,46.124,1999425] },
        { "name":"Spain","value":[-3.649,40.227,43397491] },
        { "name":"Sweden","value":[15.27,62.011,9038049] },
        { "name":"Switzerland","value":[7.908,46.861,7424389] },
        { "name":"Turkey","value":[35.179,39.061,72969723] },
        { "name":"United Kingdom","value":[-1.6,53,60244834] },
        { "name":"Ukraine","value":[31.388,49.016,46917544] },
        { "name":"San Marino","value":[12.46,43.942,30214] },
        { "name":"Serbia","value":[20.806,44.032,9863026] },
        { "name":"Holy See (Vatican City)","value":[12.451,41.904,783] },
        { "name":"Russia","value":[96.689,61.988,143953092]}
      ],
      encode: {
        value: 2,
        lng: 0,
        lat: 1
      }
    }
  ]
}

export const enObj: I18nObjects = {
  defaultDataSource: [
    {
      date: "2021-09",
      department: "Administration",
      spending: 9003,
      budget: 8000,
    },
    {
      date: "2021-09",
      department: "Finance",
      spending: 3033,
      budget: 4000,
    },
    {
      date: "2021-09",
      department: "Sales",
      spending: 9230,
      budget: 8000,
    },
    {
      date: "2021-10",
      department: "Administration",
      spending: 13032,
      budget: 15000,
    },
    {
      date: "2021-10",
      department: "Finance",
      spending: 2300,
      budget: 5000,
    },
    {
      date: "2021-10",
      department: "Sales",
      spending: 7323.5,
      budget: 8000,
    },
    {
      date: "2021-11",
      department: "Administration",
      spending: 13000,
      budget: 16023,
    },
    {
      date: "2021-11",
      department: "Finance",
      spending: 3569.5,
      budget: 3000,
    },
    {
      date: "2021-11",
      department: "Sales",
      spending: 10000,
      budget: 9932,
    },
    {
      date: "2021-12",
      department: "Administration",
      spending: 18033,
      budget: 20000,
    },
    {
      date: "2021-12",
      department: "Finance",
      spending: 4890,
      budget: 4500,
    },
    {
      date: "2021-12",
      department: "Sales",
      spending: 9322,
      budget: 8000,
    },
  ],

  defaultEchartsJsonOption: {
    data: [
      { value: 100, name: "Show",color:'#fc8452' },
      { value: 80, name: "Click" ,color:'#9a60b4'},
      { value: 60, name: "Visit" ,color:'#fac858'},
      { value: 40, name: "Query" ,color:'#ee6666'},
      { value: 20, name: "Buy" ,color:'#3ba272'},
        ],
  },
  defaultFunnelChartOption: {
    data: [
      { value: 100, name: "Show",color:'#fc8452' },
      { value: 80, name: "Click" ,color:'#9a60b4'},
      { value: 60, name: "Visit" ,color:'#fac858'},
      { value: 40, name: "Query" ,color:'#ee6666'},
      { value: 20, name: "Buy" ,color:'#3ba272'},
        ],
  },
  defaultGaugeChartOption: {
    data: [
      { value: 60, name: "Completed",color:'#fc8452' }
    ]
  },
  defaultSankeyChartOption: {
    data: [
      {name: "Show"},
      {name: "Click"},
      {name: "Visit"},
      {name: "Query"},
      {name: "Buy"}
    ],
    links: [
      {source: "Show", target: "Click", value: 80},
      {source: "Click", target: "Visit", value: 60},
      {source: "Visit", target: "Query", value: 40},
      {source: "Query", target: "Buy", value: 20}
    ]
  },
  defaultCandleStickChartOption: {
    xAxis: {
    data: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"]
  },
    data:[
        [100, 200, 50, 150],
        [120, 220, 80, 180],
        [80, 150, 60, 130],
        [130, 230, 110, 190],
        [90, 180, 70, 160]
      ]
  },
  defaultRadarChartOption: {
    indicator: [
        { name: "Indicator 1", max: 100 },
        { name: "Indicator 2", max: 100 },
        { name: "Indicator 3", max: 100 },
        { name: "Indicator 4", max: 100 },
        { name: "Indicator 5", max: 100 }
    ],
    series: [
       {
      "name": "Data 1",
      "data": [
        {
          "value": [90, 80, 70, 60, 50],
          "name": "Data 1"
        }
      ]
      },
      {
      "name": "Data 2",
      "data": [
        {
          "value": [70, 60, 50, 40, 30],
          "name": "Data 2"
        }
      ]
    }
    ]
  },
  defaultHeatmapChartOption: {
    xAxis: {
    "data": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  },
  yAxis: {
    "data": ["Morning", "Afternoon", "Evening"]
    },
  data: [
        [0, 0, 10],
        [0, 1, 20],
        [0, 2, 30],
        [1, 0, 40],
        [1, 1, 50],
        [1, 2, 60],
        [2, 0, 70],
        [2, 1, 80],
        [2, 2, 90],
        [3, 0, 100],
        [3, 1, 90],
        [3, 2, 80],
        [4, 0, 70],
        [4, 1, 60],
        [4, 2, 50],
        [5, 0, 40],
        [5, 1, 30],
        [5, 2, 20],
        [6, 0, 10],
        [6, 1, 0],
        [6, 2, 10]
      ]
  },
  defaultGraphChartOption: {
     categories: [
        {name: "Nodes"},
        {name: "Edges"}
      ],
      nodes: [
        {name: "Node 1", category: 0},
        {name: "Node 2", category: 0},
        {name: "Node 3", category: 0}
      ],
      links: [
        {source: "Node 1", target: "Node 2", category: 1},
        {source: "Node 2", target: "Node 3", category: 1}
      ]
  },
  defaultTreeChartOption: {
    data: [{
        name: "Parent",
        children: [
          {
            name: "Child 1",
            children: [
              { name: "Child 1-1" },
              { name: "Child 1-2" }
            ]
          },
          {
            name: "Child 2",
            children: [
              { name: "Child 2-1" },
              { name: "Child 2-2" }
            ]
          }
        ]
      }]
  },
  defaultTreemapChartOption: {
    data: [
        {
          name: 'nodeA',
          value: 10,
          children: [
            {
              name: 'nodeAa',
              value: 4,
            },
            {
              name: 'nodeAb',
              value: 6
            }
          ]
        },
        {
          name: 'nodeB',
          value: 20,
          children: [
            {
              name: 'nodeBa',
              value: 20,
              children: [
                {
                  name: 'nodeBa1',
                  value: 20
                }
              ]
            }
          ]
        }
      ]
  },
  defaultSunburstChartOption: {
    data: [
       {
          name: "Grandparent",
          children: [
            {
              name: "Parent A",
              children: [
                {name: "Child A1", value: 10},
                {name: "Child A2", value: 20}
              ]
            },
            {
              name: "Parent B",
              children: [
                {name: "Child B1", value: 15},
                {name: "Child B2", value: 25}
              ]
            }
          ]
        }
    ]
  },
  defaultCalendarChartOption: {
    data:[
        ["2022-01-01", 10],
        ["2022-02-05", 30],
        ["2022-03-15", 50],
        ["2022-04-20", 70],
        ["2022-05-25", 90],
        ["2022-06-30", 100],
        ["2022-07-10", 80],
        ["2022-08-20", 60],
        ["2022-09-25", 40],
        ["2022-10-30", 20],
        ["2022-11-05", 5]
      ]
  },
  defaultThemeriverChartOption: {
    data: [
        ["2024-01-01", 10, "Category A"],
        ["2024-01-02", 15, "Category A"],
        ["2024-01-03", 20, "Category A"],
        ["2024-01-04", 25, "Category A"],
        ["2024-01-05", 30, "Category A"],
        ["2024-01-06", 35, "Category A"],
        ["2024-01-07", 40, "Category A"],
        ["2024-01-08", 45, "Category A"],
        ["2024-01-09", 50, "Category A"],
        ["2024-01-10", 55, "Category A"],
        ["2024-01-01", 15, "Category B"],
        ["2024-01-02", 20, "Category B"],
        ["2024-01-03", 25, "Category B"],
        ["2024-01-04", 30, "Category B"],
        ["2024-01-05", 35, "Category B"],
        ["2024-01-06", 40, "Category B"],
        ["2024-01-07", 45, "Category B"],
        ["2024-01-08", 50, "Category B"],
        ["2024-01-09", 55, "Category B"],
        ["2024-01-10", 60, "Category B"]
      ]
  },

  defaultMapJsonOption: defaultMapData,
};
