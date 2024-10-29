import {BottomResTypeEnum} from "@lowcoder-ee/types/bottomRes";
import {trans} from "@lowcoder-ee/i18n";
import {DocLink, QueryTutorials, TacoMarkDown} from "lowcoder-sdk";
import SupaDemoDisplay from "@lowcoder-ee/comps/utils/supademoDisplay";
import {BottomTabs} from "@lowcoder-ee/pages/editor/bottom/BottomTabs";

const SetPropertyViewFn = ((children: any) => {
    return (
        <BottomTabs
            type={BottomResTypeEnum.TempState}
            tabsConfig={[
                {
                    key: "general",
                    title: trans("query.generalTab"),
                    children: children.value.propertyView({
                        label: trans("temporaryState.value"),
                        tooltip: trans("temporaryState.valueTooltip"),
                        placement: "bottom",
                        extraChildren: QueryTutorials.tempState && (
                            <><br/><TacoMarkDown>{trans("temporaryState.documentationText")}</TacoMarkDown><br/><DocLink style={{ marginTop: 8 }} href={QueryTutorials.tempState} title={trans("temporaryState.documentationText")}>
                                {trans("temporaryState.docLink")}
                            </DocLink><br/><br/>

                                <SupaDemoDisplay
                                    url={trans("supademos.temporarystate")}
                                    modalWidth="80%"
                                    modalTop="20px"
                                />
                            </>
                        ),
                    }),
                },
            ]}
            tabTitle={children.name.getView()}
            status=""
        />
    );
})

export default SetPropertyViewFn;