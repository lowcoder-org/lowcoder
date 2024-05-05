import { CompAction } from "lowcoder-core";
import { ChartCompChildrenType  } from "./funnelChartConstants";
import {
  hiddenPropertyView,
  Section,
  sectionNames,
} from "lowcoder-sdk";
import { trans } from "i18n/comps";
import { examplesUrl,optionUrl } from "../chartComp/chartConfigs/chartUrls";

export function funnelChartPropertyView(
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
        {children.legendVisibility.getView()&& children.echartsLegendConfig.getPropertyView()}
        {children.label.getView()&& children.echartsLabelConfig.getPropertyView()}
        {children.echartsTitleConfig.getPropertyView()}
        {children.left.propertyView({ label: trans("funnelChart.left") })}
        {children.top.propertyView({ label: trans("funnelChart.top") })}
        {children.bottom.propertyView({ label: trans("funnelChart.bottom") })}
        {children.width.propertyView({ label: trans("funnelChart.width") })}
        {children.min.propertyView({ label: trans("funnelChart.min") })}
        {children.max.propertyView({ label: trans("funnelChart.max") })}
        {children.gap.propertyView({ label: trans("funnelChart.gap") })}
        {children.echartsTitle.propertyView({ label: trans("funnelChart.title") })}
        {children.tooltip.propertyView({label: trans("funnelChart.tooltip")})}
        {children.label.propertyView({label: trans("funnelChart.label")})}
        {children.legendVisibility.propertyView({label: trans("funnelChart.legendVisibility")})}
      </Section>
      <Section name={sectionNames.interaction}>
        {children.onEvent.propertyView()}
      </Section>
      <Section name={sectionNames.style}>
         {children.style.getPropertyView()}
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
