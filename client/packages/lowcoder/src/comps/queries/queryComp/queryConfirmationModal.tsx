import { MultiCompBuilder } from "../../generators";
import { BoolPureControl } from "../../controls/boolControl";
import { StringControl } from "../../controls/codeControl";
import { CustomModal, TacoMarkDown } from "lowcoder-design";
import { isEmpty } from "lodash";
import { QueryResult } from "../queryComp";
import { trans } from "i18n";

export const QueryConfirmationModal = new MultiCompBuilder(
  {
    showConfirmationModal: BoolPureControl,
    confirmationMessage: StringControl,
  },
  (props) =>
    (onConfirm: () => Promise<QueryResult>, isManual: boolean): Promise<QueryResult> =>
      new Promise<QueryResult>((resolve) => {
        props.showConfirmationModal && isManual
          ? CustomModal.confirm({
              content: (
                <TacoMarkDown>
                  {isEmpty(props.confirmationMessage)
                    ? trans("query.confirmationMessage")
                    : props.confirmationMessage}
                </TacoMarkDown>
              ),
              onConfirm: () => {
                resolve(onConfirm());
              },
              confirmBtnType: "primary",
              style: { top: "-100px" },
              bodyStyle: { marginTop: 0 },
            })
          : resolve(onConfirm());
      })
)
  .setPropertyViewFn((children) => (
    <>
      {children.showConfirmationModal.propertyView({
        label: trans("query.showConfirmationModal"),
        type: "checkbox",
        placement: "bottom",
      })}
      {children.showConfirmationModal.getView() &&
        children.confirmationMessage.propertyView({
          placement: "bottom",
          label: trans("query.confirmationMessageLabel"),
          placeholder: trans("query.confirmationMessage"),
        })}
    </>
  ))
  .build();
