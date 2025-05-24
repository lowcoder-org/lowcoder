import React, {useEffect, useState} from "react";
import { useSelector } from "react-redux";
import { getUser } from "redux/selectors/usersSelectors";
import styled from "styled-components";
import GroupPermission from "./groupUsersPermission";
import UsersPermission from "./orgUsersPermission";
import { useParams } from "react-router-dom";
import {fetchGroupUsrPagination, fetchOrgGroups, fetchOrgUsrPagination} from "@lowcoder-ee/util/pagination/axios";
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

export default function PermissionSetting(props: {currentPageProp: number, pageSizeProp: number}) {

  const {currentPageProp, pageSizeProp} = props;
  const user = useSelector(getUser);
  const [elements, setElements] = useState<any>({ elements: [], total: 0, role: "" });
  const [group, setGrouop] = useState<OrgGroup>();
  const [orgMemberElements, setOrgMemberElements] = useState<any>({ elements: [], total: 0 })
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
          setGrouop(result.data.find(group => group.groupId === selectKey))
        }
        else
          console.error("ERROR: fetchFolderElements", result.error)
      })
    }, [currentPageProp, pageSizeProp]
  )

  useEffect( () => {
    if (selectKey !== "users" && selectKey) {
      setLoading(true);
      setError(null);
      
      fetchGroupUsrPagination(
        {
          groupId: selectKey,
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
    } else {
      setLoading(true);
      setError(null);
      
      fetchOrgUsrPagination(
        {
          orgId: orgId,
          pageNum: currentPage,
          pageSize: pageSize,
        }
      ).then(result => {
        setLoading(false);
        if (result.success){
          setOrgMemberElements({
            elements: result.data || [], 
            total: result.total || 0
          });
        }
        else {
          setError("Failed to load organization users. Please try again.");
        }
      }).catch(err => {
        setLoading(false);
        setError("Failed to load organization users. Please try again.");
      });
    }
  }, [currentPage, pageSize, modify, selectKey, orgId]);

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
        
        {selectKey === "users" ? (
            <>
              <UsersPermission
                  orgId={orgId}
                  orgUsers={orgMemberElements.elements}
                  currentUser={currentUser}
                  setModify={setModify}
                  modify={modify}
                  loading={loading}
              />
              <PaginationComp setCurrentPage={setCurrentPage} setPageSize={setPageSize} currentPage={currentPage} pageSize={pageSize} total={orgMemberElements.total} />
            </>
        ) : (
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
                  />
                  <PaginationComp setCurrentPage={setCurrentPage} setPageSize={setPageSize} currentPage={currentPage} pageSize={pageSize} total={elements.total} />
                </>
            )
        )}
      </PermissionContent>
  );
}