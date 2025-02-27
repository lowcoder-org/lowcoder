import { changeChildAction, CompAction } from "lowcoder-core";
import { ChartCompChildrenType, getDataKeys } from "./line3dChartConstants";
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

export function line3dChartPropertyView(
  children: ChartCompChildrenType,
  dispatch: (action: CompAction) => void
) {
  const uiModePropertyView = (
    <>
      <Section name={trans('chart.data')}>
        {children.environment.propertyView({label: trans("line3dchart.environment")})}
        {children.baseTexture.propertyView({label: trans("line3dchart.baseTexture")})}
        {children.heightTexture.propertyView({label: trans("line3dchart.heightTexture")})}
        {children.background.propertyView({label: trans("line3dchart.background")})}
        {children.lineStyleWidth.propertyView({label: trans("line3dchart.lineStyleWidth")})}
        {children.lineStyleColor.propertyView({label: trans("line3dchart.lineStyleColor")})}
        {children.lineStyleOpacity.propertyView({label: trans("line3dchart.lineStyleOpacity")})}
        {children.effectShow.propertyView({label: trans("line3dchart.effectShow")})}
        {children.effectShow.getView() && children.effectWidth.propertyView({label: trans("line3dchart.effectTrailWidth")})}
        {children.effectShow.getView() && children.effectLength.propertyView({label: trans("line3dchart.effectTrailLength")})}
        {children.effectShow.getView() && children.effectOpacity.propertyView({label: trans("line3dchart.effectTrailOpacity")})}
        {children.effectShow.getView() && children.effectColor.propertyView({label: trans("line3dchart.effectTrailColor")})}
      </Section>
      <Section name={sectionNames.interaction}>
        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          {children.onUIEvent.propertyView({title: trans("chart.chartEventHandlers")})}
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          {children.onEvent.propertyView()}
        </div>
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
