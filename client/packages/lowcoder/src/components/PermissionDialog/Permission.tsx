import {
  CheckoutIcon,
  CloseIcon,
  CommonTextLabel,
  CustomSelect,
  Search,
  TacoButton,
} from "lowcoder-design";
import { useEffect, useRef, useState, useCallback } from "react";
import styled from "styled-components";
import { debounce } from "lodash";
import ProfileImage from "pages/common/profileImage";
import { useSelector } from "react-redux";
import { ApplicationPermissionType, ApplicationRoleType, GroupsMembersPermission } from "constants/applicationConstants";
import {
  PermissionItemName,
  RoleSelectOption,
  StyledGroupIcon,
  StyledRoleSelect,
} from "./commonComponents";
import { getInitialsAndColorCode } from "util/stringUtils";
import { CustomTagProps } from "rc-select/lib/BaseSelect";
import { default as Tag } from "antd/es/tag";
import { User } from "constants/userConstants";
import { getUser } from "redux/selectors/usersSelectors";
import { EmptyContent } from "pages/common/styledComponent";
import { trans } from "i18n";
import { PermissionItem } from "./PermissionList";
import { currentApplication } from "@lowcoder-ee/redux/selectors/applicationSelector";
import { fetchAvailableGroupsMembers, fetchAvailableOrgGroupsMembers } from "@lowcoder-ee/util/pagination/axios";

const AddAppUserContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const AddPermissionDropDown = styled.div`
  margin: 8px -16px 0 -8px;

  > div {
    position: inherit !important;
  }

  .custom-ant-select-dropdown {
    height: 240px;
    position: inherit !important;
    box-shadow: none;
    border: none;
    padding: 0;

    .ant-select-item {
      width: 424px;
      transition: unset;
      padding: 0;

      .ant-select-item-option-state {
        width: 16px;
        height: 16px;
        margin-right: 8px;
      }
    }

    .rc-virtual-list-holder {
      overflow-y: overlay !important;

      &::-webkit-scrollbar {
        width: 16px;
      }

      &::-webkit-scrollbar-thumb {
        border: 5px solid transparent;
        background-clip: content-box;
        border-radius: 9999px;
        background-color: rgba(139, 143, 163, 0.12);
      }

      &::-webkit-scrollbar-thumb:hover {
        background-color: rgba(139, 143, 163, 0.25);
      }
    }
  }
`;

const PermissionSelectWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 4px 8px;
  margin-top: 8px;
  background: #fdfdfd;
  outline: 1px dashed #d7d9e0;

  .ant-select {
    font-size: 13px;
    line-height: 13px;
  }

  &:hover {
    outline: 1px dashed #8b8fa3;
  }

  &:focus-within {
    outline: 1px dashed rgb(203, 212, 245);
    border-radius: 4px;
    box-shadow: 0 0 0 3px rgb(24 144 255 / 20%);
  }

  .ant-select-selection-item {
    padding: 0;
    display: flex;
    align-items: center;
  }
`;

const AddPermissionsSelect = styled(CustomSelect)`
  width: 328px;
  max-height: 64px;
  overflow-y: scroll;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    display: none;
  }

  &&& {
    .ant-select,
    .ant-select .ant-select-selector {
      width: 100%;
      border: none;
      box-shadow: none;
      padding: 0;
    }
  }

  .ant-select-selection-placeholder {
    color: #b8b9bf;
  }
`;
const OptionViewWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 0 8px 8px;
`;

const BottomButton = styled.div`
  margin: 4px 0 0 auto;
  display: flex;

  button {
    width: 76px;
    height: 28px;
  }
`;

const StyledTag = styled(Tag)`
  height: 24px;
  display: flex;
  background: #efeff1;
  border-radius: 12px;
  padding: 0 8px 0 3px;

  margin: 2px 0;

  .ant-tag-close-icon {
    display: flex;
    align-items: center;
    margin-left: 8px;

    &:hover svg g line {
      stroke: #222222;
    }
  }
`;

const LabelProfileImage = styled(ProfileImage)`
  && > span {
    font-size: 1px;
    transform: scale(0.5, 0.5);
  }
`;

const AddRoleSelect = styled(StyledRoleSelect)<{ $isVisible: boolean }>`
  .ant-select {
    height: 24px;
  }

  display: ${(props) => (props.$isVisible ? "unset" : "none")};
`;

