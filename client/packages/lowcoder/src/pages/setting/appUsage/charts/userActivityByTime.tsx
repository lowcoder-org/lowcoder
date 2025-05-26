import React, { useRef } from "react";
import ReactECharts from "echarts-for-react";
import dayjs from "dayjs";
import { debounce } from "lodash";
import { trans } from "i18n";

interface Props {
  data: Array<any>;
  setDateRange: (range: { fromTimestamp: string; toTimestamp: string }) => void;
}

const UserActivityByTimeChart = ({ data, setDateRange }: Props) => {
  const chartRef = useRef<any>(null);

  const debouncedSetDateRange = useRef(
    debounce((fromTimestamp: string, toTimestamp: string) => {
      setDateRange({ fromTimestamp, toTimestamp });
    }, 500) // Delays fetching only after zooming stops
  ).current;

  // Extract min/max dates from the data
  const allDates = data.map((log) => log.eventTime && dayjs(log.eventTime).format("YYYY-MM-DD"));
  const minDate = allDates.length ? dayjs(Math.min(...allDates.map((d) => new Date(d).getTime()))) : dayjs().subtract(7, "days");
  const maxDate = allDates.length ? dayjs(Math.max(...allDates.map((d) => new Date(d).getTime()))) : dayjs();

  // Generate full date range including missing days
  const fullDateRange: string[] = [];
  let currentDate = minDate;
  while (currentDate.isBefore(maxDate) || currentDate.isSame(maxDate, "day")) {
    fullDateRange.push(currentDate.format("YYYY-MM-DD"));
    currentDate = currentDate.add(1, "day");
  }

  // Group data by date and eventType
  const timeSeriesData = data.reduce((acc: any, log: any) => {
    const eventTime = log.eventTime ? new Date(log.eventTime) : null;
    if (eventTime && !isNaN(eventTime.getTime())) {
      const date = eventTime.toISOString().split("T")[0]; // Extract date part
      if (!acc[date]) acc[date] = 0;
      acc[date] = acc[date] + 1;
    }
    return acc;
  }, {});

  // Prepare series data for each event type
  const series = [{
    name: "App Views",
    type: "line",
    stack: "total",
    data: fullDateRange.map((date) => timeSeriesData[date] || 0), // Fill gaps with 0
    itemStyle: {
      color: "#1890ff",
    },
  }];

  const handleChartEvents = (params: any) => {
    if (params.start !== undefined && params.end !== undefined) {
      const startIndex = Math.floor((params.start / 100) * (fullDateRange.length - 1));
      const endIndex = Math.floor((params.end / 100) * (fullDateRange.length - 1));
  
      const fromDate = new Date(fullDateRange[startIndex] || fullDateRange[0]); // Keep start of day
      const toDate = new Date(fullDateRange[endIndex] || fullDateRange[fullDateRange.length - 1]);

      toDate.setHours(23, 59, 59, 999);
  
      const fromTimestamp = fromDate.toISOString();
      const toTimestamp = toDate.toISOString();
      debouncedSetDateRange(fromTimestamp, toTimestamp);
    }
  };
  
  return (
    <ReactECharts
      ref={chartRef}
      option={{
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        legend: { left: "left", orient: "vertical", top: "12%" }, // Ensure labels are on the left
        grid: { left: "20%", right: "4%", bottom: "3%", containLabel: true },
        xAxis: {
          type: "category",
          data: fullDateRange,
          axisLabel: { rotate: 45 },
        },
        yAxis: {
          type: "value",
        },
        dataZoom: [
          {
            type: "slider",
            xAxisIndex: 0,
            filterMode: "weakFilter", 
            show: true,
            start: 0,
            end: 100,
            realtime: false, 
          },
          {
            type: "inside",
            xAxisIndex: 0,
            realtime: false, 
          },
        ],
        series,
      }}
      onEvents={{ dataZoom: handleChartEvents }}
      style={{ height: "400px", marginBottom: "20px" }}
    />
  );
};

export default UserActivityByTimeChart;
