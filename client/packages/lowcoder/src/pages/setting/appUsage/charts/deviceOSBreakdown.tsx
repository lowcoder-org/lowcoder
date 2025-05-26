import React, { useMemo, useRef } from "react";
import ReactECharts from "echarts-for-react";
import dayjs from "dayjs";
import { debounce } from "lodash";
import { trans } from "i18n";

interface Props {
  data: Array<any>;
}

const DeviceOSBreakdownChart = ({ data}: Props) => {
  const chartRef = useRef<any>(null);

  const deviceOs = useMemo(() => {
    return data.reduce((acc, e) => {
      const device = e.deviceClass || 'Unknown';
      const os = e.operatingSystemName || 'Unknown';
      acc[device] = acc[device] || {};
      acc[device][os] = (acc[device][os] || 0) + 1;
      return acc;
    }, {} as Record<string, Record<string, number>>);
  }, []);

  // Get unique device types
  const deviceTypeSet = [...new Set(data.map((log: any) => log.deviceClass || 'Unkown'))];
  
  // Get unique os types
  const osTypeSet = [...new Set(data.map((log: any) => log.operatingSystemName || 'Unkown'))];

  // Prepare series data for each event type
  const series = osTypeSet.map((osType) => ({
    name: osType,
    type: "bar",
    stack: "total",
    data: Object.keys(deviceOs).map((deviceType: string) => deviceOs[deviceType][osType]),
  }));
  
  return (
    <ReactECharts
      ref={chartRef}
      option={{
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        legend: { left: "left", orient: "vertical", top: "12%" }, // Ensure labels are on the left
        grid: { left: "20%", right: "4%", bottom: "3%", containLabel: true },
        xAxis: {
          type: "category",
          data: deviceTypeSet,
          axisLabel: { rotate: 45 },
        },
        yAxis: {
          type: "value",
        },
        series,
      }}
      // onEvents={{ dataZoom: handleChartEvents }}
      style={{ height: "400px", marginBottom: "20px" }}
    />
  );
};

export default DeviceOSBreakdownChart;