type PermissionContextType = "application" | "organization";

type PermissionContextProps = {
  contextType: PermissionContextType;
  organizationId?: string;
};

type AddAppOptionView = {
  type: ApplicationPermissionType;
  id: string;
  name: string;
  avatarUrl?: string;
};

type PermissionAddEntity = {
  id: string;
  type: ApplicationPermissionType;
  key: string;
};

function isGroup(data: GroupsMembersPermission) {
  return data?.type === "Group"
}

function getPermissionOptionView(
  groupsMembers: GroupsMembersPermission[],
  filterItems: PermissionItem[]
): AddAppOptionView[] {

  let permissionsViews = groupsMembers?.map((user) => {
    return {
      type: user.type as ApplicationPermissionType,
      id: isGroup(user) ? user.data.groupId : user.data.userId,
      name: isGroup(user) ? user.data.groupName : user.data.name,
      ...(isGroup(user) ? {} : { avatarUrl: user.data.avatarUrl })
    }
  })

  permissionsViews = permissionsViews.filter((v) =>
    !filterItems.find((i) => i.id === v.id && i.type === v.type)
  );

  return permissionsViews.filter((v) => v.id && v.name) as AddAppOptionView[];
}

function PermissionSelectorOption(props: { optionView: AddAppOptionView }) {
  const { optionView } = props;
  const groupIcon = optionView.type === "Group" && (
    <StyledGroupIcon $color={getInitialsAndColorCode(optionView.name)[1]} />
  );
  return (
    <OptionViewWrapper>
      <ProfileImage
        userName={optionView.name}
        side={32}
        source={optionView.avatarUrl}
        svg={groupIcon}
      />
      <PermissionItemName title={optionView.name}>{optionView.name}</PermissionItemName>
    </OptionViewWrapper>
  );
}

function PermissionSelectorLabel(props: { view: AddAppOptionView }) {
  const { view } = props;
  const groupIcon = view.type === "Group" && (
    <StyledGroupIcon $color={getInitialsAndColorCode(view.name)[1]} $side={9} />
  );
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <LabelProfileImage userName={view.name} side={18} source={view.avatarUrl} svg={groupIcon} />
      <CommonTextLabel
        style={{
          marginLeft: "4px",
          maxWidth: "240px",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          lineHeight: "15px",
        }}
      >
        {view.name}
      </CommonTextLabel>
    </div>
  );
}

function PermissionTagRender(props: CustomTagProps) {
  const { label, value, closable, onClose } = props;
  return (
    <StyledTag
      closeIcon={<CloseIcon style={{ width: "12px", height: "12px" }} />}
      color={value}
      closable={closable}
      onClose={onClose}
      style={{ marginRight: 3, display: "flex", alignItems: "center" }}
    >
      {label}
    </StyledTag>
  );
}

export enum PermissionRole {
  Viewer = "viewer",
  Editor = "editor",
  Owner = "owner",
}

