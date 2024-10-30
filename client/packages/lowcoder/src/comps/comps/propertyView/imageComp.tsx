import {Section, sectionNames} from "components/Section";
import {trans} from "@lowcoder-ee/i18n";
import {useContext} from "react";
import {EditorContext, hiddenPropertyView} from "lowcoder-sdk";

const PropertyView = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.src.propertyView({
                    label: trans("image.src"),
                })}
            </Section>

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <Section name={sectionNames.interaction}>
                    {children.onEvent.getPropertyView()}
                    {hiddenPropertyView(children)}
                    {children.supportPreview.propertyView({
                        label: trans("image.supportPreview"),
                        tooltip: trans("image.supportPreviewTip"),
                    })}
                </Section>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.layout}>
                        {children.autoHeight.getPropertyView()}
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
})

export default PropertyView;
