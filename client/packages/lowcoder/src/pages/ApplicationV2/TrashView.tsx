import { HomeLayout } from "./HomeLayout";
import { TRASH_URL } from "../../constants/routesURL";
import {useEffect, useState} from "react";
import { trans } from "../../i18n";
import { Helmet } from "react-helmet";
import {fetchApplicationElements} from "@lowcoder-ee/util/pagination/axios";

interface ElementsState {
    elements: any;
    total: number;
}

export function TrashView() {
    const [elements, setElements] = useState<ElementsState>({ elements: [], total: 1 });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchValues, setSearchValues] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [typeFilter, setTypeFilter] = useState<number>(0);
    const [modify, setModify] = useState(false);

    useEffect( () => {
            try{
                fetchApplicationElements({
                    pageNum:currentPage,
                    pageSize:pageSize,
                    applicationType: typeFilter === 7 ? 3 : typeFilter, // // Application of Navigation is 3 in API.
                    name: searchValues,
                }).then(
                    data => {
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
        }, [currentPage, pageSize, searchValues, typeFilter, modify]
    );
    useEffect( () => {
        if (searchValues !== "")
            setCurrentPage(1);
        }, [searchValues]
    );

    //debouncing
    useEffect(()=> {
        const timer = setTimeout(() => {
            if (searchValue.length > 2 || searchValue === "")
                setSearchValues(searchValue)
        }, 500);
        return () => clearTimeout(timer);
    }, [searchValue])

  return (
    <>
      <Helmet>{<title>{trans("home.trash")}</title>}</Helmet>
      <HomeLayout
          elements={elements.elements}
          breadcrumb={[{ text: trans("home.trash"), path: TRASH_URL }]}
          mode={"trash"}
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
      />
    </>
  );
}

