import { useAdminPagination } from "components/layout/useAdminPagination";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { HomeBreadcrumbType, HomeLayout } from "./HomeLayout";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useDebouncedValue } from "util/hooks";
import {ApplicationCategoriesEnum, ApplicationMeta, FolderMeta} from "../../constants/applicationConstants";
import { buildFolderUrl } from "../../constants/routesURL";
import { foldersSelector } from "../../redux/selectors/folderSelector";
import { Helmet } from "react-helmet";
import { trans } from "i18n";
import {ApplicationPaginationType} from "@lowcoder-ee/util/pagination/type";
import {fetchFolderElements} from "@lowcoder-ee/util/pagination/axios";
import { fetchFolderElements as fetchFolderElementsRedux } from "../../redux/reduxActions/folderActions";
import { getUser } from "../../redux/selectors/usersSelectors";
import { flattenFolderTree, getFolderPath } from "../../util/folderUtils";

export function FolderView() {
  const { folderId } = useParams<{ folderId: string }>();
  const [typeFilter, setTypeFilter] = useState<number>(0);
  const [modify, setModify] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ApplicationCategoriesEnum | "All">("All");

  const dispatch = useDispatch();

  const allFolders = useSelector(foldersSelector);
  const user = useSelector(getUser);

  const folder = useMemo(
    () =>
      flattenFolderTree(allFolders).find((item) => item.folderId === folderId),
    [allFolders, folderId],
  );
  const breadcrumbs = useMemo<HomeBreadcrumbType[]>(
    () =>
      getFolderPath(folderId, allFolders).map((item) => ({
        text: item.name,
        path: buildFolderUrl(item.folderId),
      })),
    [allFolders, folderId],
  );

  // Fetch folder data for breadcrumbs if not available
  useEffect(() => {
    if (allFolders.length === 0 && user.currentOrgId) {
      dispatch(fetchFolderElementsRedux({}));
    }
  }, [allFolders.length, user.currentOrgId, dispatch]);

  const debouncedSearch = useDebouncedValue(searchValue, 300).trim();
  const loadPage = useCallback((page: number, size: number) => fetchFolderElements({
      id: folderId,
      pageNum: page, pageSize: size, name: debouncedSearch,
      applicationType: ApplicationPaginationType[typeFilter],
      category: categoryFilter === "All" ? "" : categoryFilter,
  }), [debouncedSearch, typeFilter, modify, categoryFilter, folderId]);
  const pagination = useAdminPagination<ApplicationMeta | FolderMeta>({
    scope: user.currentOrgId ? `${user.currentOrgId}:${folderId}` : "",
    filterKey: JSON.stringify([debouncedSearch, typeFilter, categoryFilter]),
    loadPage,
  });
  const { currentPage, pageSize, setCurrentPage, setPageSize } = pagination;

  return (
    <>
      <Helmet>{<title>{folder?.name || trans("home.yourFolders")}</title>}</Helmet>
      <HomeLayout
          elements={pagination.elements}
          mode={"folder"}
          breadcrumb={breadcrumbs}
          title={folder?.name}
          currentPage ={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          total={pagination.total}
        loading={pagination.loading}
        error={pagination.error}
        onRetry={pagination.retry}
          setSearchValue={setSearchValue}
          searchValue={searchValue}
          setTypeFilterPagination={setTypeFilter}
          setModify={setModify}
          modify={modify}
          setCategoryFilterPagination={setCategoryFilter}
      />
    </>
  );
}
