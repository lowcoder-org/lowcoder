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
    const [typeFilter, setTypeFilter] = useState<number>(0);

      useEffect( () => {
          if (typeFilter === 7) // Application of Navigation is 3 in API.
              setTypeFilter(3);
            try{
                fetchApplicationElements({
                    pageNum:currentPage,
                    pageSize:pageSize,
                    applicationType: typeFilter,
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
        }, [currentPage, pageSize, searchValues, typeFilter]
    );

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
          setSearchValues={setSearchValues}
          setTypeFilterPagination={setTypeFilter}
      />
    </>
  );
}
