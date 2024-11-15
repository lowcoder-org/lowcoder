import { Section, sectionNames } from "components/Section";
import { trans } from "@lowcoder-ee/i18n";
import React, { useContext } from "react";
import { disabledPropertyView, EditorContext, hiddenPropertyView, loadingPropertyView } from "lowcoder-sdk";


function isDefault(type?: string) {
    return !type;
}

const PropertyView = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <><Section name={sectionNames.interaction}>
                    {children.model.propertyView({ label: trans("customComp.data") })}
                    {children.code.propertyView({ label: trans("customComp.code"), language: "html" })}
                    {hiddenPropertyView(children)}
                </Section>
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