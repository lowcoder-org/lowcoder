import { CompAction } from "lowcoder-core";
import { ChartCompChildrenType  } from "./themeriverChartConstants";
import {
  hiddenPropertyView,
  Section,
  sectionNames,
} from "lowcoder-sdk";
import { trans } from "i18n/comps";
import { examplesUrl,optionUrl } from "../chartComp/chartConfigs/chartUrls";

export function themeriverChartPropertyView(
  children: ChartCompChildrenType,
  dispatch: (action: CompAction) => void
) {

  const jsonModePropertyView = (
    <>
      <Section name={trans("chart.config")}>
        {children.echartsData.propertyView({ label: trans("chart.data") })}

        {children.echartsTitleConfig.getPropertyView()}
        {children.echartsTitleVerticalConfig.getPropertyView()}
        {children.legendVisibility.getView() && children.echartsLegendAlignConfig.getPropertyView()}
        {children.legendVisibility.getView() && children.echartsLegendConfig.getPropertyView()}
        {children.legendVisibility.getView() && children.echartsLegendOrientConfig.getPropertyView()}

        {children.echartsTitle.propertyView({ label: trans("themeriverChart.title"), tooltip: trans("echarts.titleTooltip") })}
        {children.splitNumber.propertyView({ label: trans("themeriverChart.splitNumber"), tooltip: trans("echarts.splitNumberTooltip") })}
        {children.left.propertyView({ label: trans("themeriverChart.left"), tooltip: trans("echarts.leftTooltip") })}
        {children.right.propertyView({ label: trans("themeriverChart.right"), tooltip: trans("echarts.rightTooltip") })}
        {children.top.propertyView({ label: trans("themeriverChart.top"), tooltip: trans("echarts.topTooltip") })}
        {children.bottom.propertyView({ label: trans("themeriverChart.bottom"), tooltip: trans("echarts.bottomTooltip") })}

        {children.legendVisibility.propertyView({label: trans("echarts.legendVisibility"), tooltip: trans("echarts.legendVisibilityTooltip")})}
        {children.tooltip.propertyView({label: trans("themeriverChart.tooltip"), tooltip: trans("echarts.tooltipTooltip")})}
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
      <Section name={sectionNames.xAxisStyle}>
        {children.axisStyle?.getPropertyView()}
      </Section>
      {
        children.legendVisibility.getView() &&
          <Section name={sectionNames.legendStyle}>
            {children.legendStyle?.getPropertyView()}
          </Section>
      }

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
