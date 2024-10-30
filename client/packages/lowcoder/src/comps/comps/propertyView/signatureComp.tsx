import {Section, sectionNames} from "components/Section";
import {trans} from "@lowcoder-ee/i18n";
import {FormDataPropertyView} from "@lowcoder-ee/comps/comps/formComp/formDataConstants";
import React, {useContext} from "react";
import {EditorContext, hiddenPropertyView} from "lowcoder-sdk";

const PropertyView = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.tips.propertyView({ label: trans("signature.tips") })}
            </Section>

            <FormDataPropertyView {...children} />

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <Section name={sectionNames.interaction}>
                    {children.onEvent.getPropertyView()}
                    {hiddenPropertyView(children)}
                    {children.showUndo.propertyView({ label: trans("signature.showUndo") })}
                    {children.showClear.propertyView({ label: trans("signature.showClear") })}
                </Section>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                children.label.getPropertyView()
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.style}>
                        {children.style.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.labelStyle}>
                        {children.labelStyle.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.inputFieldStyle}>
                        {children.inputFieldStyle.getPropertyView()}
                    </Section>
                </>
            )}
        </>
    );
})

export default PropertyView;