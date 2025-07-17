import { timestampToHumanReadable } from "../../util/dateTimeUtils";
import { Table } from "../../components/Table";
import { CustomModal, TacoButton } from "lowcoder-design";
import styled from "styled-components";
import { useDispatch } from "react-redux";
import { HomeResInfo } from "../../util/homeResUtils";
import { HomeResTypeEnum } from "../../types/homeRes";
import { deleteApplication, restoreApplication } from "../../redux/reduxActions/applicationActions";
import { HomeRes } from "./HomeLayout";
import { trans, transToNode } from "../../i18n";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { BrandedIcon } from "@lowcoder-ee/components/BrandedIcon";

const OperationWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  padding-right: 84px;
`;

const NameWrapper = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #333333;
`;

const EditBtn = styled(TacoButton)`
  opacity: 0;
  min-width: 52px !important;
  width: auto !important;
  height: 24px;
`;

export const TrashTableView = (props: { resources: HomeRes[] , setModify: any, modify: boolean }) => {
  const {resources, setModify, modify} = props;
  const dispatch = useDispatch();

  return (
    <Table
      style={{ padding: " 0 24px 80px", color: "#8B8FA3" }}
      tableLayout={"auto"}
      scroll={{ x: "100%" }}
      pagination={false}
      columns={[
        {
          title: trans("home.name"),
          dataIndex: "name",
          ellipsis: true,
          sorter: (a: any, b: any) => {
            if (a.name === b.name) {
              return 0;
            }
            return a.name > b.name ? 1 : -1;
          },
          render: (_, record) => {
            const item = record as HomeRes;
            const Icon = HomeResInfo[item.type].icon;
            return (
              <NameWrapper>
                {Icon && (
                  <BrandedIcon>
                    <Icon
                      width={"24px"}
                      height={"24px"}
                      style={{ marginRight: "10px", flexShrink: 0 }}
                    />
                  </BrandedIcon>
                )}
                {item.name}
              </NameWrapper>
            );
          },
        },
        {
          title: trans("home.type"),
          dataIndex: "type",
          ellipsis: true,
          width: "192px",
          sorter: (a: any, b: any) => {
            if (a.type === b.type) {
              return 0;
            }
            return a.type > b.type ? 1 : -1;
          },
          render: (_, record) => HomeResInfo[(record as any).type as HomeResTypeEnum].name,
        },
        {
          title: trans("home.creator"),
          dataIndex: "creator",
          ellipsis: true,
          sorter: (a: any, b: any) => {
            if (a.creator === b.creator) {
              return 0;
            }
            return a.type > b.type ? 1 : -1;
          },
        },
        {
          title: trans("home.deleteTime"),
          dataIndex: "lastModifyTime",
          ellipsis: true,
          width: "192px",
          sorter: (a: any, b: any) => {
            if (a.lastModifyTime === b.lastModifyTime) {
              return 0;
            }
            return a.lastModifyTime > b.lastModifyTime ? 1 : -1;
          },
          render: (text) => timestampToHumanReadable(text, 30 * 24 * 60 * 60 * 1000),
        },
        {
          title: " ",
          dataIndex: "operation",
          width: "298px",
          render: (text, record) => {
            const item = record as HomeRes;
            return (
              <OperationWrapper>
                {item.isEditable && (
                  <EditBtn
                    style={{ padding: "0 8px", width: "fit-content", minWidth: "52px" }}
                    buttonType={"blue"}
                    className={"home-datasource-edit-button"}
                    onClick={() =>{
                        dispatch(
                            restoreApplication({ applicationId: item.id }, () => {
                                messageInstance.success(trans("home.recoverSuccessMsg"));
                            })
                        )
                        setTimeout(() => {
                            setModify(!modify);
                        }, 200);
                    }
                  }
                  >
                    {trans("recover")}
                  </EditBtn>
                )}
                <EditBtn
                  buttonType={"delete"}
                  className={"home-datasource-edit-button"}
                  onClick={() =>
                    CustomModal.confirm({
                      title: trans("home.deleteElementTitle"),
                      content: transToNode("home.deleteElementSubTitle", {
                        type: HomeResInfo[item.type].name.toLowerCase(),
                        name: <b>{item.name}</b>,
                      }),
                      onConfirm: () =>{
                        new Promise((resolve, reject) => {
                          dispatch(
                            deleteApplication(
                              { applicationId: item.id },
                              () => {
                                messageInstance.success(trans("home.deleteSuccessMsg"));
                                resolve(true);
                              },
                              () => reject()
                            )
                          );
                        })
                          setTimeout(() => {
                              setModify(!modify);
                          }, 200);
                      },
                      confirmBtnType: "delete",
                      okText: trans("delete"),
                    })

                  }
                  style={{ marginLeft: "12px", width: "76px" }}
                >
                  {trans("deletePermanently")}
                </EditBtn>
              </OperationWrapper>
            );
          },
        },
      ]}
      dataSource={resources}
    />
  );
};
