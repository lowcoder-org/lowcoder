import { CompAction } from "lowcoder-core";
import { ChartCompChildrenType  } from "./heatmapChartConstants";
import {
  hiddenPropertyView,
  Section,
  sectionNames,
} from "lowcoder-sdk";
import { trans } from "i18n/comps";
import { examplesUrl,optionUrl } from "../chartComp/chartConfigs/chartUrls";

export function heatmapChartPropertyView(
  children: ChartCompChildrenType,
  dispatch: (action: CompAction) => void
) {

  const jsonModePropertyView = (
    <>
      <Section name={trans("chart.config")}>
        {children.echartsData.propertyView({ label: trans("chart.data") })}
        {children.echartsTitleConfig.getPropertyView()}
        {children.echartsTitleVerticalConfig.getPropertyView()}
        {children.echartsLegendAlignConfig.getPropertyView()}
        {children.echartsLegendConfig.getPropertyView()}
        {children.echartsLegendOrientConfig.getPropertyView()}
        {children.echartsTitle.propertyView({ label: trans("heatmapChart.title"), tooltip: trans("echarts.titleTooltip") })}
        {children.left.propertyView({ label: trans("heatmapChart.left"), tooltip: trans("echarts.leftTooltip") })}
        {children.right.propertyView({ label: trans("heatmapChart.right"), tooltip: trans("echarts.rightTooltip") })}
        {children.top.propertyView({ label: trans("heatmapChart.top"), tooltip: trans("echarts.topTooltip") })}
        {children.bottom.propertyView({ label: trans("heatmapChart.bottom"), tooltip: trans("echarts.bottomTooltip") })}
        {children.min.propertyView({ label: trans("heatmapChart.min"), tooltip: trans("echarts.minTooltip") })}
        {children.max.propertyView({ label: trans("heatmapChart.max"), tooltip: trans("echarts.maxTooltip") })}

        {children.xAxisVisibility.propertyView({label: trans("heatmapChart.xAxisVisibility"), tooltip: trans("heatmapChart.xAxisVisibilityTooltip")})}
        {children.yAxisVisibility.propertyView({label: trans("heatmapChart.yAxisVisibility"), tooltip: trans("heatmapChart.yAxisVisibilityTooltip")})}
        {children.labelVisibility.propertyView({label: trans("heatmapChart.labelVisibility"), tooltip: trans("echarts.labelVisibilityTooltip")})}
        {children.tooltip.propertyView({label: trans("heatmapChart.tooltip"), tooltip: trans("echarts.tooltipTooltip")})}
      </Section>
      <Section name={sectionNames.interaction}>
        {children.onEvent.propertyView()}
      </Section>
      <Section name={sectionNames.chartStyle}>
        {children.chartStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.titleStyle}>
        {children.titleStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.labelStyle}>
        {children.labelStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.xAxisStyle}>
        {children.xAxisStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.yAxisStyle}>
        {children.yAxisStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.visualMapStyle}>
        {children.visualMapStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.layout}>{hiddenPropertyView(children)}</Section>
      <Section name={sectionNames.advanced}>
        {children.echartsOption.propertyView({
        label: trans("chart.echartsOptionLabel"),
        styleName: "higher",
        tooltip: (
          <div>
            <a href={optionUrl} target="_blank" rel="noopener noreferrer">
              {trans("chart.echartsOptionTooltip")}
            </a>
            <br />
            <a href={examplesUrl} target="_blank" rel="noopener noreferrer">
              {trans("chart.echartsOptionExamples")}
            </a>
          </div>
        ),
      })}
      </Section>
    </>
  );
  
  const getChatConfigByMode = (mode: string) => {
    switch(mode) {
      case "json":
        return jsonModePropertyView;
    }
  }
  return getChatConfigByMode(children.mode.getView())
}
