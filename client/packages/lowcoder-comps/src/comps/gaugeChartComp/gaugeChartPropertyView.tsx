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
        {children.echartsData.propertyView({ label: trans("chart.data") })}
        {children.chartType.propertyView({label: trans("gaugeChart.chartType"), tooltip: trans("gaugeChart.chartTypeTooltip") })}
        {children.echartsTitleConfig.getPropertyView()}
        {children.echartsTitle.propertyView({ label: trans("gaugeChart.title"), tooltip: trans("echarts.titleTooltip") })}
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
        {children.axisTickLength.propertyView({ label: trans("gaugeChart.axisTickLength"), tooltip: trans("echarts.axisTickLengthTooltip") })}
        {children.axisTickWidth.propertyView({ label: trans("gaugeChart.axisTickWidth"), tooltip: trans("echarts.axisTickWidthTooltip") })}
        {children.axisLabelDistance.propertyView({ label: trans("gaugeChart.axisLabelDistance"), tooltip: trans("echarts.axisLabelDistanceTooltip") })}
        {children.axisTickColor.propertyView({ label: trans("gaugeChart.axisTickColor"), tooltip: trans("echarts.axisTickColorTooltip") })}
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

  const stageGaugePropertyView = (
    <>
      <Section name={trans("chart.config")}>
        {children.stageGaugeData.propertyView({ label: trans("chart.data") })}
        {children.chartType.propertyView({label: trans("gaugeChart.chartType"), tooltip: trans("gaugeChart.chartTypeTooltip") })}
        {children.echartsTitleConfig.getPropertyView()}
        {children.echartsTitle.propertyView({ label: trans("gaugeChart.title"), tooltip: trans("echarts.titleTooltip") })}
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
        {children.stageProgressBarWidth.propertyView({ label: trans("gaugeChart.progressBarWidth"), tooltip: trans("echarts.pointerWidthTooltip") })}
        {children.splitNumber.propertyView({ label: trans("gaugeChart.splitNumber"), tooltip: trans("echarts.splitNumberTooltip") })}
        {children.axisTickLength.propertyView({ label: trans("gaugeChart.axisTickLength"), tooltip: trans("echarts.axisTickLengthTooltip") })}
        {children.axisTickWidth.propertyView({ label: trans("gaugeChart.axisTickWidth"), tooltip: trans("echarts.axisTickWidthTooltip") })}
        {children.axisLabelDistance.propertyView({ label: trans("gaugeChart.axisLabelDistance"), tooltip: trans("echarts.axisLabelDistanceTooltip") })}
        {children.stageAxisTickColor.propertyView({ label: trans("gaugeChart.axisTickColor"), tooltip: trans("echarts.axisTickColorTooltip") })}
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
      <Section name={sectionNames.axisLabelStyle}>
        {children.axisLabelStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.layout}>{hiddenPropertyView(children)}</Section>
      <Section name={sectionNames.advanced}>
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
      </Section>
    </>
  );

  const gradeGaugePropertyView = (
    <>
      <Section name={trans("chart.config")}>
        {children.gradeGaugeData.propertyView({ label: trans("chart.data") })}
        {children.chartType.propertyView({label: trans("gaugeChart.chartType"), tooltip: trans("gaugeChart.chartTypeTooltip") })}
        {children.echartsTitleConfig.getPropertyView()}
        {children.echartsTitle.propertyView({ label: trans("gaugeChart.title"), tooltip: trans("echarts.titleTooltip") })}
        {children.radius.propertyView({ label: trans("gaugeChart.radius"), tooltip: trans("echarts.radiusTooltip") })}
        {children.min.propertyView({ label: trans("gaugeChart.min"), tooltip: trans("echarts.minTooltip") })}
        {children.max.propertyView({ label: trans("gaugeChart.max"), tooltip: trans("echarts.maxTooltip") })}
        {children.position_x.propertyView({ label: trans("gaugeChart.position_x"), tooltip: trans("echarts.positionChart_x_Tooltip") })}
        {children.position_y.propertyView({ label: trans("gaugeChart.position_y"), tooltip: trans("echarts.positionChart_x_Tooltip") })}
        {children.startAngle.propertyView({ label: trans("gaugeChart.startAngle"), tooltip: trans("echarts.startAngleTooltip") })}
        {children.endAngle.propertyView({ label: trans("gaugeChart.endAngle"), tooltip: trans("echarts.endAngleTooltip") })}
        {children.gradeGaugePointerLength.propertyView({ label: trans("gaugeChart.pointerLength"), tooltip: trans("echarts.pointerLengthTooltip") })}
        {children.gradeGaugePointerWidth.propertyView({ label: trans("gaugeChart.pointerWidth"), tooltip: trans("echarts.pointerWidthTooltip") })}
        {children.gradeGaugePointer_Y.propertyView({ label: trans("gaugeChart.pointer_Y"), tooltip: trans("gaugeChart.pointer_Y_Tooltip") })}
        {children.gradePointerIcon.propertyView({ label: trans("gaugeChart.pointerIcon"), tooltip: trans("gaugeChart.pointerIconTooltip") })}
        {children.progressBarWidth.propertyView({ label: trans("gaugeChart.progressBarWidth"), tooltip: trans("echarts.pointerWidthTooltip") })}
        {children.splitNumber.propertyView({ label: trans("gaugeChart.splitNumber"), tooltip: trans("echarts.splitNumberTooltip") })}
        {children.axisTickLength.propertyView({ label: trans("gaugeChart.axisTickLength"), tooltip: trans("echarts.axisTickLengthTooltip") })}
        {children.axisTickWidth.propertyView({ label: trans("gaugeChart.axisTickWidth"), tooltip: trans("echarts.axisTickWidthTooltip") })}
        {/*{children.axisLabelDistance.propertyView({ label: trans("gaugeChart.axisLabelDistance"), tooltip: trans("echarts.axisLabelDistanceTooltip") })}*/}
        {children.gradeAxisTickColor.propertyView({ label: trans("gaugeChart.axisTickColor"), tooltip: trans("echarts.axisTickColorTooltip") })}
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
      <Section name={sectionNames.advanced}>
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
      </Section>
    </>
  );

  const temperatureGaugePropertyView = (
    <>
      <Section name={trans("chart.config")}>
        {children.temperatureGaugeData.propertyView({ label: trans("chart.data") })}
        {children.chartType.propertyView({label: trans("gaugeChart.chartType"), tooltip: trans("gaugeChart.chartTypeTooltip") })}
        {children.echartsTitleConfig.getPropertyView()}
        {children.echartsTitle.propertyView({ label: trans("gaugeChart.title"), tooltip: trans("echarts.titleTooltip") })}
        {children.temperatureRadius.propertyView({ label: trans("gaugeChart.radius"), tooltip: trans("echarts.radiusTooltip") })}
        {children.min.propertyView({ label: trans("gaugeChart.min"), tooltip: trans("echarts.minTooltip") })}
        {children.max.propertyView({ label: trans("gaugeChart.max"), tooltip: trans("echarts.maxTooltip") })}
        {children.position_x.propertyView({ label: trans("gaugeChart.position_x"), tooltip: trans("echarts.positionChart_x_Tooltip") })}
        {children.position_y.propertyView({ label: trans("gaugeChart.position_y"), tooltip: trans("echarts.positionChart_x_Tooltip") })}
        {children.startAngle.propertyView({ label: trans("gaugeChart.startAngle"), tooltip: trans("echarts.startAngleTooltip") })}
        {children.endAngle.propertyView({ label: trans("gaugeChart.endAngle"), tooltip: trans("echarts.endAngleTooltip") })}
        {/*{children.gradeGaugePointerLength.propertyView({ label: trans("gaugeChart.pointerLength"), tooltip: trans("echarts.pointerLengthTooltip") })}*/}
        {/*{children.gradeGaugePointerWidth.propertyView({ label: trans("gaugeChart.pointerWidth"), tooltip: trans("echarts.pointerWidthTooltip") })}*/}
        {/*{children.gradeGaugePointer_Y.propertyView({ label: trans("gaugeChart.pointer_Y"), tooltip: trans("gaugeChart.pointer_Y_Tooltip") })}*/}
        {/*{children.gradePointerIcon.propertyView({ label: trans("gaugeChart.pointerIcon"), tooltip: trans("gaugeChart.pointerIconTooltip") })}*/}
        {children.temperatureProgressBarWidth.propertyView({ label: trans("gaugeChart.progressBarWidth"), tooltip: trans("echarts.pointerWidthTooltip") })}
        {children.splitNumber.propertyView({ label: trans("gaugeChart.splitNumber"), tooltip: trans("echarts.splitNumberTooltip") })}
        {children.axisTickLength.propertyView({ label: trans("gaugeChart.axisTickLength"), tooltip: trans("echarts.axisTickLengthTooltip") })}
        {children.axisTickWidth.propertyView({ label: trans("gaugeChart.axisTickWidth"), tooltip: trans("echarts.axisTickWidthTooltip") })}
        {children.temperatureAxisLabelDistance.propertyView({ label: trans("gaugeChart.axisLabelDistance"), tooltip: trans("echarts.axisLabelDistanceTooltip") })}
        {children.gradeAxisTickColor.propertyView({ label: trans("gaugeChart.axisTickColor"), tooltip: trans("echarts.axisTickColorTooltip") })}
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
      <Section name={sectionNames.axisLabelStyle}>
        {children.axisLabelStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.layout}>{hiddenPropertyView(children)}</Section>
      <Section name={sectionNames.advanced}>
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

      </Section>
    </>
  );

  const multiGaugePropertyView = (
    <>
      <Section name={trans("chart.config")}>
        {children.multiTitleGaugeData.propertyView({ label: trans("chart.data") })}
        {children.chartType.propertyView({label: trans("gaugeChart.chartType"), tooltip: trans("gaugeChart.chartTypeTooltip") })}
        {children.echartsTitleConfig.getPropertyView()}
        {children.echartsTitle.propertyView({ label: trans("gaugeChart.title"), tooltip: trans("echarts.titleTooltip") })}
        {children.radius.propertyView({ label: trans("gaugeChart.radius"), tooltip: trans("echarts.radiusTooltip") })}
        {children.min.propertyView({ label: trans("gaugeChart.min"), tooltip: trans("echarts.minTooltip") })}
        {children.max.propertyView({ label: trans("gaugeChart.max"), tooltip: trans("echarts.maxTooltip") })}
        {children.position_x.propertyView({ label: trans("gaugeChart.position_x"), tooltip: trans("echarts.positionChart_x_Tooltip") })}
        {children.position_y.propertyView({ label: trans("gaugeChart.position_y"), tooltip: trans("echarts.positionChart_x_Tooltip") })}
        {children.startAngle.propertyView({ label: trans("gaugeChart.startAngle"), tooltip: trans("echarts.startAngleTooltip") })}
        {children.endAngle.propertyView({ label: trans("gaugeChart.endAngle"), tooltip: trans("echarts.endAngleTooltip") })}
        {children.splitNumber.propertyView({ label: trans("gaugeChart.splitNumber"), tooltip: trans("echarts.splitNumberTooltip") })}
        {children.axisTickLength.propertyView({ label: trans("gaugeChart.axisTickLength"), tooltip: trans("echarts.axisTickLengthTooltip") })}
        {children.axisTickWidth.propertyView({ label: trans("gaugeChart.axisTickWidth"), tooltip: trans("echarts.axisTickWidthTooltip") })}
        {children.axisTickColor.propertyView({ label: trans("gaugeChart.axisTickColor"), tooltip: trans("echarts.axisTickColorTooltip") })}
        {children.pointerLength.propertyView({ label: trans("gaugeChart.pointerLength"), tooltip: trans("echarts.pointerLengthTooltip") })}
        {children.pointerWidth.propertyView({ label: trans("gaugeChart.pointerWidth"), tooltip: trans("echarts.pointerWidthTooltip") })}
        {children.pointer_Y.propertyView({ label: trans("gaugeChart.pointer_Y"), tooltip: trans("gaugeChart.pointer_Y_Tooltip") })}
        {children.multiTitlePointerIcon.propertyView({ label: trans("gaugeChart.pointerIcon"), tooltip: trans("gaugeChart.pointerIconTooltip") })}
        {children.progressBarWidth.propertyView({ label: trans("gaugeChart.progressBarWidth"), tooltip: trans("echarts.pointerWidthTooltip") })}
        {children.tooltip.propertyView({ label: trans("gaugeChart.tooltip"), tooltip: trans("echarts.tooltipVisibilityTooltip") })}
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
      <Section name={sectionNames.advanced}>
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
      </Section>
    </>
  );

  const ringGaugePropertyView = (
    <>
      <Section name={trans("chart.config")}>
        {children.ringGaugeData.propertyView({ label: trans("chart.data") })}
        {children.chartType.propertyView({label: trans("gaugeChart.chartType"), tooltip: trans("gaugeChart.chartTypeTooltip") })}
        {children.echartsTitleConfig.getPropertyView()}
        {children.echartsTitle.propertyView({ label: trans("gaugeChart.title"), tooltip: trans("echarts.titleTooltip") })}
        {children.radius.propertyView({ label: trans("gaugeChart.radius"), tooltip: trans("echarts.radiusTooltip") })}
        {children.min.propertyView({ label: trans("gaugeChart.min"), tooltip: trans("echarts.minTooltip") })}
        {children.max.propertyView({ label: trans("gaugeChart.max"), tooltip: trans("echarts.maxTooltip") })}
        {children.position_x.propertyView({ label: trans("gaugeChart.position_x"), tooltip: trans("echarts.positionChart_x_Tooltip") })}
        {children.position_y.propertyView({ label: trans("gaugeChart.position_y"), tooltip: trans("echarts.positionChart_x_Tooltip") })}
        {children.ringProgressBarWidth.propertyView({ label: trans("gaugeChart.progressBarWidth"), tooltip: trans("echarts.pointerWidthTooltip") })}
        {children.tooltip.propertyView({ label: trans("gaugeChart.tooltip"), tooltip: trans("echarts.tooltipVisibilityTooltip") })}
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
      <Section name={sectionNames.advanced}>
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
      </Section>
    </>
  );

  const barometerGaugePropertyView = (
    <>
      <Section name={trans("chart.config")}>
        {children.barometerGaugeData.propertyView({ label: trans("chart.data") })}
        {children.chartType.propertyView({label: trans("gaugeChart.chartType"), tooltip: trans("gaugeChart.chartTypeTooltip") })}
        {children.echartsTitleConfig.getPropertyView()}
        {children.echartsTitle.propertyView({ label: trans("gaugeChart.title"), tooltip: trans("echarts.titleTooltip") })}
        {children.position_x.propertyView({ label: trans("gaugeChart.position_x"), tooltip: trans("echarts.positionChart_x_Tooltip") })}
        {children.position_y.propertyView({ label: trans("gaugeChart.position_y"), tooltip: trans("echarts.positionChart_x_Tooltip") })}
        {children.startAngle.propertyView({ label: trans("gaugeChart.startAngle"), tooltip: trans("echarts.startAngleTooltip") })}
        {children.endAngle.propertyView({ label: trans("gaugeChart.endAngle"), tooltip: trans("echarts.endAngleTooltip") })}
        {children.barometerPointerLength.propertyView({ label: trans("gaugeChart.pointerLength"), tooltip: trans("echarts.pointerLengthTooltip") })}
        {children.barometerPointerWidth.propertyView({ label: trans("gaugeChart.pointerWidth"), tooltip: trans("echarts.pointerWidthTooltip") })}
        {children.barometerPointer_Y.propertyView({ label: trans("gaugeChart.pointer_Y"), tooltip: trans("gaugeChart.pointer_Y_Tooltip") })}
        {children.barometerPointerIcon.propertyView({ label: trans("gaugeChart.pointerIcon"), tooltip: trans("gaugeChart.pointerIconTooltip") })}
        {children.tooltip.propertyView({ label: trans("gaugeChart.tooltip"), tooltip: trans("echarts.tooltipVisibilityTooltip") })}
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
      <Section name={sectionNames.axisLabelStyleOutline}>
        {children.axisLabelStyleOutline?.getPropertyView()}
      </Section>
      <Section name={sectionNames.layout}>{hiddenPropertyView(children)}</Section>
      <Section name={sectionNames.advanced}>
        {children.barometerGaugeOption.propertyView({
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

  const clockGaugePropertyView = (
    <>
      <Section name={trans("chart.config")}>
        {children.clockGaugeData.propertyView({ label: trans("chart.data") })}
        {children.chartType.propertyView({label: trans("gaugeChart.chartType"), tooltip: trans("gaugeChart.chartTypeTooltip") })}
        {children.echartsTitleConfig.getPropertyView()}
        {children.echartsTitle.propertyView({ label: trans("gaugeChart.title"), tooltip: trans("echarts.titleTooltip") })}
        {children.radius.propertyView({ label: trans("gaugeChart.radius"), tooltip: trans("echarts.radiusTooltip") })}
        {children.clockPointerIcon.propertyView({ label: trans("gaugeChart.pointerIcon"), tooltip: trans("gaugeChart.pointerIconTooltip") })}
        {children.progressBarWidth.propertyView({ label: trans("gaugeChart.progressBarWidth"), tooltip: trans("echarts.pointerWidthTooltip") })}
        {children.axisTickLength.propertyView({ label: trans("gaugeChart.axisTickLength"), tooltip: trans("echarts.axisTickLengthTooltip") })}
        {children.axisTickWidth.propertyView({ label: trans("gaugeChart.axisTickWidth"), tooltip: trans("echarts.axisTickWidthTooltip") })}
        {children.axisLabelDistance.propertyView({ label: trans("gaugeChart.axisLabelDistance"), tooltip: trans("echarts.axisLabelDistanceTooltip") })}
        {children.axisTickColor.propertyView({ label: trans("gaugeChart.axisTickColor"), tooltip: trans("echarts.axisTickColorTooltip") })}
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
      {/*<Section name={sectionNames.detailStyle}>*/}
      {/*  {children.legendStyle?.getPropertyView()}*/}
      {/*</Section>*/}
      <Section name={sectionNames.axisLabelStyle}>
        {children.axisLabelStyle?.getPropertyView()}
      </Section>
      <Section name={sectionNames.layout}>{hiddenPropertyView(children)}</Section>
      <Section name={sectionNames.advanced}>
        {children.clockGaugeOption.propertyView({
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
