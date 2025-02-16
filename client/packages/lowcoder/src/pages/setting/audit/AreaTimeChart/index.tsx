import { StyledReactECharts } from "../auditContants";

const apiUsage = [
  { date: '2024-12-07', usage: 860 },
  { date: '2024-12-08', usage: 13 },
  { date: '2024-12-09', usage: 0 },
  { date: '2024-12-10', usage: 83 },
  { date: '2024-12-11', usage: 58 },
  { date: '2024-12-12', usage: 0 },
  { date: '2024-12-13', usage: 138 },
  { date: '2024-12-14', usage: 439 },
  { date: '2024-12-15', usage: 11 },
  { date: '2024-12-16', usage: 0 },
  { date: '2024-12-17', usage: 485 },
  { date: '2024-12-18', usage: 907 },
  { date: '2024-12-19', usage: 91 },
  { date: '2024-12-20', usage: 0 },
];

export const AreaTimeChart = () => {
  const options = {
    tooltip: {
      trigger: 'axis',
      position: (pt: any) => {
        return [pt[0], '10%'];
      }
    },
    title: {
      left: 'center',
      text: 'Daily API Usage'
    },
    xAxis: {
      type: 'time',
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      boundaryGap: [0, '100%']
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 20
      },
      {
        start: 0,
        end: 20
      }
    ],
    series: [
      {
        name: 'API Usage',
        type: 'line',
        smooth: true,
        symbol: 'none',
        areaStyle: {},
        data: apiUsage.map((data) => [new Date(data.date).getTime(), data.usage])
      }
    ]
  };

  return (
    <StyledReactECharts
      option={ options }
    />
  )
}