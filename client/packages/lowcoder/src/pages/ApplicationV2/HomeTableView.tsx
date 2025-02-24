import { timestampToHumanReadable } from "../../util/dateTimeUtils";
import { Table } from "../../components/Table";
import { TacoButton } from "lowcoder-design/src/components/button"
import styled from "styled-components";
import { useDispatch } from "react-redux";
import {
  backFolderViewClick,
  handleAppEditClick,
  handleAppViewClick,
  handleFolderViewClick,
  handleMarketplaceAppViewClick,
  HomeResInfo,
} from "../../util/homeResUtils";
import { HomeResTypeEnum } from "../../types/homeRes";
import React, { useState } from "react";
import { updateFolder } from "../../redux/reduxActions/folderActions";
import { updateAppMetaAction } from "../../redux/reduxActions/applicationActions";
import { default as AntdTypographyText } from "antd/es/typography/Text";
import { HomeRes } from "./HomeLayout";
import { HomeResOptions } from "./HomeResOptions";
import { MoveToFolderModal } from "./MoveToFolderModal";
import { trans } from "../../i18n";
import { useParams } from "react-router-dom";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";

const OperationWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const NameWrapper = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #333333;
`;

const SubColumnCell = styled.div`
  color: #8b8fa3;
`;

const EditBtn = styled(TacoButton)`
  opacity: 0;
  width: 52px;
  height: 24px;
`;

const TypographyText = styled(AntdTypographyText)`
  margin: 0 !important;
  left: 0 !important;
  width: 100%;
`;

export const HomeTableView = (props: { resources: HomeRes[], setModify?: any, modify?: boolean, mode?: string }) => {
  const {setModify, modify, resources, mode} = props
  const dispatch = useDispatch();

  const { folderId } = useParams<{ folderId: string }>();

  const [needRenameRes, setNeedRenameRes] = useState<HomeRes | undefined>(undefined);
  const [needDuplicateRes, setNeedDuplicateRes] = useState<HomeRes | undefined>(undefined);
  const [needMoveRes, setNeedMoveRes] = useState<HomeRes | undefined>(undefined);

  const back: HomeRes = {
    key: "",
      id: "",
      name: ". . .",
      type: 4,
      creator: "",
      lastModifyTime: 0,
      isManageable: false,
      isDeletable: false
  }
  if (mode === "folder"){
    resources.unshift(back)
  }

  return (
    <>
      <Table
        style={{ padding: "0 24px 60px", color: "#8B8FA3" }}
        tableLayout={"auto"}
        scroll={{ x: "100%" }}
        pagination={false}
        onRow={(record) => ({
          onClick: (e) => {
            if (mode === "folder" && (record as HomeRes).type === 4){
              backFolderViewClick()
            } else{
              const item = record as HomeRes;
              if (needRenameRes?.id === item.id || needDuplicateRes?.id === item.id) {
                return;
              }
              if (item.type === HomeResTypeEnum.Folder) {
                handleFolderViewClick(item.id);
              } else if(item.isMarketplace) {
                handleMarketplaceAppViewClick(item.id);
              } else {
                item.isEditable ? handleAppEditClick(e, item.id) : handleAppViewClick(item.id);
              }
            }
          },
        })}
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
                    <Icon
                      width={"24px"}
                      height={"24px"}
                      style={{ marginRight: "10px", flexShrink: 0 }}
                    />
                  )}
                  <TypographyText
                    ellipsis={true}
                    title={item.name}
                    editable={{
                      enterIcon: null,
                      tooltip: false,
                      editing: item.id === needRenameRes?.id,
                      icon: null,
                      triggerType: ["text"],
                      onChange: (value) => {
                        if (!value.trim()) {
                          messageInstance.warning(trans("home.nameCheckMessage"));
                          return;
                        }
                        if (item.type === HomeResTypeEnum.Folder) {
                          dispatch(updateFolder({ id: item.id, name: value }));
                          setTimeout(() => {
                            setModify(!modify);
                          }, 200);
                        } else {
                          dispatch(
                            updateAppMetaAction({
                              applicationId: item.id,
                              name: value,
                              folderId: folderId,
                            })
                          );
                          setTimeout(() => {
                            setModify(!modify);
                          }, 200);
                        }
                        setNeedRenameRes(undefined);
                      },
                    }}
                  >
                    {item.name}
                  </TypographyText>
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
            render: (_, record) => (
              <SubColumnCell>
                { mode === "folder" && (record as HomeRes).type === 4  ?  "" : HomeResInfo[(record as any).type as HomeResTypeEnum].name }
              </SubColumnCell>
            ),
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
            render: (text) => <SubColumnCell>{text}</SubColumnCell>,
          },
          {
            title: trans("home.lastModified"),
            dataIndex: "lastModifyTime",
            ellipsis: true,
            width: "192px",
            sorter: (a: any, b: any) => {
              if (a.lastModifyTime === b.lastModifyTime) {
                return 0;
              }
              return a.lastModifyTime > b.lastModifyTime ? 1 : -1;
            },
            render: (text) => (
              <SubColumnCell>
                {timestampToHumanReadable(text, 30 * 24 * 60 * 60 * 1000)}
              </SubColumnCell>
            ),
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
                      style={{ marginRight: "12px" }}
                      className={"home-datasource-edit-button"}
                      buttonType={"primary"}
                      onClick={(e) => handleAppEditClick(e, item.id)}
                    >
                      {trans("edit")}
                    </EditBtn>
                  )}
                  <EditBtn
                    buttonType={"blue"}
                    className={"home-datasource-edit-button"}
                    onClick={(e) => {
                      e.stopPropagation();
                      return item.type === HomeResTypeEnum.Folder
                        ? handleFolderViewClick(item.id)
                        : item.isMarketplace
                        ? handleMarketplaceAppViewClick(item.id)
                        : handleAppViewClick(item.id);
                    }}
                    style={{ marginRight: "52px", display: mode === "folder" && (record as HomeRes).type === 4 ? "none" : "block" }}
                  >
                    {trans("view")}
                  </EditBtn>
                  <HomeResOptions
                    res={item}
                    onDuplicate={(res) => setNeedDuplicateRes(res)}
                    onRename={(res) => setNeedRenameRes(res)}
                    onMove={(res) => setNeedMoveRes(res)}
                    setModify={setModify}
                    modify={modify!}
                  />
                </OperationWrapper>
              );
            },
          },
        ]}
        dataSource={resources}
      />
      <MoveToFolderModal source={needMoveRes} onClose={() => setNeedMoveRes(undefined)} setModify={setModify} modify={modify!} />
    </>
  );
};
