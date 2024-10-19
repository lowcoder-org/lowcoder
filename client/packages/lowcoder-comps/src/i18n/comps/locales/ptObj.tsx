import { I18nObjects } from "./types";
import { chartColorPalette } from "lowcoder-sdk";


const defaultMapData = {
  tooltip: {
    trigger: "item"
  },
  animation: true,
  series: [
    {
      name: 'População',
      type: 'scatter',
      coordinateSystem: 'gmap',
      itemStyle: {
        color: "#00c1de"
      },
      data: [
        { "name":"Azerbaijão","value":[47.395,40.43,8352021] },
        { "name":"Albania","value":[20.068,41.143,3153731] },
        { "name":"Armenia","value":[44.563,40.534,3017661] },
        { "name":"Bosnia e Herzegovina","value":[17.786,44.169,3915238] },
        { "name":"Bulgaria","value":[25.231,42.761,7744591] },
        { "name":"Cyprus","value":[33.219,35.043,836321] },
        { "name":"Denmark","value":[9.264,56.058,5416945] },
        { "name":"Ireland","value":[-8.152,53.177,4143294] },
        { "name":"Estonia","value":[25.793,58.674,1344312] },
        { "name":"Áustria","value":[14.912,47.683,8291979] },
        { "name":"República Checa","value":[15.338,49.743,10191762] },
        { "name":"Finlândia","value":[26.272,64.504,5246004] },
        { "name":"França","value":[2.55,46.565,60990544] },
        { "name":"Georgia","value":[43.518,42.176,4473409] },
        { "name":"Alemanha","value":[9.851,51.11,82652369] },
        { "name":"Grécia","value":[21.766,39.666,11099737] },
        { "name":"Croácia","value":[16.693,45.723,455149] },
        { "name":"Hungria","value":[19.134,47.07,10086387] },
        { "name":"Islândia","value":[-18.48,64.764,295732] },
        { "name":"Israel","value":[34.851,31.026,6692037] },
        { "name":"Itália","value":[12.8,42.7,5864636] },
        { "name":"Látvia","value":[25.641,56.858,2301793] },
        { "name":"Belarus","value":[28.047,53.54,9795287] },
        { "name":"Lituânia","value":[23.897,55.336,3425077] },
        { "name":"Slovakia","value":[19.491,48.707,5386995] },
        { "name":"Liechtenstein","value":[9.555,47.153,34598] },
        { "name":"Macedonia","value":[21.698,41.6,2033655] },
        { "name":"Malta","value":[14.442,35.89,402617] },
        { "name":"Bélgica","value":[4.664,50.643,10398049] },
        { "name":"Ilhas Faroe","value":[-6.864,62.05,48205] },
        { "name":"Andorra","value":[1.576,42.549,73483] },
        { "name":"Luxemburgo","value":[6.088,49.771,456613] },
        { "name":"Mônaco","value":[7.412,43.75,325] },
        { "name":"Montenegro","value":[19.254,42.792,607969] },
        { "name":"Holanda","value":[5.389,52.077,1632769] },
        { "name":"Noruega","value":[8.74,61.152,4638836] },
        { "name":"Polônia","value":[19.401,52.125,38195558] },
        { "name":"Portugal","value":[-8.058,40.309,10528226] },
        { "name":"Romania","value":[24.969,45.844,21627557] },
        { "name":"Moldova","value":[28.599,47.193,3876661] },
        { "name":"Eslovenia","value":[14.827,46.124,1999425] },
        { "name":"Espanha","value":[-3.649,40.227,43397491] },
        { "name":"Suécia","value":[15.27,62.011,9038049] },
        { "name":"Suíça","value":[7.908,46.861,7424389] },
        { "name":"Turquia","value":[35.179,39.061,72969723] },
        { "name":"Reino Unido","value":[-1.6,53,60244834] },
        { "name":"Ucrânia","value":[31.388,49.016,46917544] },
        { "name":"São Marino","value":[12.46,43.942,30214] },
        { "name":"Sérbia","value":[20.806,44.032,9863026] },
        { "name":"Cidade do Vaticano","value":[12.451,41.904,783] },
        { "name":"Rússia","value":[96.689,61.988,143953092]}
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
      department: "Administração",
      spending: 9003,
      budget: 8000,
    },
    {
      date: "2021-09",
      department: "Finanças",
      spending: 3033,
      budget: 4000,
    },
    {
      date: "2021-09",
      department: "Vendas",
      spending: 9230,
      budget: 8000,
    },
    {
      date: "2021-10",
      department: "Administração",
      spending: 13032,
      budget: 15000,
    },
    {
      date: "2021-10",
      department: "Finanças",
      spending: 2300,
      budget: 5000,
    },
    {
      date: "2021-10",
      department: "Vendas",
      spending: 7323.5,
      budget: 8000,
    },
    {
      date: "2021-11",
      department: "Administração",
      spending: 13000,
      budget: 16023,
    },
    {
      date: "2021-11",
      department: "Finanças",
      spending: 3569.5,
      budget: 3000,
    },
    {
      date: "2021-11",
      department: "Vendas",
      spending: 10000,
      budget: 9932,
    },
    {
      date: "2021-12",
      department: "Administração",
      spending: 18033,
      budget: 20000,
    },
    {
      date: "2021-12",
      department: "Finanças",
      spending: 4890,
      budget: 4500,
    },
    {
      date: "2021-12",
      department: "Vendas",
      spending: 9322,
      budget: 8000,
    },
  ],

  defaultEchartsJsonOption: {
    data: [
      { value: 100, name: "Mostrar",color:'#fc8452' },
      { value: 80, name: "Clicar" ,color:'#9a60b4'},
      { value: 60, name: "Visitar" ,color:'#fac858'},
      { value: 40, name: "Query" ,color:'#ee6666'},
      { value: 20, name: "Comprar" ,color:'#3ba272'},
        ],
  },
  defaultFunnelChartOption: {
    data: [
      { value: 100, name: "Mostrar",color:'#fc8452' },
      { value: 80, name: "Clicar" ,color:'#9a60b4'},
      { value: 60, name: "Visitar" ,color:'#fac858'},
      { value: 40, name: "Query" ,color:'#ee6666'},
      { value: 20, name: "Comprar" ,color:'#3ba272'},
        ],
  },
  defaultGaugeChartOption: {
    data: [
      { value: 60, name: "Completed",color:'#fc8452' }
    ]
  },
  defaultSankeyChartOption: {
    data: [
      {name: "Mostrar"},
      {name: "Clicar"},
      {name: "Visitar"},
      {name: "Query"},
      {name: "Comprar"}
    ],
    links: [
      {source: "Mostrar", target: "Clicar", value: 80},
      {source: "Clicar", target: "Visitar", value: 60},
      {source: "Visitar", target: "Query", value: 40},
      {source: "Query", target: "Comprar", value: 20}
    ]
  },
  defaultCandleStickChartOption: {
    xAxis: {
    data: ["Dia 1", "Dia 2", "Dia 3", "Dia 4", "Dia 5"]
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
        { name: "Indicador 1", max: 100 },
        { name: "Indicador 2", max: 100 },
        { name: "Indicador 3", max: 100 },
        { name: "Indicador 4", max: 100 },
        { name: "Indicador 5", max: 100 }
    ],
    series: [
       {
      "name": "Dado 1",
      "data": [
        {
          "value": [90, 80, 70, 60, 50],
          "name": "Dado 1"
        }
      ]
      },
      {
      "name": "Dado 2",
      "data": [
        {
          "value": [70, 60, 50, 40, 30],
          "name": "Dado 2"
        }
      ]
    }
    ]
  },
  defaultHeatmapChartOption: {
    xAxis: {
    "data": ["Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado", "Domingo"]
  },
  yAxis: {
    "data": ["Manhã", "Tarde", "Noite"]
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
        {name: "Módulos"},
        {name: "Bordas"}
      ],
      nodes: [
        {name: "Módulo 1", category: 0},
        {name: "Módulo 2", category: 0},
        {name: "Módulo 3", category: 0}
      ],
      links: [
        {source: "Módulo 1", target: "Módulo 2", category: 1},
        {source: "Módulo 2", target: "Módulo 3", category: 1}
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
          name: "Avô",
          children: [
            {
              name: "Pai A",
              children: [
                {name: "Filho A1", value: 10},
                {name: "Filho A2", value: 20}
              ]
            },
            {
              name: "Pai B",
              children: [
                {name: "Filho B1", value: 15},
                {name: "Filho B2", value: 25}
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
        ["2024-01-01", 10, "Categoria A"],
        ["2024-01-02", 15, "Categoria A"],
        ["2024-01-03", 20, "Categoria A"],
        ["2024-01-04", 25, "Categoria A"],
        ["2024-01-05", 30, "Categoria A"],
        ["2024-01-06", 35, "Categoria A"],
        ["2024-01-07", 40, "Categoria A"],
        ["2024-01-08", 45, "Categoria A"],
        ["2024-01-09", 50, "Categoria A"],
        ["2024-01-10", 55, "Categoria A"],
        ["2024-01-01", 15, "Categoria B"],
        ["2024-01-02", 20, "Categoria B"],
        ["2024-01-03", 25, "Categoria B"],
        ["2024-01-04", 30, "Categoria B"],
        ["2024-01-05", 35, "Categoria B"],
        ["2024-01-06", 40, "Categoria B"],
        ["2024-01-07", 45, "Categoria B"],
        ["2024-01-08", 50, "Categoria B"],
        ["2024-01-09", 55, "Categoria B"],
        ["2024-01-10", 60, "Categoria B"]
      ]
  },

  defaultMapJsonOption: defaultMapData,
};
