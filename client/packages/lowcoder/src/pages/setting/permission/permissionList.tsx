import { default as Typography } from "antd/es/typography";
import OrgApi from "api/orgApi";
import { buildGroupId } from "constants/routesURL";
import { AddIcon, CustomModal, EditPopover } from "lowcoder-design";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchGroupsAction, updateGroupAction } from "redux/reduxActions/orgActions";
import { getUser } from "redux/selectors/usersSelectors";
import { getNextEntityName } from "util/stringUtils";
import { validateResponse } from "api/apiUtils";
import {
  AddMemberButton,
  GroupNameView,
  OperationWrapper,
  EditBtn,
  PopoverIcon,
  CreateButton,
} from "./styledComponents";
import {
  MembersIcon,
} from "lowcoder-design";
import styled from "styled-components";
import { trans } from "i18n";
import { Table } from "components/Table";
import history from "util/history";
import { Level1SettingPageContentWithList, Level1SettingPageTitleWithBtn } from "../styled";
import { currentOrgAdmin, isGroupAdmin } from "../../../util/permissionUtils";
import { timestampToHumanReadable } from "../../../util/dateTimeUtils";
import { usePermissionMenuItems } from "@lowcoder-ee/pages/setting/permission/permissionMenuItems";
import { OrgGroup } from "constants/orgConstants";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import InviteDialog from "pages/common/inviteDialog";
import { Flex } from "antd";
import {fetchOrgGroups} from "@lowcoder-ee/util/pagination/axios";
import PaginationComp from "@lowcoder-ee/util/pagination/Pagination";

const NEW_GROUP_PREFIX = trans("memberSettings.newGroupPrefix");

const StyledMembersIcon = styled(MembersIcon)`
  g g {
    stroke: #ffffff;
  }
`;

type DataItemInfo = {
  key: string;
  label: string;
  createTime: string | undefined;
  lock: boolean;
  del: boolean;
  rename: boolean;
  group?: OrgGroup;
};

type PermissionSettingProps = {
  currentPage: number;
  setCurrentPage: (value: number) => void;
  pageSize: number;
  setPageSize: (value: number) => void;
};

interface ElementsState {
  elements: OrgGroup[];
  total: number;
}

