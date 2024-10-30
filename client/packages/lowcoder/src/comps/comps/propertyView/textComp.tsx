import {Section, sectionNames} from "components/Section";
import {trans} from "@lowcoder-ee/i18n";
import React, {useContext} from "react";
import {
    AlignCenter,
    AlignLeft, AlignRight,
    alignWithJustifyControl, AnimationStyle,
    AutoHeightControl, BoolControl, clickEvent, dropdownControl,
    EditorContext, eventHandlerControl,
    hiddenPropertyView,
    NewChildren,
    RecordConstructorToComp,
    stringExposingStateControl, styleControl, TextStyle, withDefault
} from "lowcoder-sdk";
import {MarginControl} from "@lowcoder-ee/comps/controls/marginControl";
import {PaddingControl} from "@lowcoder-ee/comps/controls/paddingControl";
import styled from "styled-components";
import {MultiIcon} from "@lowcoder-ee/comps/comps/multiIconDisplay";

const typeOptions = [
    {
        label: "Markdown",
        value: "markdown",
    },
    {
        label: trans("text"),
        value: "text",
    },
] as const;
const AlignTop = styled(MultiIcon(AlignLeft))`
  transform: rotate(90deg);
`;
const AlignBottom = styled(MultiIcon(AlignRight))`
  transform: rotate(90deg);
`;
const AlignVerticalCenter = styled(MultiIcon(AlignCenter))`
  transform: rotate(90deg);
`;
const VerticalAlignmentOptions = [
    { label: <AlignTop />, value: "flex-start" },
    { label: <AlignVerticalCenter />, value: "center" },
    { label: <AlignBottom />, value: "flex-end" },
] as const;
const EventOptions = [clickEvent] as const;
const childrenMap = {
    text: stringExposingStateControl(
        "text",
        trans("textShow.text", { name: "{{currentUser.name}}" })
    ),
    onEvent: eventHandlerControl(EventOptions),
    autoHeight: AutoHeightControl,
    type: dropdownControl(typeOptions, "markdown"),
    horizontalAlignment: alignWithJustifyControl(),
    contentScrollBar: withDefault(BoolControl, true),
    verticalAlignment: dropdownControl(VerticalAlignmentOptions, "center"),
    style: styleControl(TextStyle, 'style'),
    animationStyle: styleControl(AnimationStyle, 'animationStyle'),
    margin: MarginControl,
    padding: PaddingControl,
};
type ChildrenType = NewChildren<RecordConstructorToComp<typeof childrenMap>>;

const TextPropertyView = React.memo((props: {
    children: ChildrenType
}) => {
    return (
        <>
            <Section name={sectionNames.basic}>
                {props.children.type.propertyView({
                    label: trans("value"),
                    tooltip: trans("textShow.valueTooltip"),
                    radioButton: true,
                })}
                {props.children.text.propertyView({})}
            </Section>

            {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <Section name={sectionNames.interaction}>
                    {hiddenPropertyView(props.children)}
                    {props.children.onEvent.getPropertyView()}
                </Section>
            )}

            {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
                <>
                    <Section name={sectionNames.layout}>
                        {props.children.autoHeight.getPropertyView()}
                        {!props.children.autoHeight.getView() &&
                            props.children.contentScrollBar.propertyView({
                                label: trans("prop.contentScrollbar"),
                            })}
                        {!props.children.autoHeight.getView() &&
                            props.children.verticalAlignment.propertyView({
                                label: trans("textShow.verticalAlignment"),
                                radioButton: true,
                            })}
                        {props.children.horizontalAlignment.propertyView({
                            label: trans("textShow.horizontalAlignment"),
                            radioButton: true,
                        })}
                    </Section>
                    <Section name={sectionNames.style}>
                        {props.children.style.getPropertyView()}
                    </Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>
                        {props.children.animationStyle.getPropertyView()}
                    </Section>
                </>
            )}
        </>
    );
})

export default TextPropertyView;
