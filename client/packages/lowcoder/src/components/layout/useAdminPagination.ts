import { useCallback, useEffect, useMemo, useState } from "react";

interface PageResult<T> {
  success: boolean;
  data?: T[];
  total?: number;
}

interface Options<T> {
  scope: string;
  filterKey: string;
  loadPage: (page: number, pageSize: number) => Promise<PageResult<T>>;
}

// Keep API paging authoritative. A filter or workspace change starts at page 1,
// and late responses can never replace a newer request's rows.
export function useAdminPagination<T>({ scope, filterKey, loadPage }: Options<T>) {
  const key = JSON.stringify([scope, filterKey]);
  const [position, setPosition] = useState({ key, page: 1, size: 10 });
  const currentPage = position.key === key ? position.page : 1;
  const pageSize = position.size;
  const requestKey = JSON.stringify([key, currentPage, pageSize]);
  const [result, setResult] = useState({ key: "", elements: [] as T[], total: 0, error: false });
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  const setCurrentPage = useCallback((page: number) => {
    setPosition((previous) => ({ ...previous, key, page: Math.max(1, page) }));
  }, [key]);
  const setPageSize = useCallback((size: number) => {
    setPosition({ key, page: 1, size });
  }, [key]);
  const retry = useCallback(() => setRevision((value) => value + 1), []);
  const emptyElements = useMemo<T[]>(() => [], []);

  useEffect(() => {
    setPosition((previous) => previous.key === key ? previous : { ...previous, key, page: 1 });
  }, [key]);

  useEffect(() => {
    if (!scope) return;
    let active = true;
    setLoading(true);
    Promise.resolve().then(() => loadPage(currentPage, pageSize)).then((response) => {
      if (!active) return;
      if (!response.success) throw new Error("Page request failed");
      const total = response.total ?? 0;
      const lastPage = Math.max(1, Math.ceil(total / pageSize));
      if (currentPage > lastPage) {
        setCurrentPage(lastPage);
        return;
      }
      setResult({ key: requestKey, elements: response.data ?? [], total, error: false });
    }).catch(() => {
      if (active) setResult({ key: requestKey, elements: [], total: 0, error: true });
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [scope, requestKey, currentPage, pageSize, loadPage, revision, setCurrentPage]);

  const isCurrent = Boolean(scope) && result.key === requestKey;
  return {
    elements: isCurrent ? result.elements : emptyElements,
    total: isCurrent ? result.total : 0,
    loading: Boolean(scope) && (loading || !isCurrent),
    error: isCurrent && result.error,
    currentPage, pageSize, setCurrentPage, setPageSize, retry,
  };
}
