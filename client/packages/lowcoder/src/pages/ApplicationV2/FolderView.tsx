import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { HomeBreadcrumbType, HomeLayout } from "./HomeLayout";
import {useEffect, useState} from "react";
import {ApplicationCategoriesEnum, ApplicationMeta, FolderMeta} from "../../constants/applicationConstants";
import { buildFolderUrl } from "../../constants/routesURL";
import { folderElementsSelector, foldersSelector } from "../../redux/selectors/folderSelector";
import { Helmet } from "react-helmet";
import { trans } from "i18n";
import {ApplicationPaginationType} from "@lowcoder-ee/util/pagination/type";
import {fetchFolderElements} from "@lowcoder-ee/util/pagination/axios";

function getBreadcrumbs(
  folder: FolderMeta,
  allFolders: FolderMeta[],
  breadcrumb: HomeBreadcrumbType[]
): HomeBreadcrumbType[] {
  if (folder.parentFolderId) {
    return getBreadcrumbs(
      allFolders.filter((f) => f.folderId === folder.parentFolderId)[0],
      allFolders,
      [
        {
          text: folder.name,
          path: buildFolderUrl(folder.folderId),
        },
        ...breadcrumb,
      ]
    );
  }
  return breadcrumb;
}

interface ElementsState {
  elements: ApplicationMeta[];
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

  const element = useSelector(folderElementsSelector);
  const allFolders = useSelector(foldersSelector);

  const folder = allFolders.filter((f) => f.folderId === folderId)[0] || {};
  const breadcrumbs = getBreadcrumbs(folder, allFolders, [
    {
      text: folder.name,
      path: buildFolderUrl(folder.folderId),
    },
  ]);

  useEffect( () => {
        try{
          fetchFolderElements({
            id: folderId,
            pageNum:currentPage,
            pageSize:pageSize,
            applicationType: ApplicationPaginationType[typeFilter],
            name: searchValues,
            category: categoryFilter === "All" ? "" : categoryFilter
          }).then(
              (data: any) => {
                if (data.success) {
                  setElements({elements: data.data || [], total: data.total || 1})
                }
                else
                  console.error("ERROR: fetchFolderElements", data.error)
              }
          );
        } catch (error) {
          console.error('Failed to fetch data:', error);
        }
      }, [currentPage, pageSize, searchValues, typeFilter, modify, categoryFilter]);

    useEffect( () => {
            if (searchValues !== "")
                setCurrentPage(1);
        }, [searchValues]
    );

    useEffect(()=> {
        const timer = setTimeout(() => {
            if (searchValue.length > 2 || searchValue === "")
                setSearchValues(searchValue)
        }, 500);
        return () => clearTimeout(timer);
    }, [searchValue])

  return (
    <>
      <Helmet>{<title>{trans("home.yourFolders")}</title>}</Helmet>
      <HomeLayout
          elements={elements.elements}
          mode={"folder"}
          breadcrumb={breadcrumbs}
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
