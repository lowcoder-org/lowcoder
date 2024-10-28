import {disabledPropertyView, EditorContext, hiddenPropertyView, Section, sectionNames} from "lowcoder-sdk";
import React, {useContext} from "react";
import {trans} from "@lowcoder-ee/i18n";

const SetPropertyViewContainerComp = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <Section name={sectionNames.interaction}>
                    {disabledPropertyView(children)}
                    {hiddenPropertyView(children)}
                </Section>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <><Section name={sectionNames.layout}>
                    {children.container.getPropertyView()}
                </Section>
                    <Section name={sectionNames.style}>
                        { children.container.stylePropertyView() }
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
    )
});

const SetPropertyViewTextContainer = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.type.propertyView({label: trans("value"), tooltip: trans("textShow.valueTooltip"), radioButton: true,})}
                {children.text.propertyView({})}
            </Section>

            {["logic", "both"].includes(editorModeStatus) && (
                <Section name={sectionNames.interaction}>
                    {hiddenPropertyView(children)}
                </Section>
            )}
            {["layout", "both"].includes(editorModeStatus) && (
                <>
                    <Section name={sectionNames.layout}>
                        {children.container.getPropertyView()}
                        {children.width.propertyView({label: trans("container.flowWidth")})}
                        {children.float.propertyView({ label: trans("container.floatType"), radioButton: true,
                        })}
                        {children.horizontalAlignment.propertyView({
                            label: trans("textShow.horizontalAlignment"),
                            radioButton: true,
                        })}
                    </Section>
                    <Section name={"Floating Text Style"}>
                        {children.style.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>
                        {children.animationStyle.getPropertyView()}
                    </Section>
                    <Section name={"Container Style"}>
                        {children.container.stylePropertyView()}
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
    )
})

const SetPropertyViewPageLayout = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;

    return (
        <>
            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <Section name={sectionNames.interaction}>
                    {disabledPropertyView(children)}
                    {hiddenPropertyView(children)}
                    { children.container.appSelectorPropertyView()}
                </Section>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <><Section name={sectionNames.layout}>
                    {children.container.getPropertyView()}
                </Section>
                    <Section name={sectionNames.style}>
                        { children.container.stylePropertyView() }
                    </Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>
                        {children.animationStyle.getPropertyView()}
                    </Section>
                    {children.container.children.showHeader.getView() && (
                        <Section name={"Header Style"}>
                            { children.container.headerStylePropertyView() }
                        </Section>
                    )}
                    {children.container.children.showSider.getView() && (
                        <Section name={"Sider Style"}>
                            { children.container.siderStylePropertyView() }
                        </Section>
                    )}
                    <Section name={"Body Style"}>
                        { children.container.bodyStylePropertyView() }
                    </Section>
                    {children.container.children.showFooter.getView() && (
                        <Section name={"Footer Style"}>
                            { children.container.footerStylePropertyView() }
                        </Section>
                    )}
                </>
            )}
        </>
    )
})

const SetPropertyViewCardComp = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <>
                    <Section name={sectionNames.basic}>
                        {children.size.propertyView({
                            label: trans("card.titleSize"),
                            radioButton: true,
                        })}
                        {children.showTitle.propertyView({ label: trans('card.showTitle') })}
                        {children.showTitle.getView() && children.title.propertyView({ label: trans('card.title') })}
                        {children.showTitle.getView() && children.extraTitle.propertyView({ label: trans('card.extraTitle') })}
                        {
                            children.cardType.getView() == 'common' &&
                            children.CoverImg.propertyView({ label: trans('card.CoverImg') })
                        }

                        {
                            children.cardType.getView() == 'common' &&
                            children.CoverImg.getView() &&
                            children.imgSrc.propertyView({ label: trans('card.imgSrc') })
                        }
                        {
                            children.cardType.getView() == 'common' &&
                            children.CoverImg.getView() &&
                            children.imgHeight.propertyView({ label: trans('card.imgHeight') })
                        }
                        {
                            children.cardType.getView() == 'common' &&
                            children.showMeta.propertyView({ label: trans('card.showMeta') })
                        }
                        {
                            children.cardType.getView() == 'common' &&
                            children.showMeta.getView() &&
                            children.metaTitle.propertyView({ label: trans('card.metaTitle') })
                        }
                        {
                            children.cardType.getView() == 'common' &&
                            children.showMeta.getView() &&
                            children.metaDesc.propertyView({ label: trans('card.metaDesc') })
                        }

                        {
                            children.cardType.getView() == 'common' &&
                            children.showActionIcon.propertyView({ label: trans('card.showActionIcon') })
                        }
                        {
                            children.cardType.getView() == 'common' &&
                            children.showActionIcon.getView() &&
                            children.actionOptions.propertyView({ title: trans('card.actionOptions') })
                        }

                    </Section>
                    <Section name={sectionNames.interaction}>
                        {hiddenPropertyView(children)}
                        {children.onEvent.getPropertyView()}
                    </Section>
                </>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <>
                    <Section name={sectionNames.layout}>
                        {children.cardType.propertyView({
                            label: trans("card.cardType"),
                            radioButton: true,
                        })}
                    </Section>
                    <Section name={sectionNames.style}>
                        {children.style.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.headerStyle}>
                        {children.headerStyle.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.bodyStyle}>
                        {children.bodyStyle.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>
                        {children.animationStyle.getPropertyView()}
                    </Section>
                </>
            )}
        </>
    )}
)

export {SetPropertyViewContainerComp, SetPropertyViewTextContainer, SetPropertyViewPageLayout, SetPropertyViewCardComp};