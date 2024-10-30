
import {Section, sectionNames} from "components/Section";
import {trans} from "@lowcoder-ee/i18n";
import {EditorContext, hiddenPropertyView, placeholderPropertyView, readOnlyPropertyView} from "lowcoder-sdk";
import {FormDataPropertyView} from "@lowcoder-ee/comps/comps/formComp/formDataConstants";
import React, {useContext} from "react";

const PropertyView = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.value.propertyView({ label: trans("richTextEditor.defaultValue") })}
                {placeholderPropertyView(children)}
            </Section>

            <FormDataPropertyView {...children} />

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <Section name={sectionNames.interaction}>
                    {children.onEvent.getPropertyView()}
                    {hiddenPropertyView(children)}
                    {readOnlyPropertyView(children)}
                </Section>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.layout}>
                        {children.autoHeight.getPropertyView()}
                        {!children.autoHeight.getView() && children.contentScrollBar.propertyView({
                            label: trans("prop.textAreaScrollBar"),
                        })}
                        {children.toolbar.propertyView({ label: trans("richTextEditor.toolbar"), tooltip: trans("richTextEditor.toolbarDescription") })}
                        {children.hideToolbar.propertyView({ label: trans("richTextEditor.hideToolbar") })}
                    </Section>
                    <Section name={sectionNames.style}>
                        {children.style.getPropertyView()}
                    </Section>
                </>
            )}
        </>
    );
})

export default PropertyView;