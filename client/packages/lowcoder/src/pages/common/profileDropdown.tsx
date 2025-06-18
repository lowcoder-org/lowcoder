import { default as Dropdown } from "antd/es/dropdown";
import { default as Menu, MenuItemProps } from "antd/es/menu";
import { Input } from "antd";
import { Org, OrgRoleInfo } from "constants/orgConstants";
import { ORGANIZATION_SETTING } from "constants/routesURL";
import { User } from "constants/userConstants";
import { getWorkspaces, getCurrentOrg } from "redux/selectors/orgSelectors";
import {
  AddIcon,
  CheckoutIcon,
  CommonGrayLabel,
  CommonTextLabel,
  CommonTextLabel2,
  DropdownMenu,
  DropDownSubMenu,
  EditIcon,
  PackUpIcon,
  SearchIcon,
} from "lowcoder-design";
import ProfileSettingModal from "pages/setting/profile";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createOrgAction, fetchWorkspacesAction, switchOrg } from "redux/reduxActions/orgActions";
import styled from "styled-components";
import history from "util/history";
import ProfileImage from "pages/common/profileImage";
import { isProfileSettingModalVisible } from "redux/selectors/usersSelectors";
import { logoutAction, profileSettingModalVisible } from "redux/reduxActions/userActions";
import { trans } from "i18n";
import { showSwitchOrg } from "@lowcoder-ee/pages/common/customerService";
import { checkIsMobile } from "util/commonUtils";
import { selectSystemConfig } from "redux/selectors/configSelectors";
import type { ItemType } from "antd/es/menu/interface";
import { Pagination } from "antd";
import { debounce } from "lodash";
import UserApi from "api/userApi";
const { Item } = Menu;

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

const WorkspaceSection = styled.div`
  padding: 8px 0;
`;

const SectionHeader = styled.div`
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  color: #8b8fa3;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SearchContainer = styled.div`
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
`;

const StyledSearchInput = styled(Input)`
  .ant-input {
    border: 1px solid #e1e3eb;
    border-radius: 6px;
    font-size: 13px;
    
    &:focus {
      border-color: #4965f2;
      box-shadow: 0 0 0 2px rgba(73, 101, 242, 0.1);
    }
  }
`;

const WorkspaceList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

const WorkspaceItem = styled.div<{ isActive?: boolean }>`
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: ${props => props.isActive ? '#f0f5ff' : 'transparent'};
  
  &:hover {
    background-color: ${props => props.isActive ? '#f0f5ff' : '#f8f9fa'};
  }
`;

const WorkspaceName = styled.div`
  flex: 1;
  font-size: 13px;
  color: #222222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActiveIcon = styled(CheckoutIcon)`
  width: 16px;
  height: 16px;
  color: #4965f2;
  margin-left: 8px;
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

const CreateWorkspaceItem = styled(ActionItem)`
  color: #4965f2;
  font-weight: 500;
  
  
  &:hover {
    background-color: #f0f5ff;
    color: #3651d4;
  }
  
  svg {
    color: #4965f2;
  }
  
  &:hover svg {
    color: #3651d4;
  }
`;

const EmptyState = styled.div`
  padding: 20px 16px;
  text-align: center;
  color: #8b8fa3;
  font-size: 13px;
`;

const StyledDropdown = styled(Dropdown)`
  display: flex;
  flex-direction: column;
  min-width: 0;
  align-items: end;
`;


const PaginationContainer = styled.div`
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: center;
  
  .ant-pagination {
    margin: 0;
    
    .ant-pagination-item {
      min-width: 24px;
      height: 24px;
      line-height: 22px;
      font-size: 12px;
      margin-right: 4px;
    }
    
    .ant-pagination-prev,
    .ant-pagination-next {
      min-width: 24px;
      height: 24px;
      line-height: 22px;
      margin-right: 4px;
    }
    
    .ant-pagination-item-link {
      font-size: 11px;
    }
  }
`;
const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: #8b8fa3;
  font-size: 13px;
