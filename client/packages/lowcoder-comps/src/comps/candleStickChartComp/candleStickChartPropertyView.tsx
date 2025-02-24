import { CompAction } from "lowcoder-core";
import { ChartCompChildrenType  } from "./candleStickChartConstants";
import {
  hiddenPropertyView,
  Section,
  sectionNames,
} from "lowcoder-sdk";
import { trans } from "i18n/comps";
import { examplesUrl,optionUrl } from "../chartComp/chartConfigs/chartUrls";

export function candleStickChartPropertyView(
  children: ChartCompChildrenType,
  dispatch: (action: CompAction) => void
) {

  const jsonModePropertyView = (
    <>
      <Section name={trans("chart.config")}>
        {children.echartsData.propertyView({ label: trans("chart.data") })}
        {children.echartsTitleConfig.getPropertyView()}
        {children.echartsTitleData.propertyView({ label: trans("chart.xAxisLabels"), tooltip: trans("chart.xAxisLabelsTooltip") })}
        {children.echartsTitleVerticalConfig.getPropertyView()}
        {children.echartsTitle.propertyView({ label: trans("candleStickChart.title"), tooltip: trans("echarts.titleTooltip") })}
        {children.left.propertyView({ label: trans("candleStickChart.left"), tooltip: trans("echarts.leftTooltip") })}
        {children.right.propertyView({ label: trans("candleStickChart.right"), tooltip: trans("echarts.rightTooltip") })}
        {children.top.propertyView({ label: trans("candleStickChart.top"), tooltip: trans("echarts.topTooltip") })}
        {children.bottom.propertyView({ label: trans("candleStickChart.bottom"), tooltip: trans("echarts.bottomTooltip") })}
        {children.dataZoomVisibility.getView() && children.dataZoomHeight.propertyView({ label: trans("candleStickChart.dataZoomHeight"), tooltip: trans("candleStickChart.dataZoomHeightTooltip") })}
        {children.dataZoomVisibility.getView() && children.dataZoomBottom.propertyView({ label: trans("candleStickChart.dataZoomBottom"), tooltip: trans("candleStickChart.dataZoomBottomTooltip") })}
        {children.axisFlagVisibility.propertyView({label: trans("candleStickChart.axisFlagVisibility"), tooltip: trans("candleStickChart.axisFlagVisibilityTooltip") })}
        {children.dataZoomVisibility.propertyView({label: trans("candleStickChart.dataZoomVisibility"), tooltip: trans("candleStickChart.dataZoomVisibilityTooltip") })}
      </Section>
      <Section name={sectionNames.interaction}>
        {children.onEvent.propertyView()}
      </Section>
      <Section name={sectionNames.layout}>{hiddenPropertyView(children)}
      </Section>

      <Section name={sectionNames.chartStyle}>
        {children.chartStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.titleStyle}>
        {children.titleStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.xAxisStyle}>
        {children.xAxisStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.yAxisStyle}>
        {children.yAxisStyle?.getPropertyView()}
      </Section>
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
