import React, { useRef } from "react";
import ReactECharts from "echarts-for-react";
import dayjs from "dayjs";
import { debounce } from "lodash";

interface Props {
  data: Array<any>;
  eventTypeLabels: any;
  eventTypes: Array<{ value: string; color: string }>; 
  setDateRange: (range: { fromTimestamp: string; toTimestamp: string }) => void;
}

const EventTypeTimeChart = ({ data, eventTypeLabels, eventTypes, setDateRange }: Props) => {
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
  const groupedData = data.reduce((acc: any, log: any) => {
    const eventTime = log.eventTime ? new Date(log.eventTime) : null;
    if (eventTime && !isNaN(eventTime.getTime())) {
      const date = eventTime.toISOString().split("T")[0]; // Extract date part
      if (!acc[date]) acc[date] = {};
      acc[date][log.eventType] = (acc[date][log.eventType] || 0) + 1;
    }
    return acc;
  }, {});

  // Get unique event types
  const eventTypesSet = [...new Set(data.map((log: any) => log.eventType))];

  const colorMap: { [key: string]: string } = Object.fromEntries(
    eventTypes.map((et) => [et.value, et.color])
  );

  // Prepare series data for each event type
  const series = eventTypesSet.map((eventType) => ({
    name: eventTypeLabels[eventType] || eventType,
    type: "bar",
    stack: "total",
    data: fullDateRange.map((date) => groupedData[date]?.[eventType] || 0), // Fill gaps with 0
    itemStyle: {
      color: colorMap[eventType] || "#8c8c8c", // Use predefined color or fallback
    },
  }));

  const handleChartEvents = (params: any) => {
    // const {start, end} = params.batch?.[0];
    let {start, end} = params;
    if (params?.batch) {
      start = params.batch?.[0]?.start;
      end = params.batch?.[0]?.end;
    }
    if (start !== undefined && end !== undefined) {
      // debugger;
      const startIndex = Math.floor((start / 100) * (fullDateRange.length - 1));
      const endIndex = Math.floor((end / 100) * (fullDateRange.length - 1));
  
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
        title: { text: "Audit Log", left: "center" },
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

export default EventTypeTimeChart;
