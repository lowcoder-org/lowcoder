import React from "react";
import ReactECharts from "echarts-for-react";

interface Props {
  data: Array<any>; // replace any with the actual type of data item
}

const EventTypeTimeChart = ({ data }: Props) => {

  const getChartOptions = () => {
    
    const groupedData = data.reduce((acc : any, log: any) => {
      const date = new Date(log.event_time).toISOString().split("T")[0];
      if (!acc[date]) acc[date] = {};
      acc[date][log.event_type] = (acc[date][log.event_type] || 0) + 1;
      return acc;
    }, {});

    const dates = Object.keys(groupedData).sort();
    const eventTypes = [...new Set(data.map((log: any) => log.event_type))];

    // Prepare series data for each event type
    const series = eventTypes.map((eventType) => ({
      name: eventType,
      type: "bar",
      stack: "total",
      data: dates.map((date) => groupedData[date][eventType] || 0), // Fill gaps with 0
    }));

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