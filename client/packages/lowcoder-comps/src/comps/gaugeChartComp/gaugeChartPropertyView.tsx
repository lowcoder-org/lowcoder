import { CompAction } from "lowcoder-core";
import { ChartCompChildrenType } from "./gaugeChartConstants";
import {
  hiddenPropertyView,
  Section,
  sectionNames,
} from "lowcoder-sdk";
import { trans } from "i18n/comps";
import { examplesUrl,optionUrl } from "../chartComp/chartConfigs/chartUrls";

export function gaugeChartPropertyView(
  children: ChartCompChildrenType,
  dispatch: (action: CompAction) => void
) {

  const jsonModePropertyView = (
    <>
      <Section name={trans("chart.config")}>
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
        {children.echartsTitleConfig.getPropertyView()}
        {children.echartsTitle.propertyView({ label: trans("gaugeChart.title"), tooltip: trans("echarts.titleTooltip") })}
        {/* {children.left.propertyView({ label: trans("gaugeChart.left") })}
        {children.top.propertyView({ label: trans("gaugeChart.top") })}
        {children.bottom.propertyView({ label: trans("gaugeChart.bottom") })}
        {children.width.propertyView({ label: trans("gaugeChart.width") })} */}
        {children.radius.propertyView({ label: trans("gaugeChart.radius"), tooltip: trans("echarts.radiusTooltip") })}
        {children.min.propertyView({ label: trans("gaugeChart.min"), tooltip: trans("echarts.minTooltip") })}
        {children.max.propertyView({ label: trans("gaugeChart.max"), tooltip: trans("echarts.maxTooltip") })}
        {children.position_x.propertyView({ label: trans("gaugeChart.position_x"), tooltip: trans("echarts.positionChart_x_Tooltip") })}
        {children.position_y.propertyView({ label: trans("gaugeChart.position_y"), tooltip: trans("echarts.positionChart_x_Tooltip") })}
        {children.startAngle.propertyView({ label: trans("gaugeChart.startAngle"), tooltip: trans("echarts.startAngleTooltip") })}
        {children.endAngle.propertyView({ label: trans("gaugeChart.endAngle"), tooltip: trans("echarts.endAngleTooltip") })}
        {children.splitNumber.propertyView({ label: trans("gaugeChart.splitNumber"), tooltip: trans("echarts.splitNumberTooltip") })}
        {children.pointerLength.propertyView({ label: trans("gaugeChart.pointerLength"), tooltip: trans("echarts.pointerLengthTooltip") })}
        {children.pointerWidth.propertyView({ label: trans("gaugeChart.pointerWidth"), tooltip: trans("echarts.pointerWidthTooltip") })}
        {children.progressBar.getView() && children.progressBarWidth.propertyView({ label: trans("gaugeChart.progressBarWidth"), tooltip: trans("echarts.pointerWidthTooltip") })}
        {/* {children.gap.propertyView({ label: trans("gaugeChart.gap") })} */}
        {children.tooltip.propertyView({ label: trans("gaugeChart.tooltip"), tooltip: trans("echarts.tooltipVisibilityTooltip") })}
        {children.progressBar.propertyView({ label: trans("gaugeChart.progressBar"), tooltip: trans("echarts.progressBarVisibilityTooltip") })}
        {children.roundCap.propertyView({ label: trans("gaugeChart.roundCap"), tooltip: trans("echarts.roundCapVisibilityTooltip") })}
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
      <Section name={sectionNames.detailStyle}>
        {children.legendStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.axisLabelStyle}>
        {children.axisLabelStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.layout}>{hiddenPropertyView(children)}</Section>
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
