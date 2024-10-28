import {Section, sectionNames} from "components/Section";
import {trans} from "@lowcoder-ee/i18n";
import {useContext} from "react";
import {disabledPropertyView, EditorContext, hiddenPropertyView} from "lowcoder-sdk";
import {FormDataPropertyView} from "@lowcoder-ee/comps/comps/formComp/formDataConstants";

const SetPropertyViewAudioComp = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.src.propertyView({
                    label: trans("audio.src"),
                    tooltip: trans("audio.srcDesc"),
                })}
            </Section>

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <Section name={sectionNames.interaction}>
                    {children.onEvent.getPropertyView()}
                    {hiddenPropertyView(children)}
                    {children.autoPlay.propertyView({
                        label: trans("audio.autoPlay"),
                    })}
                    {children.loop.propertyView({
                        label: trans("audio.loop"),
                    })}
                </Section>
            )}
            <Section name={sectionNames.style}>
                {children.style.getPropertyView()}
            </Section>
            <Section name={sectionNames.animationStyle} hasTooltip={true}>
                {children.animationStyle.getPropertyView()}
            </Section>
        </>
    );
});

const SetPropertyViewColorPicker = ((children: any) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.value.propertyView({ label: trans("prop.defaultValue") })}
            </Section>

            <FormDataPropertyView {...children} />
            {children.label.getPropertyView()}
            <Section name={sectionNames.interaction}>
                {children.onEvent.getPropertyView()}
                {disabledPropertyView(children)}
            </Section>

            <Section name={sectionNames.advanced}>
                {children.trigger.propertyView({ label: trans("colorPicker.trigger"), radioButton: true })}
                {children.disabledAlpha.propertyView({ label: trans("colorPicker.disabledAlpha") })}
                {children.showPresets.propertyView({ label: trans("colorPicker.showPresets") })}
                {children.showPresets.getView() && children.presets.propertyView({ label: trans("colorPicker.recommended") })}
            </Section>

            <Section name={sectionNames.layout}>{hiddenPropertyView(children)}</Section>

            <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
        </>
    );
});

const SetPropertyViewVideoComp = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.src.propertyView({
                    label: trans("video.src"),
                    tooltip: trans("video.srcDesc"),
                })}
            </Section>

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (

                <><Section name={sectionNames.interaction}>
                    {children.onEvent.getPropertyView()}
                    {hiddenPropertyView(children)}
                </Section>
                    <Section name={sectionNames.advanced}>
                        {children.poster.propertyView({
                            label: trans("video.poster"),
                            tooltip: trans("video.posterTooltip"),
                        })}
                        {children.volume.propertyView({
                            label: trans("video.volume"),
                            tooltip: trans("video.volumeTooltip"),
                        })}
                        {children.playbackRate.propertyView({
                            label: trans("video.playbackRate"),
                            tooltip: trans("video.playbackRateTooltip"),
                        })}
                        {children.autoPlay.propertyView({
                            label: trans("video.autoPlay"),
                            tooltip: trans("video.autoPlayTooltip"),
                        })}
                        {children.loop.propertyView({
                            label: trans("video.loop"),
                        })}
                        {children.controls.propertyView({
                            label: trans("video.controls"),
                            tooltip: trans("video.controlsTooltip"),
                        })}

                    </Section>
                    <Section name={sectionNames.style}>
                        {children.style.getPropertyView()}
                    </Section>
                    {/* <Section name={sectionNames.animationStyle} hasTooltip={true}>
                {children.animationStyle.getPropertyView()}
              </Section> */}
                </>
            )}
        </>
    );
});

export { SetPropertyViewVideoComp, SetPropertyViewAudioComp, SetPropertyViewColorPicker }