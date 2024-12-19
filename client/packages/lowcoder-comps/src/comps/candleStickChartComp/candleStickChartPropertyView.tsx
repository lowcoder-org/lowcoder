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
        {children.legendVisibility.getView() && children.echartsLegendConfig.getPropertyView()}
        {children.left.propertyView({ label: trans("candleStickChart.left") })}
        {children.right.propertyView({ label: trans("candleStickChart.right") })}
        {children.top.propertyView({ label: trans("candleStickChart.top") })}
        {children.bottom.propertyView({ label: trans("candleStickChart.bottom") })}
        {children.echartsTitle.propertyView({ label: trans("candleStickChart.title") })}
        {children.dataZoomVisibility.getView() && children.dataZoomHeight.propertyView({ label: trans("candleStickChart.dataZoomHeight") })}
        {children.dataZoomVisibility.getView() && children.dataZoomBottom.propertyView({ label: trans("candleStickChart.dataZoomBottom") })}
        {children.tooltip.propertyView({label: trans("candleStickChart.tooltip")})}
        {children.legendVisibility.propertyView({label: trans("candleStickChart.legendVisibility")})}
        {children.dataZoomVisibility.propertyView({label: trans("candleStickChart.dataZoomVisibility")})}
      </Section>
      <Section name={sectionNames.interaction}>
        {children.onEvent.propertyView()}
      </Section>
      <Section name={sectionNames.style}>
         {children.style?.getPropertyView()}
      </Section>
      <Section name={sectionNames.layout}>{hiddenPropertyView(children)}
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
      {
        children.legendVisibility.getView() ?
          <Section name={sectionNames.legendStyle}>
            {children.legendStyle?.getPropertyView()}
          </Section> : <></>
      }
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
