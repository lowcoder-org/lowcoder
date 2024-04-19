import { RecordConstructorToComp } from "lowcoder-core";
import { BoolControl } from "../../controls/boolControl";
import { LabelControl } from "../../controls/labelControl";
import { AlkjdfControl, ArrowControl, BoolCodeControl, MaskControl, StringControl } from "../../controls/codeControl";
import { Section, sectionNames } from "lowcoder-design";
import { SelectEventHandlerControl } from "../../controls/eventHandlerControl";
import { stateComp } from "../../generators";
import { RefControl } from "comps/controls/refControl";
import { BaseSelectRef } from "rc-select";
import { refMethods } from "comps/generators/withMethodExposing";
import { blurMethod, focusMethod } from "comps/utils/methodUtils";
import { TourStepControl } from "@lowcoder-ee/comps/controls/tourStepControl";
import { booleanExposingStateControl, dropdownControl } from "lowcoder-sdk";
import { trans } from "i18n";
import { PlacementOptions, TypeOptions } from "@lowcoder-ee/comps/comps/tourComp/tourControlConstants";
import {
  IndicatorsRenderTooltip, TourArrowTooltip,
  TourMaskTooltip,
  TourPlacementTooltip, TourStepArrowTooltip, TourStepMaskTooltip
} from "@lowcoder-ee/comps/comps/tourComp/tourTooltips";

export const TourChildrenMap = {
  open: booleanExposingStateControl("open"),
  options: TourStepControl,
  // indicatorsRender: AlkjdfControl, // todo get this working later
  disabledInteraction: BoolControl,
  mask: MaskControl,
  placement: dropdownControl(PlacementOptions, "bottom"),
  arrow: ArrowControl,
  type: dropdownControl(TypeOptions, "default"),
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
      {/*{children.indicatorsRender.propertyView({*/}
      {/*  label: trans("tour.indicatorsRender.label"),*/}
      {/*  tooltip: IndicatorsRenderTooltip,*/}
      {/*})}*/}
      {children.disabledInteraction.propertyView({
        label: trans("tour.disabledInteraction.label"),
        tooltip: trans("tour.disabledInteraction.tooltip")
      })}
      {children.mask.propertyView({
        label: trans("tour.mask.label"),
        tooltip: TourMaskTooltip,
      })}
      {children.placement.propertyView({
        label: trans("tour.placement.label"),
        tooltip: TourPlacementTooltip,
        radioButton: false
      })}
      {children.arrow.propertyView({
        label: trans("tour.arrow.label"),
        tooltip: TourArrowTooltip,
      })}
      {children.type.propertyView({
        label: trans("tour.type.label"),
        tooltip: trans("tour.type.tooltip")
      })}
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

// export const baseSelectRefMethods = refMethods<BaseSelectRef>([
//   focusMethod,
//   blurMethod,
// ]);
