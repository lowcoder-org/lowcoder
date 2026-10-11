import React from "react";
import { Section, sectionNames } from "lowcoder-design";
import { trans } from "i18n";

/**
 * Property view for toast component configuration
 */
export const ToastPropertyView = React.memo((props: { comp: any }) => {
  const { comp } = props;
  
  return (
    <>
      <Section name={sectionNames.basic}>
        {comp.children.title.propertyView({ 
          label: trans("toastComp.title"),
          placeholder: trans("toastComp.titlePlaceholder"),
        })}
        {comp.children.description.propertyView({ 
          label: trans("toastComp.description"),
          placeholder: trans("toastComp.descriptionPlaceholder"),
        })}
        {comp.children.type.propertyView({ 
          label: trans("toastComp.type"),
        })}
      </Section>
      
      <Section name={trans("toastComp.behavior")}>
        {comp.children.duration.propertyView({ 
          label: trans("toastComp.duration"),
          tooltip: trans("toastComp.durationTooltip"),
          placeholder: "4.5",
        })}
        {comp.children.placement.propertyView({ 
          label: trans("toastComp.placement"),
        })}
        {comp.children.dismissible.propertyView({ 
          label: trans("toastComp.dismissible"),
        })}
        {comp.children.showProgress.propertyView({ 
          label: trans("toastComp.showProgress"),
          tooltip: trans("toastComp.showProgressTooltip"),
        })}
        {comp.children.pauseOnHover.propertyView({ 
          label: trans("toastComp.pauseOnHover"),
        })}
      </Section>
      
      <Section name={sectionNames.layout}>
        {comp.children.width.propertyView({
          label: trans("toastComp.width"),
          tooltip: trans("toastComp.widthTooltip"),
          placeholder: "384px or 100vw",
        })}
        {comp.children.progressHeight.propertyView({
          label: trans("toastComp.progressHeight"),
          tooltip: trans("toastComp.progressHeightTooltip"),
          placeholder: "4px",
        })}
      </Section>
      
      <Section name={sectionNames.interaction}>
        {comp.children.onEvent.getPropertyView()}
      </Section>

      <Section name={sectionNames.style}>
        {comp.children.style.getPropertyView()}
      </Section>
    </>
  );
});

ToastPropertyView.displayName = "ToastPropertyView";
