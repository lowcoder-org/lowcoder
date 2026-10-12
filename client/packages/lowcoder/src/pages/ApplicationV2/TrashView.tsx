import { useSelector } from "react-redux";
import { getUser } from "redux/selectors/usersSelectors";
import { ApplicationMeta } from "constants/applicationConstants";
import { useAdminPagination } from "components/layout/useAdminPagination";
import { HomeLayout } from "./HomeLayout";
import { TRASH_URL } from "../../constants/routesURL";
import { useState, useCallback } from "react";
import { useDebouncedValue } from "util/hooks";
import { trans } from "../../i18n";
import { Helmet } from "react-helmet";
import {fetchApplicationElements} from "@lowcoder-ee/util/pagination/axios";

export function TrashView() {
    const [searchValue, setSearchValue] = useState("");
    const [typeFilter, setTypeFilter] = useState<number>(0);
    const [modify, setModify] = useState(false);

  const user = useSelector(getUser);
  const debouncedSearch = useDebouncedValue(searchValue, 300).trim();
  const loadPage = useCallback((page: number, size: number) => fetchApplicationElements({
      pageNum: page, pageSize: size, name: debouncedSearch,
      applicationType: typeFilter === 7 ? 3 : typeFilter,
  }), [debouncedSearch, typeFilter, modify]);
  const pagination = useAdminPagination<ApplicationMeta>({
    scope: user.currentOrgId,
    filterKey: JSON.stringify([debouncedSearch, typeFilter]),
    loadPage,
  });
  const { currentPage, pageSize, setCurrentPage, setPageSize } = pagination;

  return (
    <>
      <Helmet>{<title>{trans("home.trash")}</title>}</Helmet>
      <HomeLayout
          elements={pagination.elements}
          breadcrumb={[{ text: trans("home.trash"), path: TRASH_URL }]}
          mode={"trash"}
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
      />
    </>
  );
}

