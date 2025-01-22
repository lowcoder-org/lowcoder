import { CompAction } from "lowcoder-core";
import { ChartCompChildrenType  } from "./graphChartConstants";
import {
  hiddenPropertyView,
  Section,
  sectionNames,
} from "lowcoder-sdk";
import { trans } from "i18n/comps";
import { examplesUrl,optionUrl } from "../chartComp/chartConfigs/chartUrls";

export function graphChartPropertyView(
  children: ChartCompChildrenType,
  dispatch: (action: CompAction) => void
) {

  const jsonModePropertyView = (
    <>
      <Section name={trans("chart.config")}>
        {children.echartsData.propertyView({ label: trans("chart.data") })}
        {children.echartsTitle.propertyView({ label: trans("graphChart.title"), tooltip: trans("echarts.titleTooltip") })}
        {children.echartsTitleConfig.getPropertyView()}
        {children.echartsTitleVerticalConfig.getPropertyView()}

        {children.arrowFlag.getView() && children.arrowSize.propertyView({ label: trans("graphChart.arrowSize"), tooltip: trans("graphChart.arrowSizeTooltip") })}
        {children.pointSize.propertyView({ label: trans("graphChart.pointSize"), tooltip: trans("graphChart.pointSizeTooltip") })}
        {children.repulsion.propertyView({ label: trans("graphChart.repulsion"), tooltip: trans("graphChart.repulsionTooltip") })}
        {children.gravity.propertyView({ label: trans("graphChart.gravity"), tooltip: trans("graphChart.gravityTooltip") })}
        {children.lineLength.propertyView({ label: trans("graphChart.lineLength"), tooltip: trans("graphChart.lineLengthTooltip") })}
        {children.lineWidth.propertyView({ label: trans("graphChart.lineWidth"), tooltip: trans("graphChart.lineWidthTooltip") })}
        {children.curveness.propertyView({ label: trans("graphChart.curveness"), tooltip: trans("graphChart.curvenessTooltip") })}

        {children.arrowFlag.propertyView({label: trans("graphChart.arrowFlag"), tooltip: trans("graphChart.arrowFlagTooltip") })}
        {children.tooltip.propertyView({label: trans("graphChart.tooltip"), tooltip: trans("graphChart.tooltipTooltip") })}
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
