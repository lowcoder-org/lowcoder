import { I18nObjects } from "./types";
import { chartColorPalette } from "lowcoder-sdk";


const defaultMapData = {
  tooltip: {
    trigger: "item"
  },
  animation: true,
  series: [
    {
      type: 'scatter',
      coordinateSystem: 'gmap',
      data: [[120, 30, 8], [120.1, 30.2, 20]],
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