`;

type DropDownProps = {
  onClick?: (text: string) => void;
  user: User;
  profileSide: number;
  fontSize?: number;
};

export default function ProfileDropdown(props: DropDownProps) {
  const { avatarUrl, username, orgs, currentOrgId } = props.user;
  const currentOrgRoleId = props.user.orgRoleMap.get(currentOrgId);
  const workspaces = useSelector(getWorkspaces);
  const currentOrg = useSelector(getCurrentOrg);
  const settingModalVisible = useSelector(isProfileSettingModalVisible);
  const sysConfig = useSelector(selectSystemConfig);
  const dispatch = useDispatch();

   // Local state for pagination and search
   const [searchTerm, setSearchTerm] = useState("");
   const [dropdownVisible, setDropdownVisible] = useState(false);
   const [currentPageWorkspaces, setCurrentPageWorkspaces] = useState<Org[]>([]);
   const [currentPage, setCurrentPage] = useState(1);
   const [totalCount, setTotalCount] = useState(0);
   const [isLoading, setIsLoading] = useState(false);
   const [isSearching, setIsSearching] = useState(false);
 
   const pageSize = 10;

     // Determine which workspaces to show
  const displayWorkspaces = useMemo(() => {
    if (searchTerm.trim()) {
      return currentPageWorkspaces; // Search results
    }
    if (currentPage === 1) {
      return workspaces.items; // First page from Redux
    }
    return currentPageWorkspaces; // Other pages from API
  }, [searchTerm, currentPage, workspaces.items, currentPageWorkspaces]);

  // Update total count based on context
  useEffect(() => {
    if (searchTerm.trim()) {
      // Keep search result count
      return;
    }
    if (currentPage === 1) {
      setTotalCount(workspaces.totalCount);
    }
  }, [searchTerm, currentPage, workspaces.totalCount]);

 // Fetch workspaces for specific page
 const fetchWorkspacesPage = async (page: number, search?: string) => {
  setIsLoading(true);
  try {
    const response = await UserApi.getMyOrgs(page, pageSize, search);
    if (response.data.success) {
      const apiData = response.data.data;
      const transformedItems = apiData.data.map(item => ({
        id: item.orgId,
        name: item.orgName,
      }));
      
      setCurrentPageWorkspaces(transformedItems as Org[]);
      setTotalCount(apiData.total);
    }
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    setCurrentPageWorkspaces([]);
  } finally {
    setIsLoading(false);
  }
};

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (page === 1 && !searchTerm.trim()) {
      // Use Redux data for first page when not searching
      setCurrentPageWorkspaces([]);
    } else {
      // Fetch from API for other pages or when searching
      fetchWorkspacesPage(page, searchTerm.trim() || undefined);
    }
  };

  
  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(async (term: string) => {
      if (!term.trim()) {
        setCurrentPage(1);
        setCurrentPageWorkspaces([]);
        setTotalCount(workspaces.totalCount);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setCurrentPage(1);
      await fetchWorkspacesPage(1, term);
      setIsSearching(false);
    }, 300),
    [workspaces.totalCount]
  );



  // Reset state when dropdown closes
  useEffect(() => {
    if (!dropdownVisible) {
      setCurrentPageWorkspaces([]);
      setCurrentPage(1);
      setSearchTerm("");
      setTotalCount(workspaces.totalCount);
      setIsSearching(false);
    }
  }, [dropdownVisible, workspaces.totalCount]);

 

  const filteredOrgs = useMemo(() => {
    if (!searchTerm.trim()) return workspaces.items;
    return workspaces.items.filter(org => 
      org.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [workspaces.items, searchTerm]);

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

  const handleOrgSwitch = (orgId: string) => {
    if (currentOrgId !== orgId) {
      dispatch(switchOrg(orgId));
    }
    setDropdownVisible(false);
  };

  const handleCreateOrg = () => {
    dispatch(createOrgAction(orgs));
    history.push(ORGANIZATION_SETTING);
    setDropdownVisible(false);
  };

 // Handle search input change
 const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setSearchTerm(value);
  debouncedSearch(value);
};

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

      {/* Workspaces Section */}
      {workspaces.items &&
        workspaces.items.length > 0 &&
        showSwitchOrg(props.user, sysConfig) && (
          <WorkspaceSection>
            <SectionHeader>{trans("profile.switchOrg")}</SectionHeader>

            {workspaces.items.length > 3 && (
              <SearchContainer>
                <StyledSearchInput
                  placeholder="Search workspaces..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  prefix={<SearchIcon style={{ color: "#8b8fa3" }} />}
                  size="small"
                />
              </SearchContainer>
            )}

            {/* Workspaces List */}
            <WorkspaceList>
              {isSearching || isLoading ? (
                <LoadingSpinner>
                  <PackUpIcon
                    style={{
                      animation: "spin 1s linear infinite",
                      marginRight: "8px",
                    }}
                  />
                  {isSearching ? "Searching..." : "Loading..."}
                </LoadingSpinner>
              ) : displayWorkspaces.length > 0 ? (
                displayWorkspaces.map((org: Org) => (
                  <WorkspaceItem
                    key={org.id}
                    isActive={currentOrgId === org.id}
                    onClick={() => handleOrgSwitch(org.id)}
                  >
                    <WorkspaceName title={org.name}>{org.name}</WorkspaceName>
                    {currentOrgId === org.id && <ActiveIcon />}
                  </WorkspaceItem>
                ))
              ) : (
                <EmptyState>
                  {searchTerm.trim()
                    ? "No workspaces found"
                    : "No workspaces available"}
                </EmptyState>
              )}
            </WorkspaceList>

            {/* Pagination */}
            {totalCount > pageSize && !isSearching && !isLoading && (
              <PaginationContainer>
                <Pagination
                  current={currentPage}
                  total={totalCount}
                  pageSize={pageSize}
                  size="small"
                  showSizeChanger={false}
                  showQuickJumper={false}
                  showTotal={(total, range) =>
                    `${range[0]}-${range[1]} of ${total}`
                  }
                  onChange={handlePageChange}
                  simple={totalCount > 100}
                />
              </PaginationContainer>
            )}
            <CreateWorkspaceItem onClick={handleCreateOrg}>
              <AddIcon />
              {trans("profile.createOrg")}
            </CreateWorkspaceItem>
          </WorkspaceSection>
        )}

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
        dropdownRender={() => dropdownContent}
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
