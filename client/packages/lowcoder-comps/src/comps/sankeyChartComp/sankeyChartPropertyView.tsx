import { CompAction } from "lowcoder-core";
import { ChartCompChildrenType  } from "./sankeyChartConstants";
import {
  hiddenPropertyView,
  Section,
  sectionNames,
} from "lowcoder-sdk";
import { trans } from "i18n/comps";
import { examplesUrl,optionUrl } from "../chartComp/chartConfigs/chartUrls";

export function sankeyChartPropertyView(
  children: ChartCompChildrenType,
  dispatch: (action: CompAction) => void
) {

  const jsonModePropertyView = (
    <>
      <Section name={trans("chart.config")}>
        {children.echartsData.propertyView({ label: trans("chart.data") })}

        {children.echartsTitleConfig.getPropertyView()}
        {children.echartsTitleVerticalConfig.getPropertyView()}
        {children.echartsLabelConfig.getPropertyView()}

        {children.echartsTitle.propertyView({ label: trans("sankeyChart.title"), tooltip: trans("echarts.titleTooltip") })}
        {children.left.propertyView({ label: trans("sankeyChart.left"), tooltip: trans("echarts.leftTooltip") })}
        {children.right.propertyView({ label: trans("sankeyChart.right"), tooltip: trans("echarts.rightTooltip") })}
        {children.top.propertyView({ label: trans("sankeyChart.top"), tooltip: trans("echarts.topTooltip") })}
        {children.bottom.propertyView({ label: trans("sankeyChart.bottom"), tooltip: trans("echarts.bottomTooltip") })}
        {children.curveness.propertyView({ label: trans("sankeyChart.curveness"), tooltip: trans("sankeyChart.curvenessTooltip") })}
        {children.opacity.propertyView({ label: trans("sankeyChart.opacity"), tooltip: trans("sankeyChart.opacityTooltip") })}
        {children.nodeWidth.propertyView({ label: trans("sankeyChart.nodeWidth"), tooltip: trans("sankeyChart.nodeWidthTooltip") })}
        {children.nodeGap.propertyView({ label: trans("sankeyChart.nodeGap"), tooltip: trans("sankeyChart.nodeGapTooltip") })}

        {children.draggable.propertyView({label: trans("sankeyChart.draggable"), tooltip: trans("sankeyChart.draggableTooltip")})}
        {children.focus.propertyView({label: trans("sankeyChart.focus"), tooltip: trans("sankeyChart.focusTooltip")})}
        {children.tooltip.propertyView({label: trans("sankeyChart.tooltip"), tooltip: trans("echarts.tooltipTooltip")})}

      </Section>
      <Section name={sectionNames.interaction}>
        {children.onEvent.propertyView()}
      </Section>

      <Section name={sectionNames.chartStyle}>
        {children.chartStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.lineStyle}>
        {children.lineStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.titleStyle}>
        {children.titleStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.detailStyle}>
        {children.detailStyle?.getPropertyView()}
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
