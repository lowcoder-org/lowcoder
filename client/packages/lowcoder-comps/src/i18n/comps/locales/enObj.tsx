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
    title: {
      text: "Funnel Chart",
      left: "center",
    },
    backgroundColor: "#ffffff",
    color: chartColorPalette,
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b} : {c}%",
    },
    legend: {
      data: ["Show", "Click", "Visit", "Query", "Buy"],
      top: "bottom",
    },
    series: [
      {
        name: "Funnel",
        type: "funnel",
        left: "10%",
        top: 60,
        bottom: 60,
        width: "80%",
        min: 0,
        max: 100,
        gap: 2,
        label: {
          show: true,
          position: "inside",
        },
        data: [
          { value: 100, name: "Show" },
          { value: 80, name: "Click" },
          { value: 60, name: "Visit" },
          { value: 40, name: "Query" },
          { value: 20, name: "Buy" },
        ],
      },
    ],
  },

  defaultMapJsonOption: defaultMapData,
};
