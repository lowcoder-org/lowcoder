import { GroupRoleInfo, GroupUser, OrgGroup, TacoRoles } from "constants/orgConstants";
import { User } from "constants/userConstants";
import { AddIcon, ArrowIcon, CustomSelect, PackUpIcon, SuperUserIcon } from "lowcoder-design";
import { trans } from "i18n";
import ProfileImage from "pages/common/profileImage";
import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import {
  deleteGroupUserAction,
  quitGroupAction,
  updateUserGroupRoleAction,
} from "redux/reduxActions/orgActions";
import styled from "styled-components";
import { formatTimestamp } from "util/dateTimeUtils";
import { currentOrgAdmin, isGroupAdmin } from "util/permissionUtils";
import AddGroupUserDialog from "./addGroupUserDialog";
import {
  AddMemberButton,
  DevGroupTip,
  GroupNameView,
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

const StyledAddIcon = styled(AddIcon)`
  g path {
    fill: #ffffff;
  }
`;

type GroupPermissionProp = {
  group: OrgGroup;
  orgId: string;
  groupUsers: GroupUser[];
  currentUserGroupRole: string;
  currentUser: User;
  setModify?: any;
  modify?: boolean;
  loading?: boolean;
};

function GroupUsersPermission(props: GroupPermissionProp) {
  const { Column } = TableStyled;
  const { group, orgId, groupUsers, currentUserGroupRole, currentUser, setModify, modify, loading } = props;
  const adminCount = groupUsers.filter((user) => isGroupAdmin(user.role)).length;
  const sortedGroupUsers = useMemo(() => {
    return [...groupUsers].sort((a, b) => {
      if (isGroupAdmin(a.role)) {
        return -1;
      } else if (isGroupAdmin(b.role)) {
        return 1;
      } else {
        return b.joinTime - a.joinTime;
      }
    });
  }, [groupUsers]);
  const dispatch = useDispatch();
  return (
    <>
      <PermissionHeaderWrapper>
        <HeaderBack>
          <span onClick={() => history.push(PERMISSION_SETTING)}>{trans("settings.userGroups")}</span>
          <ArrowIcon />
          {isGroupAdmin(currentUserGroupRole) && !group.devGroup ? (
            <span>{group.groupName}</span>
          ) : (
            <GroupNameView name={group.groupName} toolTip={group.devGroup && DevGroupTip} />
          )}
        </HeaderBack>
        {isGroupAdmin(currentUserGroupRole) && !group.syncGroup && (
          <AddGroupUserDialog
            groupUsers={groupUsers}
            orgId={orgId}
            groupId={group.groupId}
            setModify={setModify}
            modify={modify}
            trigger={
              <AddMemberButton buttonType="primary" icon={<StyledAddIcon />}>
                {trans("memberSettings.addMember")}
              </AddMemberButton>
            }
            style={{ marginLeft: "auto" }}
          />
        )}
      </PermissionHeaderWrapper>
      <TableStyled
        tableLayout={"auto"}
        scroll={{ x: "100%" }}
        dataSource={sortedGroupUsers}
        rowKey="userId"
        pagination={false}
        loading={loading}
      >
        <Column
          title={trans("memberSettings.nameColumn")}
          dataIndex="userName"
          key="userName"
          ellipsis
          render={(value, record: GroupUser) => (
            <UserTableCellWrapper>
              <ProfileImage source={record.avatarUrl} userName={record.userName} side={34} />
              <span title={record.userName}>{record.userName}</span>
              {isGroupAdmin(record.role) && <SuperUserIcon />}
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
          render={(value, record: GroupUser) => (
            <CustomSelect
              style={{ width: "140px", height: "32px" }}
              dropdownStyle={{ width: "149px" }}
              defaultValue={record.role}
              key={record.role}
              disabled={
                !isGroupAdmin(currentUserGroupRole) ||
                currentUser.id === record.userId ||
                group.syncGroup
              }
              optionLabelProp="label"
              suffixIcon={<PackUpIcon />}
              onChange={(val) => {
                dispatch(
                  updateUserGroupRoleAction({
                    role: val,
                    userId: record.userId,
                    groupId: group.groupId,
                  })
                );
                  setTimeout(() => {
                      setModify(!modify);
                  }, 200);
              }}
            >
              {TacoRoles.map((role) => (
                <CustomSelect.Option key={role} value={role} label={GroupRoleInfo[role].name}>
                  <RoleSelectTitle>{GroupRoleInfo[role].name}</RoleSelectTitle>
                  <RoleSelectSubTitle>{GroupRoleInfo[role].desc}</RoleSelectSubTitle>
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />
        <Column
          title={trans("memberSettings.actionColumn")}
          key="action"
          render={(value, record: GroupUser) => {
            return (
              !group.syncGroup && (
                <div className="operation-cell-div-wrapper">
                  {currentOrgAdmin(currentUser) && (
                    <UserDetailPopup userId={record.userId} title={record.userName} />
                  )}
                  {record.userId === currentUser.id ? (
                    isGroupAdmin(record.role) && adminCount === 1 ? (
                      <QuestionTooltip title={LAST_ADMIN_QUIT} />
                    ) : (
                      <span
                        onClick={() => {
                          dispatch(
                            quitGroupAction({ groupId: group.groupId, userId: currentUser.id })
                          );
                            setTimeout(() => {
                                setModify(!modify);
                            }, 200);
                        }}
                      >
                        {trans("memberSettings.exitGroup")}
                      </span>
                    )
                  ) : (
                    isGroupAdmin(currentUserGroupRole) && (
                      <span
                        onClick={() => {
                          dispatch(
                            deleteGroupUserAction({
                              userId: record.userId,
                              groupId: group.groupId,
                            })
                          );
                            setTimeout(() => {
                                setModify(!modify);
                            }, 200);
                        }}
                      >
                        {trans("memberSettings.moveOutGroup")}
                      </span>
                    )
                  )}
                </div>
              )
            );
          }}
        />
      </TableStyled>
    </>
  );
}

export default GroupUsersPermission;
