import { HomeRes } from "./HomeLayout";
import { HomeResTypeEnum } from "../../types/homeRes";
import { exportApplicationAsJSONFile } from "./components/AppImport";
import { CustomModal, EditPopover, EditPopoverItemType, PointIcon } from "lowcoder-design";
import { HomeResInfo } from "../../util/homeResUtils";
import { useDispatch } from "react-redux";
import React, { useState } from "react";
import styled from "styled-components";
import { trans, transToNode } from "../../i18n";
import { useParams } from "react-router-dom";
import { AppTypeEnum } from "constants/applicationConstants";
import { CopyModal } from "pages/common/copyModal";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import ApplicationApi from "../../api/applicationApi";
import { deleteFolder } from "../../redux/reduxActions/folderActions";

const PopoverIcon = styled(PointIcon)`
  cursor: pointer;
  flex-shrink: 0;

  g {
    fill: #8b8fa3;
  }

  &:hover {
    background-color: #e1e3eb;
    border-radius: 4px;
    cursor: pointer;

    g {
      fill: #3377ff;
    }
  }
`;

export const HomeResOptions = (props: {
  res: HomeRes;
  onDuplicate?: (res: HomeRes | undefined) => void;
  onRename: (res: HomeRes) => void;
  onMove: (res: HomeRes) => void;
  setModify: any;
  modify: boolean;
}) => {
  const { res, onDuplicate, onRename, onMove, setModify, modify } = props;
  const dispatch = useDispatch();
  const [showCopyModal, setShowCopyModal] = useState(false);

  const { folderId } = useParams<{ folderId: string }>();

  let options: EditPopoverItemType[] = [];

  if (res.type !== HomeResTypeEnum.Folder && res.type !== HomeResTypeEnum.All) {
    if (res.isEditable) {
      options = [
        ...options,
        { text: trans("home.renameApp"), onClick: () => onRename(res) },
        {
          text: trans("header.duplicate", { type: HomeResInfo[res.type].name.toLowerCase() }),
          onClick: () => {
            onDuplicate?.(res);
            setShowCopyModal(true);
          },
        },
        { text: trans("home.export"), onClick: () => exportApplicationAsJSONFile(res.id) },
      ];
    }
    if (res.isManageable) {
      options = [...options, { text: trans("home.moveToFolder"), onClick: () => onMove(res) }];
    }
    if (res.isDeletable) {
      options = [
        ...options,
        {
          text: trans("home.moveToTrash"),
          type: "delete",
          onClick: () => {
            CustomModal.confirm({
              title: trans("home.moveToTrash"),
              content: transToNode("home.moveToTrashSubTitle", {
                type: HomeResInfo[res.type].name,
                name: <b>{res.name}</b>,
              }),
              onConfirm: async () => {
                try {
                  await ApplicationApi.recycleApplication({ 
                    applicationId: res.id, 
                    folderId: folderId || "" 
                  });
                  messageInstance.success(trans("success"));
                  setTimeout(() => {
                    setModify(!modify);
                  }, 200);
                } catch (error) {
                  console.error("Failed to recycle application:", error);
                  messageInstance.error("Failed to delete application");
                }
              },
              confirmBtnType: "delete",
              okText: trans("home.moveToTrash"),
            });
          },
        },
      ];
    }
  } else if (res.type === HomeResTypeEnum.Folder) {
    if (res.isManageable) {
      options = [...options, { text: trans("rename"), onClick: () => onRename(res) }];
    }
    if (res.isDeletable) {
      options = [
        ...options,
        {
          text: trans("delete"),
          type: "delete",
          onClick: () => {
            CustomModal.confirm({
              title: trans("home.deleteElementTitle"),
              content: transToNode("home.deleteElementSubTitle", {
                type: HomeResInfo[res.type].name.toLowerCase(),
                name: <b>{res.name}</b>,
              }),
              onConfirm: () => {
                dispatch(deleteFolder(
                  { 
                    folderId: res.id, 
                    parentFolderId: folderId || "" 
                  },
                  () => {
                    // Success callback
                    messageInstance.success(trans("home.deleteSuccessMsg"));
                    setTimeout(() => {
                      setModify(!modify);
                    }, 200);
                  },
                  () => {
                    // Error callback
                    messageInstance.error("Failed to delete folder");
                  }
                ));
              },
              confirmBtnType: "delete",
              okText: trans("delete"),
            });
          },
        },
      ];
    }
  }

  return options.length > 0 ? (
    <>
      <EditPopover items={options}>
        <PopoverIcon tabIndex={-1} />
      </EditPopover>
      <CopyModal
        name={res.name}
        id={res.id}
        visible={showCopyModal}
        type={res.type as unknown as AppTypeEnum}
        close={() => {
          onDuplicate?.(undefined);
          setShowCopyModal(false);
        }}
      />
    </>
  ) : null;
};
