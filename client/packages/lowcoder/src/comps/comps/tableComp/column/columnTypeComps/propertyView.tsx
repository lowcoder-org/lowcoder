import {trans} from "@lowcoder-ee/i18n";
import {ColumnValueTooltip} from "@lowcoder-ee/comps/comps/tableComp/column/simpleColumnTypeComps";
import {
    DATE_FORMAT,
    DATE_TIME_FORMAT,
    disabledPropertyView,
    formatPropertyView,
    hiddenPropertyView
} from "lowcoder-sdk";

alert("table");

const SetPropertyViewColumnAvatarComp1 = ((children: any) => {
    return (
        <>
            {children.avatars.propertyView({})}
            {children.maxCount.propertyView({
                label: trans("avatarGroup.maxCount")
            })}
            {children.avatarSize.propertyView({
                label: trans("avatarGroup.avatarSize")
            })}
            {children.autoColor.propertyView({
                label: trans("avatarGroup.autoColor")
            })}
            {children.alignment.propertyView({
                label: trans("table.avatarGroupAlignment"),
                radioButton: true,
            })}
            {children.onEvent.propertyView()}
        </>
    );
});

const SetPropertyViewColumnBooleanComp = ((children: any) => {
    return (
        <>
            {children.text.propertyView({
                label: trans("table.columnValue"),
                tooltip: ColumnValueTooltip,
            })}
            {children.falseValues.propertyView({
                label: trans("table.falseValues"),
                radioButton: true,
            })}
            {children.iconTrue.propertyView({
                label: trans("table.iconTrue"),
            })}
            {children.iconFalse.propertyView({
                label: trans("table.iconFalse"),
            })}
            {children.iconNull.propertyView({
                label: trans("table.iconNull"),
            })}
        </>
    );
});

const SetPropertyViewColumnDropdownComp = ((children: any) => {
    return (
        <>
            {children.buttonType.propertyView({
                label: trans("table.type"),
                radioButton: true,
            })}
            {children.label.propertyView({
                label: trans("text"),
            })}
            {children.prefixIcon.propertyView({
                label: trans("button.prefixIcon"),
            })}
            {children.suffixIcon.propertyView({
                label: trans("button.suffixIcon"),
            })}
            {children.options.propertyView({
                title: trans("optionsControl.optionList"),
            })}
        </>
    );
});

const SetPropertyViewColumnNumberComp = ((children: any) => {
    let float = false;



    return (
        <>
            {children.text.propertyView({
                label: trans("table.columnValue"),
                tooltip: ColumnValueTooltip,
            })}
            {children.step.propertyView({
                label: trans("table.numberStep"),
                tooltip: trans("table.numberStepTooltip"),
                onFocus: (focused: boolean) => {
                    if(!focused) {
                        const value = children.step.getView();
                        const isFloat = children.float.getView();
                        const newValue = !isFloat ? Math.floor(value) : value;
                        children.step.dispatchChangeValueAction(String(newValue));
                    }
                }
            })}
            {float && (
                children.precision.propertyView({
                    label: trans("table.precision"),
                })
            )}
            {children.prefix.propertyView({
                label: trans("table.prefix"),
            })}
            {children.prefixIcon.propertyView({
                label: trans("button.prefixIcon"),
            })}
            {children.suffix.propertyView({
                label: trans("table.suffix"),
            })}
            {children.suffixIcon.propertyView({
                label: trans("button.suffixIcon"),
            })}
            {children.float.propertyView({
                label: trans("table.float"),
                onChange: (isFloat : boolean) => {
                    const value = children.step.getView();
                    const newValue = !isFloat ? Math.floor(value) : value;
                    children.step.dispatchChangeValueAction(String(newValue));
                }
            })}
        </>
    );
});

const SetPropertyViewColumnAvatarComp2 = ((children: any) => {
    return (
        <>
            {children.src.propertyView({ label: trans("avatarComp.src"), placeholder: "", tooltip: trans("avatarComp.avatarCompTooltip") })}
            {children.label.propertyView({label: trans("avatarComp.title"), tooltip: trans("avatarComp.avatarCompTooltip"),
            })}
            {children.AvatarIcon.propertyView({
                label: trans("avatarComp.icon"),
                IconType: "All",
                tooltip: trans("avatarComp.avatarCompTooltip"),
            })}
            {children.color.propertyView({ label: trans("style.fill") })}
            {children.backgroundColor.propertyView({ label: trans("style.background") })}
            {children.Tooltip.propertyView({ label: trans("badge.tooltip") })}
        </>
    );
});

