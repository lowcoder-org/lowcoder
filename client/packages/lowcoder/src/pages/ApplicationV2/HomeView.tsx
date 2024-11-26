import { useSelector } from "react-redux";
import { HomeLayout } from "./HomeLayout";
import { getUser } from "../../redux/selectors/usersSelectors";
import { Helmet } from "react-helmet";
import { trans } from "i18n";
import {useState, useEffect } from "react";
import {fetchFolderElements} from "@lowcoder-ee/util/pagination/axios";
import {ApplicationMeta, FolderMeta} from "@lowcoder-ee/constants/applicationConstants";
import {ApplicationPaginationType} from "@lowcoder-ee/util/pagination/type";

interface ElementsState {
    elements: (ApplicationMeta | FolderMeta)[];
    total: number;
}

export function HomeView() {
    const [elements, setElements] = useState<ElementsState>({ elements: [], total: 1 });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchValues, setSearchValues] = useState("");
    const [typeFilter, setTypeFilter] = useState<number>(0);
      useEffect( () => {
          try{

              fetchFolderElements({
                  pageNum:currentPage,
                  pageSize:pageSize,
                  applicationType: ApplicationPaginationType[typeFilter],
                  name: searchValues,
              }).then(
                  data => {
                      console.log(data)
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
          }, [currentPage, pageSize, searchValues, typeFilter]
      );

  console.log(currentPage, pageSize);

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
        setSearchValues={setSearchValues}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
      />
    </>
  );
}
