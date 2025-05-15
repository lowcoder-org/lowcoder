import React, { useMemo, useRef } from "react";
import ReactECharts from "echarts-for-react";

interface Props {
  data: Array<any>;
}

const UserAuthStatusChart = ({ data }: Props) => {
  const chartRef = useRef<any>(null);

  const anonKnown = useMemo(() => {
    return data.reduce((acc, e) => {
      const type = e.isAnonymous ? 'Anonymous' : 'Known';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [data]);

  const pieData = useMemo(() => {
    return Object.entries(anonKnown).map(([name, value]) => ({ name, value }));
  }, [anonKnown]);

  const series = [{
    name: 'Anonymouse',
    type: 'pie',
    radius: '50%',
    data: pieData,
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    }
  }];
  
  return (
    <ReactECharts
      ref={chartRef}
      option={{
        title: { text: "App Usage Log", left: "center" },
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        legend: { left: "left", orient: "vertical", top: "12%" }, // Ensure labels are on the left
        grid: { left: "20%", right: "4%", bottom: "3%", containLabel: true },
        series,
      }}
      // onEvents={{ dataZoom: handleChartEvents }}
      style={{ height: "400px", marginBottom: "20px" }}
    />
  );
};

export default UserAuthStatusChart;
