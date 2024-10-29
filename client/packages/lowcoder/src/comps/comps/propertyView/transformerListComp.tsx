import {BottomTabs} from "@lowcoder-ee/pages/editor/bottom/BottomTabs";
import {trans} from "@lowcoder-ee/i18n";
import {BottomResTypeEnum} from "@lowcoder-ee/types/bottomRes";
import {DocLink, EditorContext, QueryTutorials, TacoMarkDown} from "lowcoder-sdk";
import SupaDemoDisplay from "@lowcoder-ee/comps/utils/supademoDisplay";
const SetPropertyViewFn = ((children: any) => {
    return (
        <EditorContext.Consumer>
            {(editorState) => {
                return (
                    <BottomTabs
                        runButtonText={trans("transformer.preview")}
                        type={BottomResTypeEnum.Transformer}
                        tabsConfig={[
                            {
                                key: "general",
                                title: trans("query.generalTab"),
                                children: (
                                    <div>
                                        {children.script.propertyView({
                                            placement: "bottom",
                                            styleName: "medium",
                                            width: "100%",
                                        })}
                                        {QueryTutorials.transformer && (
                                            <><br/><TacoMarkDown>{trans("transformer.documentationText")}</TacoMarkDown>
                                                <DocLink style={{ marginTop: 8 }} href={QueryTutorials.transformer} title={trans("transformer.documentationText")}>
                                                    {trans("transformer.docLink")}
                                                </DocLink><br/><br/>

                                                <SupaDemoDisplay
                                                    url={trans("supademos.transformer")}
                                                    modalWidth="80%"
                                                    modalTop="20px"
                                                />

                                            </>
                                        )}
                                    </div>
                                ),
                            },
                        ]}
                        tabTitle={children.name.getView()}
                        onRunBtnClick={() => {
                            editorState.setShowResultCompName(children.name.getView());
                        }}
                    />
                );
            }}
        </EditorContext.Consumer>
    );
})

export default SetPropertyViewFn;
