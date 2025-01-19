import React from "react";
import ReactECharts from "echarts-for-react";

interface Props {
  data: Array<any>; 
  eventTypeLabels : any;
}

const EventTypeTimeChart = ({ data, eventTypeLabels }: Props) => {
  const getChartOptions = () => {
    // Group data by date and eventType
    const groupedData = data.reduce((acc: any, log: any) => {
      // Validate and parse eventTime
      const eventTime = log.eventTime ? new Date(log.eventTime) : null;

      if (eventTime && !isNaN(eventTime.getTime())) {
        const date = eventTime.toISOString().split("T")[0]; // Extract date part
        if (!acc[date]) acc[date] = {};
        acc[date][log.eventType] = (acc[date][log.eventType] || 0) + 1;
      } else {
        console.warn("Invalid or missing eventTime:", log.eventTime);
      }

      return acc;
    }, {});

    // Extract sorted dates and unique event types
    const dates = Object.keys(groupedData).sort();
    const eventTypes = [...new Set(data.map((log: any) => log.eventType))];

    console.log("Dates:", dates);
    console.log("Event Types:", eventTypes);

    // Prepare series data for each event type
    const series = eventTypes.map((eventType) => ({
      name: eventTypeLabels[eventType] || eventType,
      type: "bar",
      stack: "total",
      data: dates.map((date) => groupedData[date][eventType] || 0), // Fill gaps with 0
    }));

    console.log("Series Data:", series);

    return {
      title: { text: "Event Types Over Time", left: "center" },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      legend: { top: 20 },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: {
        type: "category",
        data: dates,
        axisLabel: { rotate: 45 },
      },
      yAxis: {
        type: "value",
      },
      series,
    };
  };

  return (
    <ReactECharts
      option={getChartOptions()}
      style={{ height: "400px", marginBottom: "20px" }}
    />
  );
};

export default EventTypeTimeChart;
