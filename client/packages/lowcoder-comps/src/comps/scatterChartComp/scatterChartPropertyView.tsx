import { changeChildAction, CompAction } from "lowcoder-core";
import { ChartCompChildrenType, ChartTypeOptions,getDataKeys } from "./scatterChartConstants";
import { newSeries } from "./seriesComp";
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

export function scatterChartPropertyView(
  children: ChartCompChildrenType,
  dispatch: (action: CompAction) => void
) {
  const series = children.series.getView();
  const columnOptions = getDataKeys(children.data.getView()).map((key) => ({
    label: key,
    value: key,
  }));

  const uiModePropertyView = (
    <>
      <Section name={trans("chart.data")}>
        {children.chartConfig.getPropertyView()}
        <Dropdown
          value={children.xAxisKey.getView()}
          options={columnOptions}
          label={trans("chart.xAxis")}
          onChange={(value) => {
            dispatch(changeChildAction("xAxisKey", value));
          }}
        />
        {children.chartConfig.getView().subtype === "waterfall" && children.xAxisData.propertyView({
          label: "X-Label-Data"
        })}
        <Option
          items={series}
          title={trans("chart.chartSeries")}
          itemTitle={(s) => s.getView().seriesName}
          popoverTitle={(s) => s.getView().columnName}
          content={(s, index) => (
            <>
              {s.getPropertyViewWithData(columnOptions)}
              {
                <RedButton
                  onClick={() => {
                    CustomModal.confirm({
                      title: trans("chart.delete"),
                      content: trans("chart.confirmDelete") + `${s.getView().seriesName}?`,
                      onConfirm: () =>
                        children.series.dispatch(children.series.deleteAction(index)),
                      confirmBtnType: "delete",
                      okText: trans("chart.delete"),
                    });
                  }}
                >
                  {trans("chart.delete")}
                </RedButton>
              }
            </>
          )}
          onAdd={() => {
            if (columnOptions.length <= 0) {
              return;
            }
            children.series.dispatch(
              children.series.pushAction(
                newSeries(trans("chart.customSeries"), columnOptions[0].value)
              )
            );
          }}
          onMove={(fromIndex, toIndex) => {
            const action = children.series.arrayMoveAction(fromIndex, toIndex);
            children.series.dispatch(action);
          }}
          hide={(s) => s.getView().hide}
          onHide={(s, hide) => s.children.hide.dispatchChangeValueAction(hide)}
          dataIndex={(s) => s.getView().dataIndex}
        />
      </Section>
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
        {children.legendConfig.getPropertyView()}
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
      <Section name={sectionNames.xAxisStyle}>
        {children.xAxisStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.yAxisStyle}>
        {children.yAxisStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.legendStyle}>
        {children.legendStyle?.getPropertyView()}
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
