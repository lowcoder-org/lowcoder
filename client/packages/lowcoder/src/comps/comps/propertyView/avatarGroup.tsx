import { Section, sectionNames } from "components/Section";
import { trans } from "@lowcoder-ee/i18n";
import React, {useContext} from "react";
import {EditorContext, hiddenPropertyView} from "lowcoder-sdk";
const PropertyViewAvatarGroup1 = ((children: any) => {
    return (
        <>
            {children.src.propertyView({ label: trans("avatarComp.src"), placeholder: "", tooltip: trans("avatarComp.avatarCompTooltip") })}
            {children.label.propertyView({
                label: trans("avatarComp.title"),
                tooltip: trans("avatarComp.avatarCompTooltip"),
            })}
            {children.AvatarIcon.propertyView({
                label: trans("avatarComp.icon"),
                IconType: "All",
                tooltip: trans("avatarComp.avatarCompTooltip"),
            })}
            {children.color.propertyView({ label: trans("style.fill") })}
            {children.backgroundColor.propertyView({ label: trans("style.background") })}
            {children.Tooltip.propertyView({ label: trans("badge.tooltip") })}
        </>
    );
});

const PropertyViewAvatarGroup2 = ((children: any) => {
    return (
        <>
            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.basic}>
                        {children.avatars.propertyView({})}
                        {children.maxCount.propertyView({
                            label: trans("avatarGroup.maxCount")
                        })}
                        {children.avatarSize.propertyView({
                            label: trans("avatarGroup.avatarSize")
                        })}
                        {children.autoColor.propertyView({
                            label: trans("avatarGroup.autoColor")
                        })}
                        {children.alignment.propertyView({
                            label: trans("avatarGroup.alignment"),
                            radioButton: true,
                        })}
                    </Section>
                    <Section name={sectionNames.interaction}>
                        {hiddenPropertyView(children)}
                        {children.onEvent.propertyView()}
                    </Section>
                </>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.avatarStyle}>
                        {children.avatar.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.style}>
                        {children.style.getPropertyView()}
                    </Section>
                </>
            )}
        </>
    );
});

export { PropertyViewAvatarGroup1, PropertyViewAvatarGroup2 };

