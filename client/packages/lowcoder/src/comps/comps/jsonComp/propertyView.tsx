import {Section, sectionNames} from "components/Section";
import {trans} from "@lowcoder-ee/i18n";
import {FormDataPropertyView} from "@lowcoder-ee/comps/comps/formComp/formDataConstants";
import {useContext} from "react";
import {EditorContext, hiddenPropertyView} from "lowcoder-sdk";


const PropertyViewJsonEditor = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.value.propertyView({ label: trans("export.jsonEditorDesc") })}
            </Section>

            <FormDataPropertyView {...children} />

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <Section name={sectionNames.interaction}>
                    {children.onEvent.getPropertyView()}
                    {hiddenPropertyView(children)}
                </Section>
            )}
            <Section name={trans('prop.height')}>
                {children.autoHeight.propertyView({ label: trans('prop.height') })}
            </Section>
            {!children.autoHeight.getView()&&<Section name={sectionNames.layout}>
                {children.showVerticalScrollbar.propertyView({label: trans('prop.showVerticalScrollbar')})}

            </Section>}
            {(editorModeStatus === "layout" || editorModeStatus === "both") && ( children.label.getPropertyView() )}
            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <>
                    <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>{children.animationStyle.getPropertyView()}</Section>
                </>
            )}

        </>
    );
});


const PropertyViewJsonExplorer = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.value.propertyView({ label: trans("export.jsonEditorDesc") })}
            </Section>

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <Section name={sectionNames.interaction}>
                    {hiddenPropertyView(children)}
                    {children.expandToggle.propertyView({ label: trans("jsonExplorer.expandToggle") })}
                </Section>
            )}

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <Section name={sectionNames.advanced}>
                    {children.indent.propertyView({ label: trans("jsonExplorer.indent") })}
                </Section>
            )}
            <Section name={trans('prop.height')}>
                {children.autoHeight.propertyView({label: trans('prop.height')})}
            </Section>
            {!children.autoHeight.getView()&&<Section name={sectionNames.layout}>
                {children.showVerticalScrollbar.propertyView({
                    label: trans('prop.showVerticalScrollbar'),
                })}
            </Section>}
            {(editorModeStatus === 'layout' ||
                editorModeStatus === 'both') && (
                <>
                    <Section name={sectionNames.style}>
                        {children.theme.propertyView({
                            label: trans('jsonExplorer.theme'),
                        })}
                    </Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>
                        {children.animationStyle.getPropertyView()}
                    </Section>
                </>
            )}
        </>
    );
});

const PropertyViewJsonLottie = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;

    return (
        <>
            <Section name={sectionNames.basic}>
                {children.value.propertyView({
                    label: trans("jsonLottie.lottieJson"),
                })}
            </Section>

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <><Section name={sectionNames.interaction}>
                    {children.speed.propertyView({ label: trans("jsonLottie.speed")})}
                    {children.loop.propertyView({ label: trans("jsonLottie.loop")})}
                    {children.animationStart.propertyView({ label: trans("jsonLottie.animationStart")})}
                    {children.keepLastFrame.propertyView({ label: trans("jsonLottie.keepLastFrame")})}
                    {hiddenPropertyView(children)}
                </Section>
                </>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <>
                    <Section name={sectionNames.style}>
                        {children.container.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>
                        {children.animationStyle.getPropertyView()}
                    </Section>
                </>
            )}
        </>
    );
});

export { PropertyViewJsonLottie, PropertyViewJsonExplorer, PropertyViewJsonEditor }

