import { default as Dropdown } from "antd/es/dropdown";
import { BASE_URL } from "constants/routesURL";
import {
  CommonTextLabel,
  CustomModal,
  DropdownMenu,
  EditTextWrapper,
  PackUpIcon,
  TextWrapper,
  ModuleIcon,
} from "lowcoder-design";
import { trans, transToNode } from "i18n";
import { exportApplicationAsJSONFile } from "pages/ApplicationV2/components/AppImport";
import { useContext, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { currentApplication, isPublicApplication } from "redux/selectors/applicationSelector";
import { showAppSnapshotSelector } from "redux/selectors/appSnapshotSelector";
import styled from "styled-components";
import history from "util/history";
import { useApplicationId } from "util/hooks";
import { AppTypeEnum } from "constants/applicationConstants";
import { recycleApplication } from "redux/reduxActions/applicationActions";
import { CopyModal } from "./copyModal";
import { ExternalEditorContext } from "util/context/ExternalEditorContext";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { getUser } from "redux/selectors/usersSelectors";
import { canEditApp } from "util/permissionUtils";

const PackUpIconStyled = styled(PackUpIcon)`
  transform: rotate(180deg);
  margin-left: 4px;
  min-width: 18px;

  path {
    fill: #ffffff;
  }
`;

const DropdownStyled = styled(Dropdown)`
  &.ant-dropdown-open {
    background-color: #8b8fa34c;
  }
`;

const DropdownMenuStyled = styled(DropdownMenu)`
  .ant-dropdown-menu-item:hover {
    background: #edf4fa;
  }
`;

const CommonTextLabelDelete = styled(CommonTextLabel)`
  color: #f73131;
`;

const Prefix = styled.div`
  display: inline-flex;
  align-items: center;
  margin-right: 4px;

  &.module svg {
    visibility: visible;
  }
`;

export const TypeName = {
  [AppTypeEnum.Application]: trans("home.app"),
  [AppTypeEnum.Module]: trans("home.module"),
  [AppTypeEnum.NavLayout]: trans("home.navLayout"),
  [AppTypeEnum.MobileTabLayout]: trans("home.mobileTabLayout"),
};

export function HeaderStartDropdown(props: { setEdit: () => void, isViewMarketplaceMode?: boolean}) {
  const user = useSelector(getUser);
  const showAppSnapshot = useSelector(showAppSnapshotSelector);
  const applicationId = useApplicationId();
  const application = useSelector(currentApplication);
  const isPublicApp = useSelector(isPublicApplication);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const dispatch = useDispatch();
  const { appType, exportPublicAppToJson } = useContext(ExternalEditorContext);
  const isModule = appType === AppTypeEnum.Module;

  const isEditable = canEditApp(user, application);
  const isMarketplace = props.isViewMarketplaceMode;

  const menuItems = useMemo(() => {
    // Define a base array with items that are always visible
    const items = [
      {
        key: "export",
        label: <CommonTextLabel>{trans("header.export")}</CommonTextLabel>,
        visible: true,
      },
      {
        key: "duplicate",
        label: (
          <CommonTextLabel>
            {trans("header.duplicate", {
              type: TypeName[application?.applicationType!]?.toLowerCase(),
            })}
          </CommonTextLabel>
        ),
        visible: true,
      },
    ];
  
    // Conditionally add items based on isEditable and isMarketplace flags
    if (!isMarketplace) {
      items.unshift(
        {
          key: "edit",
          label: <CommonTextLabel>{trans("header.editName")}</CommonTextLabel>,
          visible: isEditable,
        },
        {
          key: "delete",
          label: <CommonTextLabelDelete>{trans("home.moveToTrash")}</CommonTextLabelDelete>,
          visible: isEditable,
        }
      );
    }
  
    return items;
  }, [isEditable, isMarketplace]);



  return (
    <>
      <DropdownStyled
        placement="bottomLeft"
        trigger={["click"]}
        disabled={showAppSnapshot}
        dropdownRender={() => (
          <DropdownMenuStyled
            style={{ minWidth: "136px", maxWidth: "288px", borderRadius: "4px" }}
            onClick={(e) => {
              if (e.key === "edit") {
                props.setEdit();
              } else if (e.key === "export") {
                if (isPublicApp && exportPublicAppToJson) {
                  return exportPublicAppToJson?.();
                }
                exportApplicationAsJSONFile(applicationId);
              } else if (e.key === "duplicate") {
                setShowCopyModal(true);
              } else if (e.key === "delete") {
                CustomModal.confirm({
                  title: trans("home.moveToTrash"),
                  content: transToNode("home.moveToTrashSubTitle", {
                    type: TypeName[application?.applicationType!],
                    name: <b>{application?.name || ""}</b>,
                  }),
                  onConfirm: () =>
                    dispatch(
                      recycleApplication(
                        { applicationId: applicationId, folderId: "" },
                        () => {
                          messageInstance.success(trans("success"));
                          history.push(BASE_URL);
                        },
                        () => messageInstance.error(trans("home.deleteErrorMsg"))
                      )
                    ),
                  confirmBtnType: "delete",
                  okText: trans("home.moveToTrash"),
                });
              }
            }}
            items={menuItems.filter(item => item.visible)}
          />
        )}
      >
        <EditTextWrapper
          style={{ width: "fit-content", maxWidth: "288px", padding: "0 8px"}}
          disabled={showAppSnapshot}
        >
          {isModule && (
            <Prefix className="module">
              <ModuleIcon />
            </Prefix>
          )}
          <TextWrapper className={"taco-edit-text-body"}>{application?.name ?? ""}</TextWrapper>
          <PackUpIconStyled style={{ visibility: showAppSnapshot ? "hidden" : "visible" }} />
        </EditTextWrapper>
      </DropdownStyled>
      <CopyModal
        name={application?.name || ""}
        id={applicationId}
        type={application?.applicationType!}
        visible={showCopyModal}
        close={() => setShowCopyModal(false)}
      />
    </>
  );
}
