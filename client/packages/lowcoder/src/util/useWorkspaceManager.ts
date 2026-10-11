import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { Org } from 'constants/orgConstants';
import UserApi from 'api/userApi';

interface UseWorkspaceManagerOptions {
  pageSize?: number;
}

export function useWorkspaceManager({ 
  pageSize = 10 
}: UseWorkspaceManagerOptions) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [workspaces, setWorkspaces] = useState<Org[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWorkspaces = useCallback(
    async (page: number, search?: string) => {
      setIsLoading(true);
      try {
        const response = await UserApi.getMyOrgs(page, pageSize, search);
        if (response.data.success) {
          const apiData = response.data.data;
          const items = apiData.data
            .filter(item => item.orgView && item.orgView.orgId)
            .map(item => ({
              id: item.orgView.orgId,
              name: item.orgView.orgName,
              createdAt: item.orgView.createdAt,
              updatedAt: item.orgView.updatedAt,
              isCurrentOrg: item.isCurrentOrg,
            })) as Org[];

          setWorkspaces(items);
          setTotalCount(apiData.total);
        }
      } catch (error) {
        console.error('Error fetching workspaces:', error);
        setWorkspaces([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize]
  );

  // Initial fetch
  useEffect(() => {
    fetchWorkspaces(1);
  }, [fetchWorkspaces]);

  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      fetchWorkspaces(1, term || undefined);
    }, 500),
    [fetchWorkspaces]
  );

  useEffect(() => {
    return () => { debouncedSearch.cancel(); };
  }, [debouncedSearch]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    debouncedSearch(value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchWorkspaces(page, searchTerm.trim() || undefined);
  };

  const refetch = useCallback(
    () => fetchWorkspaces(currentPage, searchTerm.trim() || undefined),
    [fetchWorkspaces, currentPage, searchTerm]
  );

  return {
    searchTerm,
    currentPage,
    isLoading,
    displayWorkspaces: workspaces,
    totalCount,
    handleSearchChange,
    handlePageChange,
    pageSize,
    refetch,
  };
}
