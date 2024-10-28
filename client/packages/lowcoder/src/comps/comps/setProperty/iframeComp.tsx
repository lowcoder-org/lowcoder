import {Section, sectionNames} from "components/Section";
import {trans} from "@lowcoder-ee/i18n";
import {useContext} from "react";
import {EditorContext, hiddenPropertyView} from "lowcoder-sdk";

const SetPropertyViewFn = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.url.propertyView({ label: "Source URL", placeholder: "https://example.com", tooltip: trans("iframe.URLDesc") })}
            </Section>

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <Section name={sectionNames.interaction}>
                    {hiddenPropertyView(children)}
                    {children.allowDownload.propertyView({ label: trans("iframe.allowDownload") })}
                    {children.allowSubmitForm.propertyView({ label: trans("iframe.allowSubmitForm") })}
                    {children.allowMicrophone.propertyView({ label: trans("iframe.allowMicrophone") })}
                    {children.allowCamera.propertyView({ label: trans("iframe.allowCamera") })}
                    {children.allowPopup.propertyView({ label: trans("iframe.allowPopup") })}
                </Section>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
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
})

export default SetPropertyViewFn;
