import { changeChildAction, CompAction } from "lowcoder-core";
import { ChartCompChildrenType, getDataKeys } from "./parallelChartConstants";
import {
  CustomModal,
  Dropdown,
  hiddenPropertyView,
  Option,
  RedButton,
  Section,
  sectionNames,
  controlItem,
} from "lowcoder-sdk";
import { trans } from "i18n/comps";

export function parallelChartPropertyView(
  children: ChartCompChildrenType,
  dispatch: (action: CompAction) => void
) {
  const columnOptions = getDataKeys(children.data.getView()).map((key) => ({
    label: key,
    value: key,
  }));

  const uiModePropertyView = (
    <>
      <Section name={sectionNames.interaction}>
        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          {children.onUIEvent.propertyView({title: trans("chart.chartEventHandlers")})}
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          {children.onEvent.propertyView()}
        </div>
      </Section>
      <Section name={sectionNames.layout}>
        {children.echartsTitleConfig.getPropertyView()}
        {children.echartsTitleVerticalConfig.getPropertyView()}
        {children.title.propertyView({ label: trans("chart.title") })}
        {children.left.propertyView({ label: trans("chart.left"), tooltip: trans("echarts.leftTooltip") })}
        {children.right.propertyView({ label: trans("chart.right"), tooltip: trans("echarts.rightTooltip") })}
        {children.top.propertyView({ label: trans("chart.top"), tooltip: trans("echarts.topTooltip") })}
        {children.bottom.propertyView({ label: trans("chart.bottom"), tooltip: trans("echarts.bottomTooltip") })}
        {hiddenPropertyView(children)}
        {children.tooltip.propertyView({label: trans("echarts.tooltip"), tooltip: trans("echarts.tooltipTooltip")})}
      </Section>
      <Section name={sectionNames.chartStyle}>
        {children.chartStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.titleStyle}>
        {children.titleStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.advanced}>
        {children.data.propertyView({
          label: trans("chart.data"),
        })}
      </Section>
    </>
  );
  
  const getChatConfigByMode = (mode: string) => {
    switch(mode) {
      case "ui":
        return uiModePropertyView;
    }
  }
  return (
    <>
      {getChatConfigByMode(children.mode.getView())}
    </>
  );
}
