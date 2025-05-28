import React, { useMemo, useRef } from "react";
import ReactECharts from "echarts-for-react";
import dayjs from "dayjs";
import { debounce } from "lodash";
import { trans } from "i18n";

interface Props {
  data: Array<any>;
}

const BrowserEngineBreakdownChart = ({ data}: Props) => {
  const chartRef = useRef<any>(null);

  const browserEngine = useMemo(() => {
    return data.reduce((acc, e) => {
      const browser = e.agentName || 'Unknown';
      const engine = e.layoutEngineName || 'Unknown';
      acc[browser] = acc[browser] || {};
      acc[browser][engine] = (acc[browser][engine] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, []);

  // Get unique browser types
  const browserTypeSet = [...new Set(data.map((log: any) => log.agentName || 'Unkown'))];
  
  // Get unique engine types
  const engineTypeSet = [...new Set(data.map((log: any) => log.layoutEngineName || 'Unkown'))];

  // Prepare series data for each event type
  const series = engineTypeSet.map((engineType) => ({
    name: engineType,
    type: "bar",
    stack: "total",
    data: Object.keys(browserEngine).map((browserType: string) => browserEngine[browserType][engineType]),
  }));
  
  return (
    <ReactECharts
      ref={chartRef}
      option={{
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        legend: { left: "left", orient: "vertical", top: "12%" }, 
        grid: { left: "20%", right: "4%", bottom: "3%", containLabel: true },
        xAxis: {
          type: "value",
        },
        yAxis: {
          type: "category",
          data: browserTypeSet,
          axisLabel: { rotate: 45 },
        },
        series,
      }}
      // onEvents={{ dataZoom: handleChartEvents }}
      style={{ height: "400px", marginBottom: "20px" }}
    />
  );
};

export default BrowserEngineBreakdownChart;
