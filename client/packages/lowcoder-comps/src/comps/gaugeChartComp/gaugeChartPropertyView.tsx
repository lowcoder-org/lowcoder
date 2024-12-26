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
        {children.chartType.propertyView({label: trans("gaugeChart.chartType"), tooltip: trans("gaugeChart.chartTypeTooltip") })}
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
        {children.pointerLength.propertyView({ label: trans("gaugeChart.pointerLength"), tooltip: trans("echarts.pointerLengthTooltip") })}
        {children.pointerWidth.propertyView({ label: trans("gaugeChart.pointerWidth"), tooltip: trans("echarts.pointerWidthTooltip") })}
        {children.pointer_Y.propertyView({ label: trans("gaugeChart.pointer_Y"), tooltip: trans("gaugeChart.pointer_Y_Tooltip") })}
        {children.pointerIcon.propertyView({ label: trans("gaugeChart.pointerIcon"), tooltip: trans("gaugeChart.pointerIconTooltip") })}
        {children.progressBar.getView() && children.progressBarWidth.propertyView({ label: trans("gaugeChart.progressBarWidth"), tooltip: trans("echarts.pointerWidthTooltip") })}
        {children.splitNumber.propertyView({ label: trans("gaugeChart.splitNumber"), tooltip: trans("echarts.splitNumberTooltip") })}
        {children.axisTickLength.propertyView({ label: trans("gaugeChart.stageGauge.axisTickLength"), tooltip: trans("gaugeChart.stageGauge.axisTickLengthTooltip") })}
        {children.axisTickWidth.propertyView({ label: trans("gaugeChart.stageGauge.axisTickWidth"), tooltip: trans("gaugeChart.stageGauge.axisTickWidthTooltip") })}
        {children.axisTickColor.propertyView({ label: trans("gaugeChart.stageGauge.axisTickColor"), tooltip: trans("gaugeChart.stageGauge.axisTickColorTooltip") })}
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

  const stageGaugePropertyView = (
    <>
      <Section name={trans("chart.config")}>
        {children.stageGaugeOption.propertyView({
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
        {children.chartType.propertyView({label: trans("gaugeChart.chartType"), tooltip: trans("gaugeChart.chartTypeTooltip") })}
        {children.echartsTitleConfig.getPropertyView()}
        {children.echartsTitle.propertyView({ label: trans("gaugeChart.title"), tooltip: trans("echarts.titleTooltip") })}

        {children.stageGaugeProgressBarInterval1.propertyView({label: trans("gaugeChart.stageGauge.progressBarInterval"), tooltip: trans("gaugeChart.stageGauge.defaultToolTip") })}
        {children.stageGaugeProgressBarColor1.propertyView({label: trans("gaugeChart.stageGauge.progressBarColor"), tooltip: trans("gaugeChart.stageGauge.defaultToolTip") })}
        {children.stageGaugeProgressBarInterval2.propertyView({label: trans("gaugeChart.stageGauge.progressBarInterval"), tooltip: trans("gaugeChart.stageGauge.defaultToolTip") })}
        {children.stageGaugeProgressBarColor2.propertyView({label: trans("gaugeChart.stageGauge.progressBarColor"), tooltip: trans("gaugeChart.stageGauge.defaultToolTip") })}
        {children.stageGaugeProgressBarInterval3.propertyView({label: trans("gaugeChart.stageGauge.progressBarInterval"), tooltip: trans("gaugeChart.stageGauge.defaultToolTip") })}
        {children.stageGaugeProgressBarColor3.propertyView({label: trans("gaugeChart.stageGauge.progressBarColor"), tooltip: trans("gaugeChart.stageGauge.defaultToolTip") })}
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
        {children.progressBarWidthStage.propertyView({ label: trans("gaugeChart.progressBarWidth"), tooltip: trans("echarts.pointerWidthTooltip") })}
        {children.axisTickLength.propertyView({ label: trans("gaugeChart.stageGauge.axisTickLength"), tooltip: trans("gaugeChart.stageGauge.axisTickLengthTooltip") })}
        {children.axisTickWidth.propertyView({ label: trans("gaugeChart.stageGauge.axisTickWidth"), tooltip: trans("gaugeChart.stageGauge.axisTickWidthTooltip") })}
        {children.axisTickColorStage.propertyView({ label: trans("gaugeChart.stageGauge.axisTickColor"), tooltip: trans("gaugeChart.stageGauge.axisTickColorTooltip") })}
        {/* {children.gap.propertyView({ label: trans("gaugeChart.gap") })} */}
        {children.tooltip.propertyView({ label: trans("gaugeChart.tooltip"), tooltip: trans("echarts.tooltipVisibilityTooltip") })}
        {/*{children.progressBar.propertyView({ label: trans("gaugeChart.progressBar"), tooltip: trans("echarts.progressBarVisibilityTooltip") })}*/}
        {/*{children.roundCap.propertyView({ label: trans("gaugeChart.roundCap"), tooltip: trans("echarts.roundCapVisibilityTooltip") })}*/}
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
      {/*<Section name={sectionNames.labelStyle}>*/}
      {/*  {children.labelStyle?.getPropertyView()}*/}
      {/*</Section>*/}
      <Section name={sectionNames.detailStyle}>
        {children.legendStyle?.getPropertyView()}
      </Section>
      {/*<Section name={sectionNames.axisLabelStyle}>*/}
      {/*  {children.axisLabelStyle?.getPropertyView()}*/}
      {/*</Section>*/}
      <Section name={sectionNames.layout}>{hiddenPropertyView(children)}</Section>
    </>
  );

  const gradeGaugePropertyView = (
    <>
      <Section name={trans("chart.config")}>
        {children.gradeGaugeOption.propertyView({
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
        {children.chartType.propertyView({label: trans("gaugeChart.chartType"), tooltip: trans("gaugeChart.chartTypeTooltip") })}
        {children.echartsTitleConfig.getPropertyView()}
        {children.echartsTitle.propertyView({ label: trans("gaugeChart.title"), tooltip: trans("echarts.titleTooltip") })}
        {/* {children.left.propertyView({ label: trans("gaugeChart.left") })}
        {children.top.propertyView({ label: trans("gaugeChart.top") })}
        {children.bottom.propertyView({ label: trans("gaugeChart.bottom") })}
        {children.width.propertyView({ label: trans("gaugeChart.width") })} */}

        {children.gradeGaugeProgressBarInterval1.propertyView({label: trans("gaugeChart.stageGauge.progressBarInterval"), tooltip: trans("gaugeChart.stageGauge.defaultToolTip") })}
        {/*{children.gradeGaugeProgressBarString1.propertyView({label: trans("gaugeChart.stageGauge.gradeProgressBarString"), tooltip: trans("gaugeChart.stageGauge.defaultToolTip") })}*/}
        {children.stageGaugeProgressBarColor1.propertyView({label: trans("gaugeChart.stageGauge.progressBarColor"), tooltip: trans("gaugeChart.stageGauge.defaultToolTip") })}
        {children.gradeGaugeProgressBarInterval2.propertyView({label: trans("gaugeChart.stageGauge.progressBarInterval"), tooltip: trans("gaugeChart.stageGauge.defaultToolTip") })}
        {/*{children.gradeGaugeProgressBarString2.propertyView({label: trans("gaugeChart.stageGauge.gradeProgressBarString"), tooltip: trans("gaugeChart.stageGauge.defaultToolTip") })}*/}
        {children.stageGaugeProgressBarColor2.propertyView({label: trans("gaugeChart.stageGauge.progressBarColor"), tooltip: trans("gaugeChart.stageGauge.defaultToolTip") })}
        {children.gradeGaugeProgressBarInterval3.propertyView({label: trans("gaugeChart.stageGauge.progressBarInterval"), tooltip: trans("gaugeChart.stageGauge.defaultToolTip") })}
        {/*{children.gradeGaugeProgressBarString3.propertyView({label: trans("gaugeChart.stageGauge.gradeProgressBarString"), tooltip: trans("gaugeChart.stageGauge.defaultToolTip") })}*/}
        {children.stageGaugeProgressBarColor3.propertyView({label: trans("gaugeChart.stageGauge.progressBarColor"), tooltip: trans("gaugeChart.stageGauge.defaultToolTip") })}
        {children.gradeGaugeProgressBarInterval4.propertyView({label: trans("gaugeChart.stageGauge.progressBarInterval"), tooltip: trans("gaugeChart.stageGauge.defaultToolTip") })}
        {/*{children.gradeGaugeProgressBarString4.propertyView({label: trans("gaugeChart.stageGauge.gradeProgressBarString"), tooltip: trans("gaugeChart.stageGauge.defaultToolTip") })}*/}
        {children.stageGaugeProgressBarColor4.propertyView({label: trans("gaugeChart.stageGauge.progressBarColor"), tooltip: trans("gaugeChart.stageGauge.defaultToolTip") })}

        {children.radius.propertyView({ label: trans("gaugeChart.radius"), tooltip: trans("echarts.radiusTooltip") })}
        {children.min.propertyView({ label: trans("gaugeChart.min"), tooltip: trans("echarts.minTooltip") })}
        {children.max.propertyView({ label: trans("gaugeChart.max"), tooltip: trans("echarts.maxTooltip") })}
        {children.position_x.propertyView({ label: trans("gaugeChart.position_x"), tooltip: trans("echarts.positionChart_x_Tooltip") })}
        {children.position_y.propertyView({ label: trans("gaugeChart.position_y"), tooltip: trans("echarts.positionChart_x_Tooltip") })}
        {children.startAngle.propertyView({ label: trans("gaugeChart.startAngle"), tooltip: trans("echarts.startAngleTooltip") })}
        {children.endAngle.propertyView({ label: trans("gaugeChart.endAngle"), tooltip: trans("echarts.endAngleTooltip") })}
        {children.splitNumber.propertyView({ label: trans("gaugeChart.splitNumber"), tooltip: trans("echarts.splitNumberTooltip") })}
        {children.gradeGaugePointerLength.propertyView({ label: trans("gaugeChart.pointerLength"), tooltip: trans("echarts.pointerLengthTooltip") })}
        {children.gradeGaugePointerWidth.propertyView({ label: trans("gaugeChart.pointerWidth"), tooltip: trans("echarts.pointerWidthTooltip") })}
        {children.gradeGaugePointer_Y.propertyView({ label: trans("gaugeChart.pointer_Y"), tooltip: trans("gaugeChart.pointer_Y_Tooltip") })}
        {children.pointerIcon.propertyView({ label: trans("gaugeChart.pointerIcon"), tooltip: trans("gaugeChart.pointerIconTooltip") })}
        {children.progressBar.getView() && children.progressBarWidth.propertyView({ label: trans("gaugeChart.progressBarWidth"), tooltip: trans("echarts.pointerWidthTooltip") })}
        {children.axisTickLength.propertyView({ label: trans("gaugeChart.stageGauge.axisTickLength"), tooltip: trans("gaugeChart.stageGauge.axisTickLengthTooltip") })}
        {children.axisTickWidth.propertyView({ label: trans("gaugeChart.stageGauge.axisTickWidth"), tooltip: trans("gaugeChart.stageGauge.axisTickWidthTooltip") })}
        {children.axisTickColorGrade.propertyView({ label: trans("gaugeChart.stageGauge.axisTickColor"), tooltip: trans("gaugeChart.stageGauge.axisTickColorTooltip") })}
        {/* {children.gap.propertyView({ label: trans("gaugeChart.gap") })} */}
        {children.tooltip.propertyView({ label: trans("gaugeChart.tooltip"), tooltip: trans("echarts.tooltipVisibilityTooltip") })}
        {/*{children.progressBar.propertyView({ label: trans("gaugeChart.progressBar"), tooltip: trans("echarts.progressBarVisibilityTooltip") })}*/}
        {/*{children.roundCap.propertyView({ label: trans("gaugeChart.roundCap"), tooltip: trans("echarts.roundCapVisibilityTooltip") })}*/}
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
      {/*<Section name={sectionNames.axisLabelStyle}>*/}
      {/*  {children.axisLabelStyle?.getPropertyView()}*/}
      {/*</Section>*/}
      <Section name={sectionNames.layout}>{hiddenPropertyView(children)}</Section>
    </>
  );

  const temperatureGaugePropertyView = (
    <>
      <Section name={trans("chart.config")}>
        {children.temperatureGaugeOption.propertyView({
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
        {children.chartType.propertyView({label: trans("gaugeChart.chartType"), tooltip: trans("gaugeChart.chartTypeTooltip") })}
        {children.echartsTitleConfig.getPropertyView()}
        {children.echartsTitle.propertyView({ label: trans("gaugeChart.title"), tooltip: trans("echarts.titleTooltip") })}
        {/* {children.left.propertyView({ label: trans("gaugeChart.left") })}
        {children.top.propertyView({ label: trans("gaugeChart.top") })}
        {children.bottom.propertyView({ label: trans("gaugeChart.bottom") })}
        {children.width.propertyView({ label: trans("gaugeChart.width") })} */}
        {children.radiusTemperature.propertyView({ label: trans("gaugeChart.radius"), tooltip: trans("echarts.radiusTooltip") })}
        {children.min.propertyView({ label: trans("gaugeChart.min"), tooltip: trans("echarts.minTooltip") })}
        {children.max.propertyView({ label: trans("gaugeChart.max"), tooltip: trans("echarts.maxTooltip") })}
        {children.position_x.propertyView({ label: trans("gaugeChart.position_x"), tooltip: trans("echarts.positionChart_x_Tooltip") })}
        {children.position_y.propertyView({ label: trans("gaugeChart.position_y"), tooltip: trans("echarts.positionChart_x_Tooltip") })}
        {children.startAngle.propertyView({ label: trans("gaugeChart.startAngle"), tooltip: trans("echarts.startAngleTooltip") })}
        {children.endAngle.propertyView({ label: trans("gaugeChart.endAngle"), tooltip: trans("echarts.endAngleTooltip") })}
        {children.splitNumber.propertyView({ label: trans("gaugeChart.splitNumber"), tooltip: trans("echarts.splitNumberTooltip") })}
        {children.pointerLength.propertyView({ label: trans("gaugeChart.pointerLength"), tooltip: trans("echarts.pointerLengthTooltip") })}
        {children.pointerWidth.propertyView({ label: trans("gaugeChart.pointerWidth"), tooltip: trans("echarts.pointerWidthTooltip") })}
        {children.pointerIcon.propertyView({ label: trans("gaugeChart.pointerIcon"), tooltip: trans("gaugeChart.pointerIconTooltip") })}
        {children.progressBar.getView() && children.progressBarWidthTemperature.propertyView({ label: trans("gaugeChart.progressBarWidth"), tooltip: trans("echarts.pointerWidthTooltip") })}
        {children.axisLabelDistance.propertyView({ label: trans("gaugeChart.axisLabelDistance"), tooltip: trans("gaugeChart.axisLabelDistanceTooltip") })}
        {children.axisTickLength.propertyView({ label: trans("gaugeChart.stageGauge.axisTickLength"), tooltip: trans("gaugeChart.stageGauge.axisTickLengthTooltip") })}
        {children.axisTickWidth.propertyView({ label: trans("gaugeChart.stageGauge.axisTickWidth"), tooltip: trans("gaugeChart.stageGauge.axisTickWidthTooltip") })}
        {children.axisTickColorGrade.propertyView({ label: trans("gaugeChart.stageGauge.axisTickColor"), tooltip: trans("gaugeChart.stageGauge.axisTickColorTooltip") })}
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
      {/*<Section name={sectionNames.labelStyle}>*/}
      {/*  {children.labelStyle?.getPropertyView()}*/}
      {/*</Section>*/}
      <Section name={sectionNames.detailStyle}>
        {children.legendStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.axisLabelStyle}>
        {children.axisLabelStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.layout}>{hiddenPropertyView(children)}</Section>
    </>
  );

  const multiGaugePropertyView = (
    <>
      <Section name={trans("chart.config")}>
        {children.multiTitleGaugeOption.propertyView({
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
        {children.chartType.propertyView({label: trans("gaugeChart.chartType"), tooltip: trans("gaugeChart.chartTypeTooltip") })}
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
        {children.pointer_Y.propertyView({ label: trans("gaugeChart.pointer_Y"), tooltip: trans("gaugeChart.pointer_Y_Tooltip") })}
        {children.pointerIcon.propertyView({ label: trans("gaugeChart.pointerIcon"), tooltip: trans("gaugeChart.pointerIconTooltip") })}
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

  const ringGaugePropertyView = (
    <>
      <Section name={trans("chart.config")}>
        {children.ringGaugeOption.propertyView({
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
        {children.chartType.propertyView({label: trans("gaugeChart.chartType"), tooltip: trans("gaugeChart.chartTypeTooltip") })}
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

  const barometerGaugePropertyView = (
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
        {children.chartType.propertyView({label: trans("gaugeChart.chartType"), tooltip: trans("gaugeChart.chartTypeTooltip") })}
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

  const clockGaugePropertyView = (
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
        {children.chartType.propertyView({label: trans("gaugeChart.chartType"), tooltip: trans("gaugeChart.chartTypeTooltip") })}
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
        switch(children.chartType.getView()) {
          case "default":
            return jsonModePropertyView;
          case "stageGauge":
            return stageGaugePropertyView;
          case "gradeGauge":
            return gradeGaugePropertyView;
          case "temperatureGauge":
            return temperatureGaugePropertyView;
          case "multiGauge":
            return multiGaugePropertyView;
          case "ringGauge":
            return ringGaugePropertyView;
          case "barometerGauge":
            return barometerGaugePropertyView;
          case "clockGauge":
            return clockGaugePropertyView;
          default:
            return jsonModePropertyView;
        }
    }
  }
  return getChatConfigByMode(children.mode.getView())
}
