import {useContext} from "react";
import {EditorContext, hiddenPropertyView, Section, sectionNames} from "lowcoder-sdk";
import {trans} from "@lowcoder-ee/i18n";

const SetPropertyViewFn = ((children: any) => {
    const editorModeStatus = useContext(EditorContext).editorModeStatus;
    return (
        <>
            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <Section name={sectionNames.basic}>

                    {children.schema.propertyView({
                        key: trans("jsonSchemaForm.jsonSchema"),
                        label: (
                            <>
                                {trans("jsonSchemaForm.jsonSchema") + " ("}
                                <a
                                    href={"http://json-schema.org/learn/getting-started-step-by-step"}
                                    target={"_blank"}
                                    rel="noreferrer"
                                >
                                    Docs 1
                                </a>
                                {", "}
                                <a
                                    href={"https://jsonforms.io/examples/basic"}
                                    target={"_blank"}
                                    rel="noreferrer"
                                >
                                    Docs 2
                                </a>
                                {")"}
                            </>
                        ),
                        tooltip: (
                            <>
                                {trans("jsonSchemaForm.schemaTooltip") + " "}
                                <a
                                    href={"http://json-schema.org/learn/getting-started-step-by-step"}
                                    target={"_blank"}
                                    rel="noreferrer"
                                >
                                    JSON Schema
                                </a>
                            </>
                        ),
                    })}
                    {children.uiSchema.propertyView({
                        key: trans("jsonSchemaForm.uiSchema"),
                        label: (
                            <>
                                {trans("jsonSchemaForm.uiSchema") + " ("}
                                <a
                                    href={"https://jsonforms.io/docs/uischema"}
                                    target={"_blank"}
                                    rel="noreferrer"
                                >
                                    Docs 1
                                </a>
                                {", "}
                                <a
                                    href={"https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema"}
                                    target={"_blank"}
                                    rel="noreferrer"
                                >
                                    Docs 2
                                </a>
                                {")"}
                            </>
                        ),
                        tooltip: (
                            <>
                                {trans("jsonSchemaForm.schemaTooltip") + " "}
                                <a
                                    href={
                                        "https://jsonforms.io/docs/uischema"
                                    }
                                    target={"_blank"}
                                    rel="noreferrer"
                                >
                                    UI Schema
                                </a>
                            </>
                        ),
                    })}
                    {children.data.propertyView({
                        key: trans("jsonSchemaForm.defaultData"),
                        label: trans("jsonSchemaForm.defaultData"),
                    })}
                </Section>
            )}

            {(editorModeStatus === "logic" || editorModeStatus === "both") && (
                <Section name={sectionNames.interaction}>
                    {children.onEvent.getPropertyView()}
                    {hiddenPropertyView(children)}
                    {children.resetAfterSubmit.propertyView({
                        label: trans("jsonSchemaForm.resetAfterSubmit"),
                    })}
                </Section>
            )}
            {(editorModeStatus === "layout" || editorModeStatus === "both") && (
                <>
                    <Section name={sectionNames.layout}>
                        {children.autoHeight.getPropertyView()}
                        {!children.autoHeight.getView() && (
                            children.showVerticalScrollbar.propertyView({
                                label: trans("prop.showVerticalScrollbar"),
                            })
                        )}
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
});

export default SetPropertyViewFn