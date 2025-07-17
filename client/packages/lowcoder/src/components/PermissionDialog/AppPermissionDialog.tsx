import React, { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAppPermissionInfo } from "../../redux/selectors/applicationSelector";
import { ExternalEditorContext } from "../../util/context/ExternalEditorContext";
import {
  ApplicationRoleType,
  AppPermissionInfo,
  AppTypeEnum,
} from "../../constants/applicationConstants";
import {
  deleteAppPermission,
  fetchApplicationPermissions,
  updateAppPermission,
  updateAppPermissionInfo,
  publishApplication,
} from "../../redux/reduxActions/applicationActions";
import { PermissionItemsType } from "./PermissionList";
import { trans } from "../../i18n";
import ApplicationApi from "../../api/applicationApi";
import { validateResponse } from "../../api/apiUtils";
import { PermissionDialog } from "./PermissionDialog";
import { TacoSwitch } from "components/Switch";
import styled from "styled-components";
import { APPLICATION_VIEW_URL } from "../../constants/routesURL";
import { CommonTextLabel } from "components/Label";
import { TacoInput } from "components/tacoInput";
import { TacoButton } from "components/button";
import copy from "copy-to-clipboard";
import { StyledLoading } from "./commonComponents";
import { PermissionRole } from "./Permission";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { default as Divider } from "antd/es/divider";
import { default as Form } from "antd/es/form";
import { Typography } from "antd";
import StepModal from "../StepModal";
import { AddIcon } from "icons";
import { GreyTextColor } from "constants/style";
import { VersionDataForm } from "@lowcoder-ee/pages/common/versionDataForm";
import { SocialShareButtons } from "components/SocialShareButtons";

const BottomWrapper = styled.div`
  margin: 12px 16px 0 16px;
  display: flex;
  justify-content: space-between;
`;

const AddPermissionButton = styled(TacoButton)`
  &,
  &:hover,
  &:focus {
    border: none;
    box-shadow: none;
    padding: 0;
    display: flex;
    align-items: center;
    font-size: 14px;
    line-height: 14px;
    background: #ffffff;
    transition: unset;
  }

  svg {
    margin-right: 4px;
  }

  &:hover {
    color: #315efb;

    svg g path {
      fill: #315efb;
    }
  }
`;

