import React, {useContext} from "react";
import {EditorContext, hiddenPropertyView, Section, sectionNames} from "lowcoder-sdk";
import {trans} from "@lowcoder-ee/i18n";
import {CommentDataTooltip, CommentUserDataTooltip} from "@lowcoder-ee/comps/comps/commentComp/commentConstants";

const PropertyView = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.title.propertyView({
                    label: trans("comment.title"),
                })}
            </Section>

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <>
                    <Section name={sectionNames.data}>
                        {children.value.propertyView({
                            label: trans("comment.value"),
                            tooltip: CommentDataTooltip,
                            placeholder: "[]",
                        })}
                        {children.userInfo.propertyView({
                            label: trans("comment.userInfo"),
                            tooltip: CommentUserDataTooltip,
                        })}
                        {children.mentionList.propertyView({
                            label: trans("comment.mentionList"),
                            tooltip: trans("comment.mentionListDec"),
                        })}
                    </Section>
                    <Section name={sectionNames.interaction}>
                        {children.onEvent.getPropertyView()}
                        {hiddenPropertyView(children)}
                        {children.sendCommentAble.propertyView({
                            label: trans("comment.showSendButton"),
                        })}
                        {children.deleteAble.propertyView({
                            label: trans("comment.deleteAble"),
                        })}
                    </Section>
                </>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <><Section name={sectionNames.layout}>
                    {children.sendCommentAble.getView() &&
                        children.buttonText.propertyView({
                            label: trans("comment.buttonTextDec"),
                        })}
                    {children.placeholder.propertyView({
                        label: trans("comment.placeholderDec"),
                    })}
                </Section>
                    <Section name={sectionNames.style}>
                        {children.style.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>
                        {children.animationStyle.getPropertyView()}
                    </Section></>
            )}

        </>
    );
});

export default PropertyView;