const SetPropertyViewColumnDateComp = ((children: any) => {
    return (
        <>
            {children.text.propertyView({
                label: trans("table.columnValue"),
                tooltip: ColumnValueTooltip,
            })}
            {formatPropertyView({ children, placeholder: DATE_FORMAT })}
        </>
    );
});

const SetPropertyViewColumnDateTimeComp = ((children: any) => {
    return (
        <>
            {children.text.propertyView({
                label: trans("table.columnValue"),
                tooltip: ColumnValueTooltip,
            })}
            {formatPropertyView({ children, placeholder: DATE_TIME_FORMAT })}
        </>
    );
});

const SetPropertyViewColumnImgComp = ((children: any) => {
    return (
        <>
            {children.src.propertyView({
                label: trans("table.imageSrc"),
                tooltip: ColumnValueTooltip,
            })}
            {children.size.propertyView({
                label: trans("table.imageSize"),
            })}
        </>
    );
});

const SetPropertyViewColumnLinksComp1 = ((children: any) => {
    return (
        <>
            {children.label.propertyView({ label: trans("label") })}
            {children.onClick.propertyView({
                label: trans("table.action"),
                placement: "table",
            })}
            {hiddenPropertyView(children)}
            {disabledPropertyView(children)}
        </>
    );
});

const SetPropertyViewColumnLinksComp2 = ((children: any) => {
    return (
        <>
            {children.options.propertyView({
                newOptionLabel: trans("table.option"),
                title: trans("table.optionList"),
            })}
        </>
    );
});

const SetPropertyViewColumnProgressComp = ((children: any) => {
    return (
        <>
            {children.text.propertyView({
                label: trans("table.columnValue"),
                tooltip: ColumnValueTooltip,
            })}
            {children.showValue.propertyView({
                label: trans("table.showValue"),
            })}
        </>
    );
});

const SetPropertyViewColumnRatingComp = ((children: any) => {
    return (
        <>
            {children.text.propertyView({
                label: trans("table.columnValue"),
                tooltip: ColumnValueTooltip,
            })}
        </>
    );
});

const SetPropertyViewColumnSelectComp = ((children: any) => {
    return (
        <>
            {children.text.propertyView({
                label: trans("table.columnValue"),
                tooltip: ColumnValueTooltip,
            })}
            {children.options.propertyView({
                title: trans("optionsControl.optionList"),
            })}
        </>
    );
});

const SetPropertyViewColumnStatusComp = ((children: any) => {
    return (
        <>
            {children.text.propertyView({
                label: trans("table.columnValue"),
                tooltip: ColumnValueTooltip,
            })}
            {children.status.propertyView({
                label: trans("table.status"),
                tooltip: trans("table.statusTooltip"),
            })}
        </>
    );
});

const SetPropertyViewColumnSwitchComp = ((children: any) => {
    return (
        <>
            {children.switchState.propertyView({
                label: trans("table.columnValue"),
                tooltip: ColumnValueTooltip,
            })}
            {children.onEvent.propertyView()}
            {disabledPropertyView(children)}
        </>
    );
});

const SetPropertyViewColumnTagsComp = ((children: any) => {
    return (
        <>
            {children.text.propertyView({
                label: trans("table.columnValue"),
                tooltip: ColumnValueTooltip,
            })}
            {children.tagColors.propertyView({
                title: "test",
            })}
        </>
    );
});

const SetPropertyViewSimpleTextComp = ((children: any) => {
    return (
        <>
            {children.text.propertyView({
                label: trans("table.columnValue"),
                tooltip: ColumnValueTooltip,
            })}
            {children.prefixIcon.propertyView({
                label: trans("button.prefixIcon"),
            })}
            {children.suffixIcon.propertyView({
                label: trans("button.suffixIcon"),
            })}
        </>
    );
});

export { SetPropertyViewColumnAvatarComp1,
    SetPropertyViewColumnBooleanComp,
    SetPropertyViewColumnDropdownComp,
    SetPropertyViewColumnNumberComp,
    SetPropertyViewColumnAvatarComp2,
    SetPropertyViewColumnDateComp,
    SetPropertyViewColumnDateTimeComp,
    SetPropertyViewColumnImgComp,
    SetPropertyViewColumnLinksComp1,
    SetPropertyViewColumnLinksComp2,
    SetPropertyViewColumnProgressComp,
    SetPropertyViewColumnRatingComp,
    SetPropertyViewColumnSelectComp,
    SetPropertyViewColumnStatusComp,
    SetPropertyViewColumnSwitchComp,
    SetPropertyViewColumnTagsComp,
    SetPropertyViewSimpleTextComp
}

