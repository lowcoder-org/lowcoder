import {Section, sectionNames} from "components/Section";
import {trans} from "@lowcoder-ee/i18n";
import {FormDataPropertyView} from "@lowcoder-ee/comps/comps/formComp/formDataConstants";
import React, {useContext} from "react";
import {
    codeControl,
    disabledPropertyView,
    EditorContext,
    hiddenPropertyView,
    NumberControl,
    RecordConstructorToComp
} from "lowcoder-sdk";
import _ from "lodash";


const FileSizeControl = codeControl((value) => {
    if (typeof value === "number") {
        return value;
    }

    if (typeof value === "string") {
        const str = value.trim();

        if (str === "") {
            return 0;
        }

        const strInNum = Number(str);
        if (!_.isNaN(strInNum)) {
            return strInNum;
        }

        const units = ["bytes", "kb", "mb", "gb", "tb"];
        const regExp = new RegExp("^\\d+\\s*[kmgt]b$", "i");
        if (regExp.test(str)) {
            const num: number = parseInt(str.match("^\\d+")?.[0] ?? "", 10);
            const exponent = units.findIndex((unit) => str.search(new RegExp(unit, "i")) !== -1);
            return num * Math.pow(1024, exponent);
        }
    }
    throw new TypeError(trans("file.typeErrorMsg", { value: typeof value }));
});

const ParseFileTooltip = (
    <>
        <div>{trans("file.parsedValueTooltip1")}</div>
        <div>{trans("file.parsedValueTooltip2")}</div>
    </>
);

const validationChildren = {
    minSize: FileSizeControl,
    maxSize: FileSizeControl,
    maxFiles: NumberControl,
};

const commonValidationFields = (children: RecordConstructorToComp<typeof validationChildren>) => [
    children.minSize.propertyView({
        label: trans("file.minSize"),
        placeholder: "1kb",
        tooltip: trans("file.minSizeTooltip"),
    }),
    children.maxSize.propertyView({
        label: trans("file.maxSize"),
        placeholder: "10kb",
        tooltip: trans("file.maxSizeTooltip"),
    }),
];

const PropertyView = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            <Section name={sectionNames.basic}>
                {children.text.propertyView({
                    label: trans("text"),
                })}
                {children.uploadType.propertyView({ label: trans("file.uploadType") })}
            </Section>

            <FormDataPropertyView {...children} />

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <><Section name={sectionNames.validation}>
                    {children.uploadType.getView() !== "single" && children.maxFiles.propertyView({ label: trans("file.maxFiles") })}
                    {commonValidationFields(children)}
                </Section>
                    <Section name={sectionNames.interaction}>
                        {children.onEvent.getPropertyView()}
                        {disabledPropertyView(children)}
                        {hiddenPropertyView(children)}
                    </Section>
                    <Section name={sectionNames.advanced}>
                        {children.fileType.propertyView({
                            label: trans("file.fileType"),
                            placeholder: '[".png"]',
                            tooltip: (
                                <>
                                    {trans("file.reference")}{" "}
                                    <a href={trans("file.fileTypeTooltipUrl")} target="_blank" rel="noreferrer">
                                        {trans("file.fileTypeTooltip")}
                                    </a>
                                </>
                            ),
                        })}
                        {children.prefixIcon.propertyView({ label: trans("button.prefixIcon") })}
                        {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
                        {children.forceCapture.propertyView({
                            label: trans("file.forceCapture"),
                            tooltip: trans("file.forceCaptureTooltip")
                        })}
                        {children.showUploadList.propertyView({ label: trans("file.showUploadList") })}
                        {children.parseFiles.propertyView({
                            label: trans("file.parseFiles"),
                            tooltip: ParseFileTooltip,
                            placement: "right",
                        })}
                    </Section>
                </>
            )}

            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <>
                    <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
                    <Section name={sectionNames.animationStyle} hasTooltip={true}>{children.animationStyle.getPropertyView()}</Section>
                </>
            )}
        </>
    );
});

export default PropertyView;