const PermissionSelector = (props: {
  selectedItems: PermissionAddEntity[];
  setSelectRole: (role: ApplicationRoleType) => void;
  setSelectedItems: (items: PermissionAddEntity[]) => void;
  user: User;
  filterItems: PermissionItem[];
  supportRoles: { label: string; value: PermissionRole }[];
  contextType: PermissionContextType;
  organizationId?: string;
}) => {
  const { selectedItems, setSelectRole, setSelectedItems, user, contextType, organizationId } = props;
  const [roleSelectVisible, setRoleSelectVisible] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const [optionViews, setOptionViews] = useState<AddAppOptionView[]>()
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const application = useSelector(currentApplication)

  const debouncedUserSearch = useCallback(
    debounce((searchTerm: string) => {
      setIsLoading(true);
      
      if (contextType === "application" && application) {
        fetchAvailableGroupsMembers(application.applicationId, searchTerm).then(res => {
          if(res.success) {
            setOptionViews(getPermissionOptionView(res.data, props.filterItems))
          }
          setIsLoading(false);
        }).catch(() => {
          setIsLoading(false);
        });
      } else if (contextType === "organization" && organizationId) {
        fetchAvailableOrgGroupsMembers(organizationId, searchTerm).then(res => {
          if(res.success) {
            setOptionViews(getPermissionOptionView(res.data || [], props.filterItems))
          }
          setIsLoading(false);
        }).catch(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    }, 500),
    [application, props.filterItems, contextType, organizationId]
  );

  useEffect(() => {
    debouncedUserSearch(searchValue);
    return () => {
      debouncedUserSearch.cancel();
    };
  }, [searchValue, debouncedUserSearch]);



  useEffect(() => {
    setRoleSelectVisible(selectedItems.length > 0);
    if (selectRef && selectRef.current) {
      selectRef.current.scrollTop = selectRef.current.scrollHeight;
    }
  }, [selectedItems]);

  return (
    <>
      <Search
        placeholder={trans("home.addPermissionPlaceholder")}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
      />
      <PermissionSelectWrapper>
        <AddPermissionsSelect
          open
          ref={selectRef}
          placeholder={trans("home.selectedUsersAndGroups")}
          mode="multiple"
          showSearch={false}
          getPopupContainer={() => document.getElementById("add-app-user-permission-dropdown")!}
          optionLabelProp="label"
          tagRender={PermissionTagRender}
          listHeight={240}
          menuItemSelectedIcon={<CheckoutIcon />}
          notFoundContent={<EmptyContent style={{ paddingRight: "8px" }} />}
          onSelect={(value: any, option: any) => {
            setSelectedItems(
              selectedItems.concat({
                id: option.entityid,
                type: option.type,
                key: option.key,
              })
            );
          }}
          onDeselect={(value: any, option: any) => {
            setSelectedItems(selectedItems.filter((item) => item.key !== option.key));
          }}
        >
          {optionViews?.map((view) => {
            return (
              <CustomSelect.Option
                key={`${view.type}-${view.id}`}
                entityid={view.id}
                type={view.type}
                value={view.name}
                label={<PermissionSelectorLabel view={view} />}
              >
                <PermissionSelectorOption optionView={view} />
              </CustomSelect.Option>
            );
          })}
        </AddPermissionsSelect>
        <AddRoleSelect
          styles={{
            popup: {
              root: { width: "fit-content" }
            }
          }}
          $isVisible={roleSelectVisible}
          variant="borderless"
          defaultValue={props.supportRoles[0]}
          optionLabelProp="label"
          onChange={(value: string) => setSelectRole(value as ApplicationRoleType)}
        >
          {props.supportRoles.map((role) => (
            <CustomSelect.Option key={role.value} value={role.value} label={role.label}>
              <RoleSelectOption role={role.label} />
            </CustomSelect.Option>
          ))}
        </AddRoleSelect>
      </PermissionSelectWrapper>
      <AddPermissionDropDown id="add-app-user-permission-dropdown" />
    </>
  );
};

export const Permission = (props: {
  filterItems: PermissionItem[];
  supportRoles: { label: string; value: PermissionRole }[];
  onCancel: () => void;
  addPermission: (userIds: string[], groupIds: string[], role: string) => void;
} & PermissionContextProps) => {
  const { onCancel, contextType = "application", organizationId } = props;
  const user = useSelector(getUser);
  const [selectRole, setSelectRole] = useState<ApplicationRoleType>("viewer");
  const [selectedItems, setSelectedItems] = useState<PermissionAddEntity[]>([]);

  return (
    <AddAppUserContent>
      <CommonTextLabel style={{ marginTop: "16px" }}>
        {trans("home.searchMemberOrGroup")}
      </CommonTextLabel>
      <PermissionSelector
        selectedItems={selectedItems}
        setSelectRole={setSelectRole}
        setSelectedItems={setSelectedItems}
        user={user}
        filterItems={props.filterItems}
        supportRoles={props.supportRoles}
        contextType={contextType}
        organizationId={organizationId}
      />
      <BottomButton>
        <TacoButton style={{ marginRight: "8px" }} onClick={onCancel}>
          {trans("cancel") + " "}
        </TacoButton>
        <TacoButton
          buttonType="primary"
          onClick={() => {
            const uids = selectedItems
              .filter((item) => item.type === "User")
              .map((item) => item.id);
            const gids = selectedItems
              .filter((item) => item.type === "Group")
              .map((item) => item.id);
            if (uids.length === 0 && gids.length === 0) {
              onCancel();
              return;
            }
            props.addPermission(uids, gids, selectRole);
          }}
        >
          {trans("finish") + " "}
        </TacoButton>
      </BottomButton>
    </AddAppUserContent>
  );
};
