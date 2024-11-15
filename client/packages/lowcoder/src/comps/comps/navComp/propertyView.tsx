import { Section, sectionNames } from "components/Section";
import { trans } from "@lowcoder-ee/i18n";
import React, { useContext } from "react";
import { disabledPropertyView, EditorContext, hiddenPropertyView, loadingPropertyView } from "lowcoder-sdk";
import {menuPropertyView} from "@lowcoder-ee/comps/comps/navComp/components/MenuItemList";

const PropertyView = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            <Section name={sectionNames.basic}>
                {menuPropertyView(children.items)}
            </Section>

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <Section name={sectionNames.interaction}>
                    {hiddenPropertyView(children)}
                </Section>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <Section name={sectionNames.layout}>
                    {children.horizontalAlignment.propertyView({
                        label: trans("navigation.horizontalAlignment"),
                        radioButton: true,
                    })}
                    {hiddenPropertyView(children)}
                </Section>
            )}

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <Section name={sectionNames.advanced}>
                    {children.logoUrl.propertyView({ label: trans("navigation.logoURL"), tooltip: trans("navigation.logoURLDesc") })}
                    {children.logoUrl.getView() && children.logoEvent.propertyView({ inline: true })}
                </Section>
            )}

            {(editorModeStatus === "layout" ||
                editorModeStatus === "both") && (
                <>
                    <Section name={sectionNames.style}>
                        {children.style.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>
                        {children.animationStyle.getPropertyView()}
                    </Section>
                </>
            )}
        </>
    );
});

export default PropertyView;