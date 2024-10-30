import {Section, sectionNames} from "components/Section";
import {trans} from "@lowcoder-ee/i18n";
import {useContext} from "react";
import {disabledPropertyView, EditorContext, hiddenPropertyView, loadingPropertyView} from "lowcoder-sdk";

const PropertyView = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;;
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.resetAfterSubmit.propertyView({ label: trans("formComp.resetAfterSubmit") })}
            </Section>

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <><Section name={sectionNames.interaction}>
                    {children.onEvent.getPropertyView()}
                    {disabledPropertyView(children)}
                    {children.disableSubmit.propertyView({ label: trans("formComp.disableSubmit") })}
                    {hiddenPropertyView(children)}
                    {loadingPropertyView(children)}
                </Section>
                </>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <>
                    <Section name={sectionNames.layout}>
                        {children.container.getPropertyView()}
                    </Section>
                </>
            )}

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <Section name={sectionNames.advanced}>
                    {children.initialData.propertyView({ label: trans("formComp.initialData") })}
                </Section>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <>
                    <Section name={sectionNames.style}>
                        {children.container.stylePropertyView()}
                    </Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>
                        {children.animationStyle.getPropertyView()}
                    </Section>
                    {children.container.children.showHeader.getView() && (
                        <Section name={"Header Style"}>
                            { children.container.headerStylePropertyView() }
                        </Section>
                    )}
                    {children.container.children.showBody.getView() && (
                        <Section name={"Body Style"}>
                            { children.container.bodyStylePropertyView() }
                        </Section>
                    )}
                    {children.container.children.showFooter.getView() && (
                        <Section name={"Footer Style"}>
                            { children.container.footerStylePropertyView() }
                        </Section>
                    )}
                </>
            )}

        </>
    );
});


export default PropertyView;