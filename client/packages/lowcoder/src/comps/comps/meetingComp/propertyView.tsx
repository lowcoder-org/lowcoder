import { Section, sectionNames } from "components/Section";
import { trans } from "@lowcoder-ee/i18n";
import React, { useContext } from "react";
import { disabledPropertyView, EditorContext, hiddenPropertyView, loadingPropertyView } from "lowcoder-sdk";
console.log("meeting")

const PropertyView = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.prefixIcon.propertyView({
                    label: trans("button.icon"),
                })}
            </Section>

            {(editorModeStatus === "logic" ||
                editorModeStatus === "both") && (
                <Section name={sectionNames.interaction}>
                    {children.onEvent.getPropertyView()}
                    {disabledPropertyView(children)}
                    {hiddenPropertyView(children)}
                    {loadingPropertyView(children)}
                </Section>
            )}

            {(editorModeStatus === "layout" ||
                editorModeStatus === "both") && (
                <>
                    <Section name={sectionNames.layout}>
                        {children.autoHeight.getPropertyView()}
                        {children.iconSize.propertyView({
                            label: trans("button.iconSize"),
                        })}
                    </Section>
                    <Section name={sectionNames.style}>
                        {children.style.getPropertyView()}
                        {children.aspectRatio.propertyView({
                            label: trans("style.aspectRatio"),
                        })}
                    </Section>
                </>
            )}
        </>
    );
});

export default PropertyView;