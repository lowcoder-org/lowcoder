import { Pagination } from "antd";
import { trans } from "i18n";

interface Props {
  currentPage: number;
  pageSize: number;
  total: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  simple?: boolean;
}

export function AdminPagination({ currentPage, pageSize, total, setCurrentPage, setPageSize, simple }: Props) {
  if (total === 0) return null;
  return <Pagination
    style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", padding: simple ? "12px 8px" : "20px 16px", gap: 4 }}
    current={currentPage}
    pageSize={pageSize}
    total={total}
    simple={simple}
    responsive
    showSizeChanger={!simple}
    showTotal={simple ? undefined : (count, range) => trans("admin.resultCount", { start: range[0], end: range[1], total: count })}
    onChange={(page, size) => size !== pageSize ? setPageSize(size) : setCurrentPage(page)}
  />;
}
