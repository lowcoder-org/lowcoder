import React, {useEffect, useState} from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchGroupsAction } from "redux/reduxActions/orgActions";
import { getUser } from "redux/selectors/usersSelectors";
import styled from "styled-components";
import GroupPermission from "./groupUsersPermission";
import UsersPermission from "./orgUsersPermission";
import { getOrgGroups } from "redux/selectors/orgSelectors";
import { useParams } from "react-router-dom";
import { AppState } from "redux/reducers";
import {fetchGroupUsrPagination, fetchOrgUsrPagination} from "@lowcoder-ee/util/pagination/axios";
import PaginationComp from "@lowcoder-ee/util/pagination/Pagination";

const PermissionContent = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 2200px;
  min-width: 600px;
  padding: 32px 24px 32px 12px;
  overflow: auto;
  width: 100%;
`;

const All_Users = "users";

export default function PermissionSetting() {  const user = useSelector(getUser);

  const [elements, setElements] = useState<any>({ elements: [], total: 0 });
  const [orgMemberElements, setOrgMemberElements] = useState<any>({ elements: [], total: 0 })
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modify, setModify] = useState(false);

  const orgId = user.currentOrgId;
  const orgGroups = useSelector(getOrgGroups);
  const groupUsersFetching = useSelector((state: AppState) => state.ui.org.groupUsersFetching);
  const currentUserGroupRole = useSelector((state: AppState) => state.ui.org.currentUserGroupRole);
  const currentUser = useSelector(getUser);
  const orgUsersFetching = useSelector((state: AppState) => state.ui.org.orgUsersFetching);

  const groupIdMap = new Map(orgGroups.map((group) => [group.groupId, group]));
  const selectKey = useParams<{ groupId: string }>().groupId;

  useEffect( () => {
    if (selectKey !== "users")
      fetchGroupUsrPagination(
        {
          groupId: groupIdMap.get(selectKey)!.groupId,
          pageNum: currentPage,
          pageSize: pageSize,
        }
        ).then(result => {
          if (result.success){
            setElements({elements: result.data || [], total: result.total || 1})
          }
          else
            console.error("ERROR: fetchFolderElements", result.error)
        }
        )
    else
      fetchOrgUsrPagination(
          {
            orgId: orgId,
            pageNum: currentPage,
            pageSize: pageSize,
          }
      ).then(result => {
            if (result.success){
              setOrgMemberElements({elements: result.data || [], total: result.total || 1})
            }
            else
              console.error("ERROR: fetchFolderElements", result.error)
          }
      )
      },
      [currentPage, pageSize, modify]
  )

  if (!orgId) {
    return null;
  }

  return (
      <PermissionContent key={selectKey}>
        {selectKey === All_Users ? (
            <>
              <UsersPermission
                  orgId={orgId}
                  orgUsersFetching={orgUsersFetching}
                  // orgUsers={!orgMemberElements.elements.members ? [] : orgMemberElements.elements.members}
                  orgUsers={orgMemberElements.elements}
                  currentUser={currentUser}
                  setModify={setModify}
                  modify={modify}
              />
              <PaginationComp setCurrentPage={setCurrentPage} setPageSize={setPageSize} currentPage={currentPage} pageSize={pageSize} total={orgMemberElements.total} />
            </>
        ) : (
            groupIdMap.has(selectKey) && (
                <>
                  <GroupPermission
                      group={groupIdMap.get(selectKey)!}
                      orgId={orgId}
                      groupUsers={elements.elements}
                      groupUsersFetching={groupUsersFetching}
                      currentUserGroupRole={currentUserGroupRole}
                      currentUser={currentUser}
                      setModify={setModify}
                      modify={modify}
                  />
                  <PaginationComp setCurrentPage={setCurrentPage} setPageSize={setPageSize} currentPage={currentPage} pageSize={pageSize} total={elements.total} />
                </>

            )
        )}
      </PermissionContent>
  );
}