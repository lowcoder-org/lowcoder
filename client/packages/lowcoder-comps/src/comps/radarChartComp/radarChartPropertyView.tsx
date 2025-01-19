import { CompAction } from "lowcoder-core";
import { ChartCompChildrenType  } from "./radarChartConstants";
import {
  hiddenPropertyView,
  Section,
  sectionNames,
} from "lowcoder-sdk";
import { trans } from "i18n/comps";
import { examplesUrl,optionUrl } from "../chartComp/chartConfigs/chartUrls";

export function radarChartPropertyView(
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
        {children.echartsTitle.propertyView({ label: trans("radarChart.title"), tooltip: trans("echarts.titleTooltip") })}
        {children.radius.propertyView({ label: trans("radarChart.radius"), tooltip: trans("echarts.radiusTooltip") })}
        {children.startAngle.propertyView({ label: trans("radarChart.startAngle"), tooltip: trans("echarts.startAngleTooltip") })}
        {children.splitNumber.propertyView({ label: trans("radarChart.splitNumber"), tooltip: trans("echarts.splitNumberTooltip") })}
        {children.position_x.propertyView({ label: trans("radarChart.position_x"), tooltip: trans("echarts.positionChart_x_Tooltip") })}
        {children.position_y.propertyView({ label: trans("radarChart.position_y"), tooltip: trans("echarts.positionChart_x_Tooltip") })}

        {children.areaFlag.propertyView({label: trans("radarChart.areaFlag"), tooltip: trans("radarChart.areaFlagTooltip")})}
        {children.legendVisibility.propertyView({label: trans("echarts.legendVisibility"), tooltip: trans("echarts.legendVisibilityTooltip")})}
        {children.indicatorVisibility.propertyView({label: trans("radarChart.indicatorVisibility"), tooltip: trans("radarChart.indicatorVisibilityTooltip")})}
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
      {
        children.indicatorVisibility.getView() ?
          <Section name={sectionNames.labelStyle}>
            {children.detailStyle?.getPropertyView()}
          </Section> : <></>
      }
      {
        children.legendVisibility.getView() ?
          <Section name={sectionNames.legendStyle}>
            {children.legendStyle?.getPropertyView()}
          </Section> : <></>
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
