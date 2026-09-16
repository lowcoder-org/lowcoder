import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { HomeBreadcrumbType, HomeLayout } from "./HomeLayout";
import { useEffect, useMemo, useState } from "react";
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

interface ElementsState {
  elements: Array<ApplicationMeta | FolderMeta>;
  total: number;
}

export function FolderView() {
  const { folderId } = useParams<{ folderId: string }>();

  const [elements, setElements] = useState<ElementsState>({ elements: [], total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValues, setSearchValues] = useState("");
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

  useEffect(() => {
    setCurrentPage(1);
  }, [folderId]);

  useEffect(() => {
    let active = true;

    fetchFolderElements({
      id: folderId,
      pageNum: currentPage,
      pageSize,
      applicationType: ApplicationPaginationType[typeFilter],
      name: searchValues,
      category: categoryFilter === "All" ? "" : categoryFilter,
    }).then((data: any) => {
      if (!active) {
        return;
      }
      if (data.success) {
        setElements({ elements: data.data || [], total: data.total || 0 });
      } else {
        console.error("ERROR: fetchFolderElements", data.error);
      }
    });

    return () => {
      active = false;
    };
  }, [
    folderId,
    currentPage,
    pageSize,
    searchValues,
    typeFilter,
    modify,
    categoryFilter,
  ]);

    useEffect( () => {
            if (searchValues !== "")
                setCurrentPage(1);
        }, [searchValues]
    );

    const debouncedSearchValue = useDebouncedValue(searchValue, 500);

    useEffect(() => {
        if (debouncedSearchValue.trim().length > 0 || debouncedSearchValue === "")
            setSearchValues(debouncedSearchValue);
    }, [debouncedSearchValue]);

  return (
    <>
      <Helmet>{<title>{folder?.name || trans("home.yourFolders")}</title>}</Helmet>
      <HomeLayout
          elements={elements.elements}
          mode={"folder"}
          breadcrumb={breadcrumbs}
          title={folder?.name}
          currentPage ={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          total={elements.total}
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
