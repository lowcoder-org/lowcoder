import { Section, sectionNames } from "components/Section";
import { trans } from "@lowcoder-ee/i18n";
import React, { useContext } from "react";
import { disabledPropertyView, EditorContext, hiddenPropertyView, loadingPropertyView } from "lowcoder-sdk";
import {TimelineDataTooltip} from "@lowcoder-ee/comps/comps/timelineComp/timelineConstants";

console.log("timeline");

const PropertyView = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.value.propertyView({
                    label: trans("timeLine.value"),
                    tooltip: TimelineDataTooltip,
                    placeholder: "[]",
                })}
            </Section>

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <Section name={sectionNames.interaction}>
                    {children.onEvent.getPropertyView()}
                    {hiddenPropertyView(children)}
                </Section>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <><Section name={sectionNames.layout}>
                    {children.autoHeight.getPropertyView()}
                    {!children.autoHeight.getView() &&
                        children.verticalScrollbar.propertyView({
                            label: trans("prop.showVerticalScrollbar")
                        })}
                    {children.mode.propertyView({
                        label: trans("timeLine.mode"),
                        tooltip: trans("timeLine.modeTooltip"),
                    })}
                    {children.pending.propertyView({
                        label: trans("timeLine.pending"),
                        tooltip: trans("timeLine.pendingDescription"),
                    })}
                    {children.reverse.propertyView({
                        label: trans("timeLine.reverse"),
                    })}
                </Section>
                    <Section name={sectionNames.style}>
                        {children.style.getPropertyView()}
                    </Section>
                </>
            )}
        </>
    );
});

export default PropertyView;