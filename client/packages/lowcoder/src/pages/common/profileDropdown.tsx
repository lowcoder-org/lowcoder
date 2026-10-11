import { default as Dropdown } from "antd/es/dropdown";
import { Org, OrgRoleInfo } from "constants/orgConstants";
import { User } from "constants/userConstants";
import { getCurrentOrg } from "redux/selectors/orgSelectors";
import {
  CommonTextLabel,
  EditIcon,
} from "lowcoder-design";
import ProfileSettingModal from "pages/setting/profile";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import ProfileImage from "pages/common/profileImage";
import { isProfileSettingModalVisible } from "redux/selectors/usersSelectors";
import { logoutAction, profileSettingModalVisible } from "redux/reduxActions/userActions";
import { trans } from "i18n";
import { checkIsMobile } from "util/commonUtils";
import WorkspaceSectionComponent from "./WorkspaceSection";

// Keep existing styled components for profile and actions
const ProfileDropdownContainer = styled.div`
  width: 280px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid #e1e3eb;
  overflow: hidden;
`;

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f8f9fa;
  }
`;

const ProfileInfo = styled.div`
  margin-left: 12px;
  flex: 1;
  min-width: 0;
`;

const ProfileName = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: #222222;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProfileOrg = styled.div`
  font-size: 12px;
  color: #8b8fa3;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProfileRole = styled.div`
  font-size: 11px;
  color: #4965f2;
  background: #f0f5ff;
  border: 1px solid #d6e4ff;
  border-radius: 4px;
  padding: 2px 6px;
  display: inline-block;
  max-width: fit-content;
`;

const ActionsSection = styled.div`
  border-top: 1px solid #f0f0f0;
`;

const ActionItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 13px;
  color: #222222;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  svg {
    width: 16px;
    height: 16px;
    margin-right: 10px;
  }
`;

const StyledDropdown = styled(Dropdown)`
  display: flex;
  flex-direction: column;
  min-width: 0;
  align-items: end;
`;

// Component Props
type DropDownProps = {
  onClick?: (text: string) => void;
  user: User;
  profileSide: number;
  fontSize?: number;
};

// Simplified Main Component
export default function ProfileDropdown(props: DropDownProps) {
  const { avatarUrl, username, currentOrgId } = props.user;
  const currentOrgRoleId = props.user.orgRoleMap.get(currentOrgId);
  const currentOrg = useSelector(getCurrentOrg);
  const settingModalVisible = useSelector(isProfileSettingModalVisible);
  const dispatch = useDispatch();

  // Simple state - only what we need
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // Event handlers
  const handleProfileClick = () => {
    if (checkIsMobile(window.innerWidth)) {
      setDropdownVisible(false);
      return;
    }
    dispatch(profileSettingModalVisible(true));
    setDropdownVisible(false);
  };

  const handleLogout = () => {
    const organizationId = localStorage.getItem('lowcoder_login_orgId');
    if (organizationId) {
      localStorage.removeItem('lowcoder_login_orgId');
    }
    dispatch(logoutAction({
      organizationId: organizationId || undefined,
    }));
    setDropdownVisible(false);
  };

  const handleDropdownClose = () => {
    setDropdownVisible(false);
  };

  // Dropdown content
  const dropdownContent = (
    <ProfileDropdownContainer onClick={(e) => e.stopPropagation()}>
      {/* Profile Section */}
      <ProfileSection onClick={handleProfileClick}>
        <ProfileImage source={avatarUrl} userName={username} side={40} />
        <ProfileInfo>
          <ProfileName title={username}>{username}</ProfileName>
          {currentOrg && (
            <ProfileOrg title={currentOrg.name}>{currentOrg.name}</ProfileOrg>
          )}
          {currentOrgRoleId && OrgRoleInfo[currentOrgRoleId] && (
            <ProfileRole>{OrgRoleInfo[currentOrgRoleId].name}</ProfileRole>
          )}
        </ProfileInfo>
        {!checkIsMobile(window.innerWidth) && (
          <EditIcon style={{ color: "#8b8fa3" }} />
        )}
      </ProfileSection>

      {/* Workspaces Section - Now extracted and clean! */}
      <WorkspaceSectionComponent 
        user={props.user}
        isDropdownOpen={dropdownVisible}
        onClose={handleDropdownClose}
      />

      {/* Actions Section */}
      <ActionsSection>
        <ActionItem onClick={handleLogout}>
          {trans("profile.logout")}
        </ActionItem>
      </ActionsSection>
    </ProfileDropdownContainer>
  );

  return (
    <>
      <StyledDropdown
        open={dropdownVisible}
        onOpenChange={setDropdownVisible}
        popupRender={() => dropdownContent}
        trigger={["click"]}
        placement="bottomRight"
      >
        <div>
          <ProfileImage
            style={{ cursor: "pointer", userSelect: "none" }}
            source={avatarUrl}
            userName={username}
            side={props.profileSide}
            fontSize={props.fontSize}
          />
        </div>
      </StyledDropdown>
      {settingModalVisible && <ProfileSettingModal />}
    </>
  );
}