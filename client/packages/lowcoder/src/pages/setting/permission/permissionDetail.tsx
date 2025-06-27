import React, {useEffect, useState} from "react";
import { useSelector } from "react-redux";
import { getUser } from "redux/selectors/usersSelectors";
import styled from "styled-components";
import GroupPermission from "./groupUsersPermission";
import { useParams } from "react-router-dom";
import {fetchGroupUsrPagination, fetchOrgGroups } from "@lowcoder-ee/util/pagination/axios";
import PaginationComp from "@lowcoder-ee/util/pagination/Pagination";
import {OrgGroup} from "@lowcoder-ee/constants/orgConstants";

const PermissionContent = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 2200px;
  min-width: 600px;
  padding: 32px 24px 32px 12px;
  overflow: auto;
  width: 100%;
`;

export enum GroupUserKey {
  USERS = "users",
  ALL_USERS = "All Users"
}

export default function PermissionSetting(props: {currentPageProp: number, pageSizeProp: number}) {

  const {currentPageProp, pageSizeProp} = props;
  const user = useSelector(getUser);
  const [elements, setElements] = useState<any>({ elements: [], total: 0, role: "" });
  const [group, setGroup] = useState<OrgGroup>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modify, setModify] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orgId = user.currentOrgId;
  const currentUser = useSelector(getUser);
  const selectKey = useParams<{ groupId: string }>().groupId;

  useEffect( () => {
      fetchOrgGroups(
        {
          pageNum: currentPageProp,
          pageSize: pageSizeProp,
        }
      ).then(result => {
        if (result.success && !!result.data){
          if(selectKey === GroupUserKey.USERS) {
            setGroup(result.data.find(group => group.groupName == GroupUserKey.ALL_USERS))
          } else {
            setGroup(result.data.find(group => group.groupId === selectKey))
          }
        }
        else
          console.error("ERROR: fetchFolderElements", result.error)
      })
    }, [currentPageProp, pageSizeProp]
  )

  useEffect( () => {
    if (selectKey && group) {
      setLoading(true);
      setError(null);
      
      fetchGroupUsrPagination(
        {
          groupId: selectKey === GroupUserKey.USERS ? group.groupId : selectKey,
          pageNum: currentPage,
          pageSize: pageSize,
        }
      ).then(result => {
        setLoading(false);
        
        if (result.success) {
          setElements({
            elements: result.data || [], 
            total: result.total || 0,
            role: result.visitorRole || ""
          });
        } else {
          setError("Failed to load group users. Please try again.");
        }
      }).catch(err => {
        setLoading(false);
        setError("Failed to load group users. Please try again.");
      });
    } 
  }, [currentPage, pageSize, modify, selectKey, orgId, group]);

  if (!orgId) {
    return null;
  }

  return (
      <PermissionContent key={selectKey}>
        {error && (
          <div style={{ color: 'red', margin: '20px 0', textAlign: 'center' }}>
            {error}
          </div>
        )}
        {elements && 
            group && (
            <>
              <GroupPermission
                  group={group}
                  orgId={orgId}
                  groupUsers={elements.elements}
                  currentUserGroupRole={elements.role}
                  currentUser={currentUser}
                  setModify={setModify}
                  modify={modify}
                  loading={loading}
                  setElements={setElements}
              />
              <PaginationComp setCurrentPage={setCurrentPage} setPageSize={setPageSize} currentPage={currentPage} pageSize={pageSize} total={elements.total} />
            </>
          )}
      </PermissionContent>
  );
}