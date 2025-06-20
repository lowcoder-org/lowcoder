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
import { BrandedIcon } from "@lowcoder-ee/components/BrandedIcon";
import { MultiIconDisplay } from "@lowcoder-ee/comps/comps/multiIconDisplay";
import { StyledTypographyText, UpdateAppModal } from "./HomeResCard";

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

export const HomeTableView = (props: { resources: HomeRes[], setModify?: any, modify?: boolean, mode?: string }) => {
  const {setModify, modify, resources, mode} = props
  const dispatch = useDispatch();
  const { folderId } = useParams<{ folderId: string }>();

  const [needRenameRes, setNeedRenameRes] = useState<HomeRes | undefined>(undefined);
  const [needDuplicateRes, setNeedDuplicateRes] = useState<HomeRes | undefined>(undefined);
  const [needMoveRes, setNeedMoveRes] = useState<HomeRes | undefined>(undefined);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [currentRes, setCurrentRes] = useState<HomeRes | undefined>(undefined);

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

  const handleModalOk = (values: any) => {
    if (currentRes) {
      currentRes.type === HomeResTypeEnum.Folder &&
        dispatch(updateFolder({ id: currentRes.id, name: values.appName || currentRes.name }))
      dispatch(
        updateAppMetaAction({ applicationId: currentRes.id, name: values.appName || currentRes.name, folderId: folderId })
      );
      
      setUpdateModalVisible(false);
      setTimeout(() => {
        setModify(!modify);
      }, 200);
    }
  };

  const handleRenameClick = (res: HomeRes) => {
    setCurrentRes(res);
    setUpdateModalVisible(true);
  };

  return (
    <>
      {currentRes && 
        <UpdateAppModal
        visible={updateModalVisible}
        onCancel={() => setUpdateModalVisible(false)}
        onOk={handleModalOk}
        res={currentRes}
        folderId={folderId}
      />}

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
                  {item?.icon ? 
                    <MultiIconDisplay 
                    identifier={item.icon && typeof item.icon === 'string' ? item.icon : '/icon:antd/appstoreoutlined'} 
                    width="30px" 
                    height="30px" 
                    style={{ 
                      marginRight: "6px", 
                      flexShrink: 0, 
                      color: "#b766db" 
                      }} 
                    /> : Icon && (
                    <BrandedIcon>
                      <Icon
                        width={"24px"}
                        height={"24px"}
                        style={{ marginRight: "10px", flexShrink: 0 }}
                      />
                    </BrandedIcon>
                  )}
                  <StyledTypographyText> 
                    {item.title || item.name}
                  </StyledTypographyText>
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
            title: trans("home.desc"),
            dataIndex: "description",
            ellipsis: true,
            width: "250px",
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
                    onRename={(res) => handleRenameClick(res)}
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
