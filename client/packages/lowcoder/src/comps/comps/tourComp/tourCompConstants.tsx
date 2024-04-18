import { RecordConstructorToComp } from "lowcoder-core";
import { BoolControl } from "../../controls/boolControl";
import { LabelControl } from "../../controls/labelControl";
import { AlkjdfControl, BoolCodeControl, MaskControl, StringControl } from "../../controls/codeControl";
import { ControlNode, Section, sectionNames } from "lowcoder-design";
import { SelectEventHandlerControl } from "../../controls/eventHandlerControl";
import { useContext } from "react";
import { stateComp } from "../../generators";
import { RefControl } from "comps/controls/refControl";
import { BaseSelectRef } from "rc-select";
import { refMethods } from "comps/generators/withMethodExposing";
import { blurMethod, focusMethod } from "comps/utils/methodUtils";
import { TourStepControl } from "@lowcoder-ee/comps/controls/tourStepControl";
import { booleanExposingStateControl, dropdownControl } from "lowcoder-sdk";
import { trans } from "i18n";
import { PlacementOptions } from "@lowcoder-ee/comps/comps/tourComp/tourControlConstants";
import { IndicatorsRenderTooltip, TourMaskTooltip } from "@lowcoder-ee/comps/comps/tourComp/tourTooltips";

export const TourChildrenMap = {
  label: LabelControl,
  placeholder: StringControl,
  disabled: BoolCodeControl,
  open: booleanExposingStateControl("open"),
  onEvent: SelectEventHandlerControl,
  options: TourStepControl,
  inputValue: stateComp<string>(""), // user's input value when search
  showSearch: BoolControl.DEFAULT_TRUE,
  viewRef: RefControl<BaseSelectRef>,
  indicatorsRender: AlkjdfControl,
  disabledInteraction: BoolControl,
  mask: MaskControl,
  placement: dropdownControl(PlacementOptions, "bottom"),
};

export const TourPropertyView = (
  children: RecordConstructorToComp<
    typeof TourChildrenMap & {
      hidden: typeof BoolCodeControl;
    }
  > //& {
    // style: { getPropertyView: () => ControlNode };
  // }
) => (
  <>
    <Section name={sectionNames.basic}>
      {children.options.propertyView({})}
    </Section>
    
    <Section name="customization">
      {children.indicatorsRender.propertyView({
        label: trans("tour.indicatorsRender.label"),
        tooltip: IndicatorsRenderTooltip,
      })}
      {children.disabledInteraction.propertyView({
        label: trans("tour.disabledInteraction.label"),
        tooltip: trans("tour.disabledInteraction.tooltip")
      })}
      {children.mask.propertyView({
        label: trans("tour.mask.label"),
        tooltip: TourMaskTooltip,
      })}
      {/*{children.placement.propertyView({*/}
      {/*  label: trans("tour.placement.label"),*/}
      {/*  tooltip: TourPlacementTooltip,*/}
      {/*  radioButton: false*/}
      {/*})}*/}
    </Section>

    {/*{["layout", "both"].includes(*/}
    {/*  useContext(EditorContext).editorModeStatus*/}
    {/*) && (*/}
    {/*  <Section name={sectionNames.style}>*/}
    {/*    {children.style.getPropertyView()}*/}
    {/*  </Section>*/}
    {/*)}*/}
  </>
);

export const baseSelectRefMethods = refMethods<BaseSelectRef>([
  focusMethod,
  blurMethod,
]);