export default function PermissionSetting(props: PermissionSettingProps) {

  const {currentPage, setCurrentPage, pageSize, setPageSize} = props;
  let dataSource: DataItemInfo[] = [];
  const user = useSelector(getUser);
  const orgId = user.currentOrgId;
  const dispatch = useDispatch();
  const [needRenameId, setNeedRenameId] = useState<string | undefined>(undefined);
  const { nameSuffixFunc, menuItemsFunc, menuExtraView } = usePermissionMenuItems(orgId);
  const [groupCreating, setGroupCreating] = useState(false);
  const [elements, setElements] = useState<ElementsState>({ elements: [], total: 0 });
  const [modify, setModify] = useState(false);
  const visibleOrgGroups = elements.elements.filter((g) => !g.allUsersGroup);
  const allUsersGroup = elements.elements.find((g) => g.allUsersGroup);

  useEffect( () => {
      fetchOrgGroups(
        {
          pageNum: currentPage,
          pageSize: pageSize,
        }
      ).then(result => {
        if (result.success){
          setElements({elements: result.data || [], total: result.total || 1})
        }
        else
          console.error("ERROR: fetchFolderElements", result.error)
      })
    }, [currentPage, pageSize, modify]
  )


  dataSource = currentPage === 1 ? [{
    key: "users",
    label: trans("memberSettings.allMembers"),
    createTime: allUsersGroup?.createTime,
    lock: true,
    del: false,
    rename: false,
  }] : [];
  if (!orgId) {
    return null;
  }
  const handleGroupCreate = () => {
    setGroupCreating(true);
    OrgApi.createGroup({
      name: getNextEntityName(
        NEW_GROUP_PREFIX,
        visibleOrgGroups.map((org) => org.groupName)
      ),
    })
      .then((resp) => {
        if (validateResponse(resp)) {
          setTimeout(() => {
            dispatch(fetchGroupsAction(orgId));
          }, 200);
          setTimeout(() => {
            setModify(!modify);
          }, 200);
        }
      })
      .catch((e) => {
        messageInstance.error(e.message);
      })
      .finally(() => {
        setGroupCreating(false);
      });
  };
  const handleGroupDelete = (groupId: string) => {
    OrgApi.deleteGroup(groupId)
      .then((resp) => {
        if (validateResponse(resp)) {
          dispatch(fetchGroupsAction(orgId));
          setTimeout(() => {
            setModify(!modify);
          }, 200);
        }
      })
      .catch((e) => {
        messageInstance.error(e.message);
      });
  };

  visibleOrgGroups.forEach((group) => {
    dataSource.push({
      key: group.groupId,
      label: group.groupName,
      createTime: group.createTime,
      lock: group.devGroup || false,
      del: currentOrgAdmin(user) && !group.devGroup && !!(!group.syncGroup || group.syncDelete),
      rename: isGroupAdmin(group.visitorRole) && !group.devGroup && !group.syncGroup,
      group: group,
    });
  });

  return (
    <Level1SettingPageContentWithList>
      <Level1SettingPageTitleWithBtn>
        {trans("settings.userGroups")}
        {currentOrgAdmin(user) && (
          <Flex gap="middle">
            <CreateButton
            loading={groupCreating}
            buttonType={"primary"}
            icon={<AddIcon />}
            onClick={() => handleGroupCreate()}
          >
            {trans("memberSettings.createGroup")}
          </CreateButton>
          <InviteDialog
            trigger={<AddMemberButton buttonType="primary" icon={<StyledMembersIcon />}>
              {trans("memberSettings.inviteUser")}
            </AddMemberButton>}
            style={{ marginLeft: "auto" }} />
          </Flex>
        )}
      </Level1SettingPageTitleWithBtn>
      <div>
        <Table
          tableLayout={"auto"}
          scroll={{ x: "100%" }}
          pagination={false}
          onRow={(record) => ({
            onClick: (e) => {
              // Don't navigate if this row is in rename mode
              if ((record as DataItemInfo).key === needRenameId) {
                e.stopPropagation();
                return;
              }
              history.push(buildGroupId((record as DataItemInfo).key));
            },
          })}
          columns={[
            {
              title: trans("memberSettings.groupName"),
              dataIndex: "groupName",
              ellipsis: true,
              render: (_, record: any) => {
                return (
                  <Typography.Text
                    title={record.groupName}
                    style={{ left: 0, margin: 0 }}
                    editable={{
                      enterIcon: null,
                      tooltip: false,
                      editing: record.key === needRenameId,
                      icon: null,
                      triggerType: ["text"],
                      onChange: (value) => {
                        if (!value.trim()) {
                          messageInstance.warning(trans("home.nameCheckMessage"));
                          return;
                        }
                        dispatch(updateGroupAction(record.key, { groupName: value }, orgId));
                        setTimeout(() => {
                          setModify(!modify);
                        }, 200);
                        setNeedRenameId(undefined);
                      },
                    }}
                  >
                    {record.key === needRenameId ? (
                      record.groupName
                    ) : (
                      <GroupNameView
                        name={record.groupName}
                        lock={record.lock}
                        suffix={nameSuffixFunc(record.group)}
                        warn={record.group?.syncDelete}
                        syncGroup={record.group?.syncGroup}
                      />
                    )}
                  </Typography.Text>
                );
              },
            },
            {
              title: trans("memberSettings.createTime"),
              dataIndex: "createTime",
              ellipsis: true,
              render: (value) => (
                <span style={{ color: "#8B8FA3" }}>{timestampToHumanReadable(value)}</span>
              ),
            },
            { title: " ", dataIndex: "operation", width: "208px" },
          ]}
          dataSource={dataSource.map((item, i) => ({
            key: item.key,
            groupName: item.label,
            createTime: item.createTime,
            lock: item.lock,
            group: item.group,
            operation: (
              <OperationWrapper>
                {!item.group?.syncGroup && (
                  <EditBtn
                    className={"home-datasource-edit-button"}
                    buttonType={"primary"}
                    onClick={() => history.push(buildGroupId(item.key))}
                  >
                    {trans("memberSettings.manageBtn")}
                  </EditBtn>
                )}
                {(item.del ||
                  item.rename ||
                  (item.group && menuItemsFunc && !item.group.syncGroup)) && (
                  <EditPopover
                    del={
                      item.del
                        ? () => {
                            CustomModal.confirm({
                              title: trans("memberSettings.deleteModalTitle"),
                              content: trans("memberSettings.deleteModalContent"),
                              onConfirm: () => handleGroupDelete(item.key),
                              confirmBtnType: "delete",
                              okText: trans("delete"),
                            });
                          }
                        : undefined
                    }
                    rename={item.rename ? () => setNeedRenameId(item.key) : undefined}
                    items={!item.group?.syncGroup ? menuItemsFunc?.(item.group) : []}
                  >
                    <PopoverIcon tabIndex={-1} />
                  </EditPopover>
                )}
              </OperationWrapper>
            ),
          }))}
        />
      </div>
      {menuExtraView}
      <PaginationComp
          currentPage={currentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          setCurrentPage={setCurrentPage}
          total={elements.total}
      />
    </Level1SettingPageContentWithList>
  );
}