export const AppPermissionDialog = React.memo(
  (props: {
    applicationId: string;
    visible: boolean;
    onVisibleChange: (visible: boolean) => void;
  }) => {
    const [form] = Form.useForm();
    const { appType } = useContext(ExternalEditorContext);
    const isModule = appType === AppTypeEnum.Module;
    const { applicationId } = props;

    const dispatch = useDispatch();
    const appPermissionInfo = useSelector(getAppPermissionInfo);
    const [activeStepKey, setActiveStepKey] = useState("permission");

    useEffect(() => {
      dispatch(fetchApplicationPermissions({ applicationId: applicationId }));
    }, [applicationId, dispatch]);

    let permissions: PermissionItemsType = [];
    if (appPermissionInfo) {
      const creator = appPermissionInfo.permissions.find(
        (p) => p.type === "USER" && p.id === appPermissionInfo.creatorId
      );

      permissions = [
        {
          permissionItem: {
            permissionId: "orgAdmin",
            id: "orgAdmin",
            role: "owner",
            name: trans("home.orgName", { orgName: appPermissionInfo.orgName }),
            type: "ORG_ADMIN",
          },
        },
        ...appPermissionInfo.permissions
          .filter(
            (p) => !(p.type === "USER" && p.id === appPermissionInfo.creatorId)
          )
          .map((p) => ({
            permissionItem: p,
          })),
      ];
      if (creator) {
        permissions = [
          {
            isCreator: true,
            permissionItem: creator,
          },
          ...permissions,
        ];
      }
    }

    return (
      <StepModal
        open={props.visible}
        destroyOnClose
        onCancel={() => {
          setActiveStepKey("permission");
          props.onVisibleChange(false);
        }}
        showOkButton={true}
        showBackLink={true}
        showCancelButton={true}
        width="440px"
        onStepChange={setActiveStepKey}
        activeStepKey={activeStepKey}
        steps={[
          {
            key: "permission",
            titleRender: () => null,
            bodyRender: (modalProps) => (
              <PermissionDialog
                {...props}
                title={trans("home.managePermissions")}
                ownerLabel={trans("home.allPermissions")}
                viewBodyRender={(list) => {
                  if (!appPermissionInfo) {
                    return <StyledLoading size={18} />;
                  }
                  return <>{list}</>;
                }}
                supportRoles={[
                  {
                    label: trans("share.viewer"),
                    value: PermissionRole.Viewer,
                  },
                  {
                    label: trans("share.editor"),
                    value: PermissionRole.Editor,
                  },
                  {
                    label: trans("share.owner"),
                    value: PermissionRole.Owner,
                  },
                ]}
                permissionItems={permissions}
                addPermission={(userIds, groupIds, role, onSuccess) =>
                  ApplicationApi.grantAppPermission({
                    applicationId: applicationId,
                    userIds: userIds,
                    groupIds: groupIds,
                    role: role as any,
                  })
                    .then((resp) => {
                      if (validateResponse(resp)) {
                        dispatch(
                          fetchApplicationPermissions({
                            applicationId: applicationId,
                          })
                        );
                        onSuccess();
                      }
                    })
                    .catch((e) => {
                      messageInstance.error(
                        trans("home.addPermissionErrorMessage", {
                          message: e.message,
                        })
                      );
                    })
                }
                updatePermission={(permissionId, role) =>
                  dispatch(
                    updateAppPermission({
                      applicationId: applicationId,
                      role: role as ApplicationRoleType,
                      permissionId: permissionId,
                    })
                  )
                }
                deletePermission={(permissionId) =>
                  dispatch(
                    deleteAppPermission({
                      applicationId: applicationId,
                      permissionId: permissionId,
                    })
                  )
                }
                viewFooterRender={(primaryModelProps, props) => (
                  <BottomWrapper>
                    <AddPermissionButton
                      style={{ height: 28 }}
                      icon={<AddIcon style={{ color: GreyTextColor }} />}
                      onClick={() => {
                        props.next();
                      }}
                    >
                      {trans("home.addMember")}
                    </AddPermissionButton>

                    <TacoButton
                      buttonType="primary"
                      style={{ height: 28 }}
                      onClick={() => {
                        primaryModelProps.next();
                      }}
                    >
                      {trans("event.next") + " "}
                    </TacoButton>
                  </BottomWrapper>
                )}
                primaryModelProps={modalProps}
              />
            ),
            footerRender: () => null,
          },
          {
            key: "versions",
            titleRender: () => trans("home.versions"),
            bodyRender: () => (
              <AppShareView
                isModule={isModule}
                applicationId={applicationId}
                permissionInfo={appPermissionInfo!}
                form={form}
              />
            ),
            footerRender: (modalProps) => (
              <BottomWrapper>
                <TacoButton
                  buttonType="normal"
                  style={{ height: 28 }}
                  onClick={() => {
                    modalProps.back();
                  }}
                >
                  {trans("back")}
                </TacoButton>
                <TacoButton
                  buttonType="primary"
                  style={{ height: 28 }}
                  onClick={() => {
                    form.validateFields().then(() => {
                      dispatch(
                        publishApplication({
                          applicationId: applicationId,
                          request: form.getFieldsValue(),
                        })
                      );
                      modalProps.back();
                      props.onVisibleChange(false);
                    });
                  }}
                >
                  {trans("queryLibrary.publish")}
                </TacoButton>
              </BottomWrapper>
            ),
          },
        ]}
      />
    );
  }
);

