import { CompAction } from "lowcoder-core";
import { ChartCompChildrenType  } from "./sunburstChartConstants";
import {
  hiddenPropertyView,
  Section,
  sectionNames,
} from "lowcoder-sdk";
import { trans } from "i18n/comps";
import { examplesUrl,optionUrl } from "../chartComp/chartConfigs/chartUrls";

export function sunburstChartPropertyView(
  children: ChartCompChildrenType,
  dispatch: (action: CompAction) => void
) {

  const jsonModePropertyView = (
    <>
      <Section name={trans("chart.config")}>
        {children.echartsData.propertyView({ label: trans("chart.data") })}

        {children.echartsTitleConfig.getPropertyView()}
        {children.echartsTitleVerticalConfig.getPropertyView()}

        {children.echartsTitle.propertyView({ label: trans("sunburstChart.title"), tooltip: trans("echarts.titleTooltip") })}
        {children.radiusInline.propertyView({ label: trans("sunburstChart.radiusInline"), tooltip: trans("sunburstChart.radiusInlineTooltip") })}
        {children.radiusOutline.propertyView({ label: trans("sunburstChart.radiusOutline"), tooltip: trans("sunburstChart.radiusOutlineTooltip") })}
        {children.position_x.propertyView({ label: trans("sunburstChart.position_x"), tooltip: trans("echarts.positionChart_x_Tooltip") })}
        {children.position_y.propertyView({ label: trans("sunburstChart.position_Y"), tooltip: trans("echarts.positionChart_y_Tooltip") })}

        {children.tooltip.propertyView({label: trans("sunburstChart.tooltip"), tooltip: trans("echarts.tooltipTooltip")})}
        {children.labelVisibility.propertyView({label: trans("sunburstChart.labelVisibility"), tooltip: trans("echarts.labelVisibilityTooltip")})}
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
        children.labelVisibility.getView() &&
          <Section name={sectionNames.detailStyle}>
            {children.detailStyle?.getPropertyView()}
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
