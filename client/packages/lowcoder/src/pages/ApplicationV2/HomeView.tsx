import { useSelector } from "react-redux";
import { HomeLayout } from "./HomeLayout";
import { getUser } from "../../redux/selectors/usersSelectors";
import { Helmet } from "react-helmet";
import { trans } from "i18n";
import {useState, useEffect } from "react";
import {fetchFolderElements} from "@lowcoder-ee/util/pagination/axios";
import {ApplicationCategoriesEnum, ApplicationMeta, FolderMeta} from "@lowcoder-ee/constants/applicationConstants";
import {ApplicationPaginationType} from "@lowcoder-ee/util/pagination/type";

interface ElementsState {
    elements: (ApplicationMeta | FolderMeta)[];
    total: number;
}

export function HomeView() {
    const [elements, setElements] = useState<ElementsState>({ elements: [], total: 1 });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchValue, setSearchValue] = useState("");
    const [searchValues, setSearchValues] = useState("");
    const [typeFilter, setTypeFilter] = useState<number>(0);
    const [modify, setModify] = useState(true);
    const [isCreated, setIsCreated] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState<ApplicationCategoriesEnum | "All">("All");

      useEffect( () => {
        try{
          fetchFolderElements({
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
        }, [currentPage, pageSize, searchValues, typeFilter, modify, categoryFilter, isCreated]
      );

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

  const user = useSelector(getUser);

  if (!user.currentOrgId) {
    return null;
  }

  return (
    <>
      <Helmet>{<title>{trans("productName")} {trans("home.home")}</title>}</Helmet>
      <HomeLayout
        elements={elements.elements}
        mode={"view"}
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
        setIsCreated={setIsCreated}
        isCreated={isCreated}
      />
    </>
  );
}