const InviteInputBtn = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;

  button {
    width: 76px;
  }
`;

const AppInviteView = (props: { appId: string }) => {
  const inviteLink =
    window.location.origin + APPLICATION_VIEW_URL(props.appId, "view");
  return (
    <>
      <CommonTextLabel style={{ marginTop: "16px" }}>
        {trans("home.shareLink")}
      </CommonTextLabel>
      <InviteInputBtn>
        <TacoInput disabled value={inviteLink} />
        <TacoButton
          buttonType="primary"
          onClick={() => {
            if (copy(inviteLink)) {
              messageInstance.success(trans("copySuccess"));
            } else {
              messageInstance.error(trans("copyError"));
            }
          }}
        >
          {trans("home.copyLink")}
        </TacoButton>
      </InviteInputBtn>
    </>
  );
};

const PermissionSwitchWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-top: 8px;
`;

function AppShareView(props: {
  applicationId: string;
  permissionInfo: AppPermissionInfo;
  isModule: boolean;
  form: any;
}) {
  const { applicationId, permissionInfo, isModule, form } = props;
  const [isPublic, setPublic] = useState(permissionInfo.publicToAll);
  const [isPublicToMarketplace, setPublicToMarketplace] = useState(
    permissionInfo.publicToMarketplace
  );
  const dispatch = useDispatch();
  useEffect(() => {
    setPublic(permissionInfo.publicToAll);
  }, [permissionInfo.publicToAll]);
  useEffect(() => {
    setPublicToMarketplace(permissionInfo.publicToMarketplace);
  }, [permissionInfo.publicToMarketplace]);
  const inviteLink = window.location.origin + APPLICATION_VIEW_URL(props.applicationId, "view");

  return (
    <div style={{ marginBottom: "22px" }}>
      <PermissionSwitchWrapper>
        <TacoSwitch
          checked={true}
          disabled={true}
          label={
            isModule
              ? trans("home.appMemberMessage")
              : trans("home.moduleMemberMessage")
          }
        />
      </PermissionSwitchWrapper>
      <PermissionSwitchWrapper>
        <TacoSwitch
          checked={isPublic}
          onChange={(checked) => {
            setPublic(checked);
            ApplicationApi.publicToAll(applicationId, checked)
              .then((resp) => {
                validateResponse(resp);
                dispatch(updateAppPermissionInfo({ publicToAll: checked }));
              })
              .catch((e) => {
                messageInstance.error(e.message);
              });
          }}
          label={
            isModule
              ? trans("home.modulePublicMessage")
              : trans("home.appPublicMessage")
          }
        />
      </PermissionSwitchWrapper>
      {isPublic && (
        <PermissionSwitchWrapper>
          <TacoSwitch
            checked={isPublicToMarketplace}
            onChange={(checked) => {
              setPublicToMarketplace(checked);
              ApplicationApi.publicToMarketplace(applicationId, checked)
                .then((resp) => {
                  validateResponse(resp);
                  dispatch(
                    updateAppPermissionInfo({ publicToMarketplace: checked })
                  );
                })
                .catch((e) => {
                  messageInstance.error(e.message);
                });
            }}
            label={
              isModule
                ? trans("home.moduleMarketplaceMessage")
                : trans("home.appMarketplaceMessage")
            }
          />
        </PermissionSwitchWrapper>
      )}
      {isPublicToMarketplace && isPublic && (
        <div style={{ marginTop: "16px" }}>
          <Typography.Text type="secondary">
            {trans("home.marketplaceGoodPublishing")}
          </Typography.Text>
          <Divider />
        </div>
      )}

      {isPublic && <AppInviteView appId={applicationId} />}
      <Divider />

      <VersionDataForm form={form} preserve={false} />

      <div>
        <Typography.Text type="secondary">
          {trans("home.publishVersionDescription")}
        </Typography.Text>
      </div>
    </div>
  );
}
