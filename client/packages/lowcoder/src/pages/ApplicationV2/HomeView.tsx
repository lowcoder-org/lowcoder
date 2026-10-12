import { useAdminPagination } from "components/layout/useAdminPagination";
import { useSelector } from "react-redux";
import { HomeLayout } from "./HomeLayout";
import { getUser } from "../../redux/selectors/usersSelectors";
import { Helmet } from "react-helmet";
import { trans } from "i18n";
import { useState, useCallback } from "react";
import { useDebouncedValue } from "util/hooks";
import {fetchFolderElements} from "@lowcoder-ee/util/pagination/axios";
import {ApplicationCategoriesEnum, ApplicationMeta, FolderMeta} from "@lowcoder-ee/constants/applicationConstants";
import {ApplicationPaginationType} from "@lowcoder-ee/util/pagination/type";

export function HomeView() {
    const [searchValue, setSearchValue] = useState("");
    const [typeFilter, setTypeFilter] = useState<number>(0);
    const [modify, setModify] = useState(true);
    const [isCreated, setIsCreated] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState<ApplicationCategoriesEnum | "All">("All");

  const user = useSelector(getUser);
  const debouncedSearch = useDebouncedValue(searchValue, 300).trim();
  const loadPage = useCallback((page: number, size: number) => fetchFolderElements({
      pageNum: page, pageSize: size, name: debouncedSearch,
      applicationType: ApplicationPaginationType[typeFilter],
      category: categoryFilter === "All" ? "" : categoryFilter,
  }), [debouncedSearch, typeFilter, modify, categoryFilter, isCreated]);
  const pagination = useAdminPagination<ApplicationMeta | FolderMeta>({
    scope: user.currentOrgId,
    filterKey: JSON.stringify([debouncedSearch, typeFilter, categoryFilter]),
    loadPage,
  });
  const { currentPage, pageSize, setCurrentPage, setPageSize } = pagination;

  return (
    <>
      <Helmet>{<title>{trans("productName")} {trans("home.home")}</title>}</Helmet>
      <HomeLayout
        elements={pagination.elements}
        mode={"view"}
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
        setIsCreated={setIsCreated}
        isCreated={isCreated}
      />
    </>
  );
}
