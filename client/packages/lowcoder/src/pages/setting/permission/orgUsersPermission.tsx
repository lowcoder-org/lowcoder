import { ADMIN_ROLE, OrgRoleInfo, OrgUser, SUPER_ADMIN_ROLE, TacoRoles } from "constants/orgConstants";
import { User } from "constants/userConstants";
import {
  ArrowIcon,
  CustomModal,
  CustomSelect,
  EditPopover,
  EditPopoverItemType,
  MembersIcon,
  ModalFooterWrapper,
  SuperUserIcon,
  TacoButton,
} from "lowcoder-design";
import { trans, transToNode } from "i18n";
import InviteDialog from "pages/common/inviteDialog";
import ProfileImage from "pages/common/profileImage";
import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteOrgUserAction,
  quitOrgAction,
  updateUserOrgRoleAction,
} from "redux/reduxActions/orgActions";
import styled from "styled-components";
import { formatTimestamp } from "util/dateTimeUtils";
import { currentOrgAdmin } from "util/permissionUtils";
import {
  AddMemberButton,
  HeaderBack,
  LAST_ADMIN_QUIT,
  PermissionHeaderWrapper,
  QuestionTooltip,
  RoleSelectSubTitle,
  RoleSelectTitle,
  TableStyled,
  UserDetailPopup,
  UserTableCellWrapper,
} from "./styledComponents";
import history from "util/history";
import { PERMISSION_SETTING } from "constants/routesURL";
import { isSaasMode } from "util/envUtils";
import { selectSystemConfig } from "redux/selectors/configSelectors";
import UserApi from "api/userApi";
import { validateResponse } from "api/apiUtils";
import copyToClipboard from "copy-to-clipboard";
import { BackgroundColor } from "constants/style";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import Column from "antd/es/table/Column";

const StyledMembersIcon = styled(MembersIcon)`
  g g {
    stroke: #ffffff;
  }
`;

type UsersPermissionProp = {
  orgId: string;
  orgUsers: OrgUser[];
  currentUser: User;
  setModify?: any;
  modify?: boolean;
  loading?: boolean;
};

