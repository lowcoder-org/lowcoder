import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { Input, Pagination, Spin } from 'antd';
import { User } from 'constants/userConstants';
import { switchOrg, createOrgAction } from 'redux/reduxActions/orgActions';
import { selectSystemConfig } from 'redux/selectors/configSelectors';
import { showSwitchOrg } from '@lowcoder-ee/pages/common/customerService';
import { useWorkspaceManager } from 'util/useWorkspaceManager';
import { trans } from 'i18n';
import {
  AddIcon,
  CheckoutIcon,
  SearchIcon,
} from 'lowcoder-design';
import { ORGANIZATION_SETTING } from 'constants/routesURL';
import history from 'util/history';
import { Org } from 'constants/orgConstants';

// Styled Components
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

const WorkspaceItem = styled.div<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: ${props => props.$isActive ? '#f0f5ff' : 'transparent'};
  
  &:hover {
    background-color: ${props => props.$isActive ? '#f0f5ff' : '#f8f9fa'};
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

const CreateWorkspaceItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 13px;
  color: #4965f2;
  font-weight: 500;
  
  &:hover {
    background-color: #f0f5ff;
    color: #3651d4;
  }
  
  svg {
    width: 16px;
    height: 16px;
    margin-right: 10px;
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

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
`;

// Component Props
interface WorkspaceSectionProps {
  user: User;
  isDropdownOpen: boolean;
  onClose: () => void;
}

// Main Component
export default function WorkspaceSectionComponent({ 
  user, 
  isDropdownOpen, 
  onClose 
}: WorkspaceSectionProps) {
  const dispatch = useDispatch();
  const sysConfig = useSelector(selectSystemConfig);
  
  // Use our custom hook
  const {
    searchTerm,
    currentPage,
    totalCount,
    isLoading,
    displayWorkspaces,
    handleSearchChange,
    handlePageChange,
    pageSize,
  } = useWorkspaceManager({});

  // Early returns for better performance
  if (!showSwitchOrg(user, sysConfig)) return null;

  // Event handlers
  const handleOrgSwitch = (orgId: string) => {
    if (user.currentOrgId !== orgId) {
      dispatch(switchOrg(orgId));
    }
    onClose();
  };

  const handleCreateOrg = () => {
    dispatch(createOrgAction(user.orgs));
    history.push(ORGANIZATION_SETTING);
    onClose();
  };

  return (
    <WorkspaceSection>
      <SectionHeader>{trans("profile.switchOrg")}</SectionHeader>

      {/* Search Input - Only show if more than 3 workspaces */}
        <SearchContainer>
          <StyledSearchInput
            placeholder="Search workspaces..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            prefix={<SearchIcon style={{ color: "#8b8fa3" }} />}
            size="small"
          />
        </SearchContainer>

      {/* Workspace List */}
      <WorkspaceList>
        {isLoading ? (
          <LoadingContainer>
            <Spin size="small" />
          </LoadingContainer>
        ) : displayWorkspaces.length > 0 ? (
          displayWorkspaces.map((org: Org) => (
            <WorkspaceItem
              key={org.id}
              $isActive={user.currentOrgId === org.id}
              onClick={() => handleOrgSwitch(org.id)}
            >
              <WorkspaceName title={org.name}>{org.name}</WorkspaceName>
              {user.currentOrgId === org.id && <ActiveIcon />}
            </WorkspaceItem>
          ))
        ) : (
          <EmptyState>
            {searchTerm.trim() 
              ? "No workspaces found" 
              : "No workspaces available"
            }
          </EmptyState>
        )}
      </WorkspaceList>

      {/* Pagination - Only show when needed */}
      {totalCount > pageSize && !isLoading && (
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
            simple={totalCount > 100} // Simple mode for large datasets
          />
        </PaginationContainer>
      )}

      {/* Create Workspace Button */}
      <CreateWorkspaceItem onClick={handleCreateOrg}>
        <AddIcon />
        {trans("profile.createOrg")}
      </CreateWorkspaceItem>
    </WorkspaceSection>
  );
}