function OrgUsersPermission(props: UsersPermissionProp) {
  const { orgId, orgUsers, currentUser, setModify, modify, loading } = props;
  const adminCount = orgUsers.filter(
    (user) => user.role === ADMIN_ROLE || user.role === SUPER_ADMIN_ROLE,
  ).length;
  const sysConfig = useSelector(selectSystemConfig);
  const dispatch = useDispatch();
  const sortedOrgUsers = useMemo(() => {
    return [...orgUsers].sort((a, b) => {
      if (a.role === ADMIN_ROLE || a.role === SUPER_ADMIN_ROLE) {
        return -1;
      } else if (b.role === ADMIN_ROLE || a.role === SUPER_ADMIN_ROLE) {
        return 1;
      } else {
        return b.joinTime - a.joinTime;
      }
    });
  }, [orgUsers]);

  // useEffect(() => {
  //   dispatch(fetchOrgUsersAction(orgId));
  // }, [dispatch, orgId]);

  const onResetPass = (userId: string) => {
    return UserApi.resetPassword(userId)
      .then((resp) => {
        validateResponse(resp);
        const newPassword = resp.data.data;
        CustomModal.confirm({
          title: trans("userAuth.resetSuccess"),
          type: "success",
          content: transToNode("userAuth.resetSuccessDesc", {
            password: (
              <span
                style={{
                  backgroundColor: BackgroundColor,
                  padding: "0 4px",
                  borderRadius: "4px",
                  fontWeight: "bold",
                }}
              >
                {newPassword}
              </span>
            ),
          }),
          footer: (
            <ModalFooterWrapper>
              <TacoButton
                buttonType="primary"
                onClick={() => {
                  copyToClipboard(newPassword);
                  messageInstance.success(trans("copySuccess"));
                }}
              >
                {trans("userAuth.copyPassword")}
              </TacoButton>
            </ModalFooterWrapper>
          ),
        });
      })
      .catch((e) => {
        messageInstance.error(e.message);
      });
  };

  return (
    <>
      <PermissionHeaderWrapper>
        <HeaderBack>
          <span onClick={() => history.push(PERMISSION_SETTING)}>{trans("settings.userGroups")}</span>
          <ArrowIcon />
          <span>{trans("memberSettings.allMembers")}</span>
        </HeaderBack>
        <InviteDialog
          trigger={
            <AddMemberButton buttonType="primary" icon={<StyledMembersIcon />}>
              {trans("memberSettings.inviteUser")}
            </AddMemberButton>
          }
          style={{ marginLeft: "auto" }}
        />
      </PermissionHeaderWrapper>
      <TableStyled
        tableLayout={"auto"}
        scroll={{ x: "100%" }}
        dataSource={sortedOrgUsers}
        rowKey="userId"
        pagination={false}
        loading={loading}
      >
        <Column
          title={trans("memberSettings.nameColumn")}
          dataIndex="name"
          key="name"
          ellipsis
          render={(value, record: OrgUser) => (
            <UserTableCellWrapper>
              <ProfileImage source={record.avatarUrl} userName={record.name} side={34} />
              <span title={record.name}>{record.name}</span>
              {record.role === ADMIN_ROLE && <SuperUserIcon />}
            </UserTableCellWrapper>
          )}
        />
        <Column
          title={trans("memberSettings.joinTimeColumn")}
          dataIndex="joinTime"
          key="joinTime"
          render={(value) => <span>{formatTimestamp(value)}</span>}
          ellipsis
        />
        <Column
          title={trans("memberSettings.roleColumn")}
          dataIndex="role"
          key="role"
          className="role-table-cell"
          render={(value, record: OrgUser) => (
            <CustomSelect
              style={{ width: "140px", height: "32px" }}
              styles={{ popup: { root: { width: "149px" }}}}
              defaultValue={record.role}
              key={record.role}
              optionLabelProp="label"
              disabled={!currentOrgAdmin(currentUser) || currentUser.id === record.userId}
              onChange={(val) => {
                dispatch(
                  updateUserOrgRoleAction({
                    role: val,
                    userId: record.userId,
                    orgId: orgId,
                  })
                );
              }}
            >
              {TacoRoles.map((role) => (
                <CustomSelect.Option value={role} key={role} label={OrgRoleInfo[role].name}>
                  <RoleSelectTitle>{OrgRoleInfo[role].name}</RoleSelectTitle>
                  <RoleSelectSubTitle>{OrgRoleInfo[role].desc}</RoleSelectSubTitle>
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />
        <Column
          title={trans("memberSettings.actionColumn")}
          key="action"
          render={(value, record: OrgUser) => {
            const operationItems: Array<EditPopoverItemType> = [];
            // reset password
            if (
              currentOrgAdmin(currentUser) &&
              sysConfig?.form.enableLogin &&
              !isSaasMode(sysConfig)
            ) {
              const resetText = trans("userAuth.resetPassword");
              operationItems.push({
                text: resetText,
                type: "delete",
                onClick: () => {
                  CustomModal.confirm({
                    title: resetText,
                    type: "warn",
                    content: transToNode("userAuth.resetPasswordDesc", {
                      name: <b>{record.name}</b>,
                    }),
                    onConfirm: () => onResetPass(record.userId),
                    confirmBtnType: "delete",
                  });
                },
              });
            }
            return (
              <div className="operation-cell-div-wrapper">
                {currentOrgAdmin(currentUser) && (
                  <UserDetailPopup userId={record.userId} title={record.name} />
                )}
                {record.userId === currentUser.id ? (
                  record.role === ADMIN_ROLE && adminCount === 1 ? (
                    <QuestionTooltip title={LAST_ADMIN_QUIT} />
                  ) : (
                    <span
                      onClick={() => {
                        CustomModal.confirm({
                          title: trans("memberSettings.exitOrg"),
                          type: "warn",
                          content: trans("memberSettings.exitOrgDesc"),
                          onConfirm: () => {
                            dispatch(quitOrgAction(orgId));
                          },
                          confirmBtnType: "delete",
                          okText: trans("memberSettings.exitOrg"),
                        });
                      }}
                    >
                      {trans("memberSettings.exitOrg")}
                    </span>
                  )
                ) : (
                  currentOrgAdmin(currentUser) && (
                    <span
                      onClick={() => {
                        CustomModal.confirm({
                          title: trans("memberSettings.moveOutOrg"),
                          type: "warn",
                          content: transToNode(
                            isSaasMode(sysConfig)
                              ? "memberSettings.moveOutOrgDescSaasMode"
                              : "memberSettings.moveOutOrgDesc",
                            { name: <b>{record.name}</b> }
                          ),
                          onConfirm: () => {
                            dispatch(
                              deleteOrgUserAction({
                                userId: record.userId,
                                orgId: orgId,
                              })
                            );
                              setTimeout(() => {
                                  setModify(!modify);
                              }, 200);
                          },
                          confirmBtnType: "delete",
                          okText: trans("memberSettings.moveOutOrg"),
                        });
                      }}
                    >
                      {trans("memberSettings.moveOutOrg")}
                    </span>
                  )
                )}
                {operationItems.length > 0 && <EditPopover items={operationItems} />}
              </div>
            );
          }}
        />
      </TableStyled>
    </>
  );
}

export default OrgUsersPermission;