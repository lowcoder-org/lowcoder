import { useReducer, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { debounce } from 'lodash';
import { Org } from 'constants/orgConstants';
import { getWorkspaces } from 'redux/selectors/orgSelectors';
import UserApi from 'api/userApi';

// State interface for the workspace manager
interface WorkspaceState {
  searchTerm: string;
  currentPage: number;
  currentPageWorkspaces: Org[];
  totalCount: number;
  isLoading: boolean;
}

// Action types for the reducer
type WorkspaceAction =
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_WORKSPACES'; payload: { workspaces: Org[]; total: number } }
  | { type: 'RESET'; payload: { totalCount: number } };

// Initial state
const initialState: WorkspaceState = {
  searchTerm: '',
  currentPage: 1,
  currentPageWorkspaces: [],
  totalCount: 0,
  isLoading: false,
};

// Reducer function - handles state transitions
function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'SET_SEARCH_TERM':
      return { 
        ...state, 
        searchTerm: action.payload,
        currentPage: 1 // Reset to page 1 when searching
      };
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_WORKSPACES':
      return {
        ...state,
        currentPageWorkspaces: action.payload.workspaces,
        totalCount: action.payload.total,
        isLoading: false,
      };
    case 'RESET':
      return {
        ...initialState,
        totalCount: action.payload.totalCount,
      };
    default:
      return state;
  }
}

// Hook interface
interface UseWorkspaceManagerOptions {
  isDropdownOpen: boolean;
  pageSize?: number;
}

// Main hook
export function useWorkspaceManager({ 
  isDropdownOpen, 
  pageSize = 10 
}: UseWorkspaceManagerOptions) {
  // Get workspaces from Redux
  const workspaces = useSelector(getWorkspaces);
  
  // Initialize reducer with Redux total count
  const [state, dispatch] = useReducer(workspaceReducer, {
    ...initialState,
    totalCount: workspaces.totalCount,
  });

  // Reset state when dropdown closes
  useEffect(() => {
    if (!isDropdownOpen) {
      dispatch({ type: 'RESET', payload: { totalCount: workspaces.totalCount } });
    }
  }, [isDropdownOpen, workspaces.totalCount]);

  // API call to fetch workspaces
  const fetchWorkspacesPage = async (page: number, search?: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await UserApi.getMyOrgs(page, pageSize, search);
      if (response.data.success) {
        const apiData = response.data.data;
        const transformedItems = apiData.data.map(item => ({
          id: item.orgId,
          name: item.orgName,
        }));
        
        dispatch({
          type: 'SET_WORKSPACES',
          payload: {
            workspaces: transformedItems as Org[],
            total: apiData.total,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      dispatch({ type: 'SET_WORKSPACES', payload: { workspaces: [], total: 0 } });
    }
  };

  // Debounced search function
  const debouncedSearch = debounce(async (term: string) => {
    if (!term.trim()) {
      // Clear search - reset to Redux data
      dispatch({ 
        type: 'SET_WORKSPACES', 
        payload: { workspaces: [], total: workspaces.totalCount } 
      });
      return;
    }

    // Perform search
    await fetchWorkspacesPage(1, term);
  }, 300);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: value });
    debouncedSearch(value);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    dispatch({ type: 'SET_PAGE', payload: page });
    
    if (page === 1 && !state.searchTerm.trim()) {
      // Page 1 + no search = use Redux data
      dispatch({ 
        type: 'SET_WORKSPACES', 
        payload: { workspaces: [], total: workspaces.totalCount } 
      });
    } else {
      // Other pages or search = fetch from API
      fetchWorkspacesPage(page, state.searchTerm.trim() || undefined);
    }
  };

  // Determine which workspaces to display
  const displayWorkspaces = (() => {
    if (state.searchTerm.trim() || state.currentPage > 1) {
      return state.currentPageWorkspaces; // API results
    }
    return workspaces.items; // Redux data for page 1
  })();

  // Determine current total count
  const currentTotalCount = state.searchTerm.trim() 
    ? state.totalCount 
    : workspaces.totalCount;

  return {
    // State
    searchTerm: state.searchTerm,
    currentPage: state.currentPage,
    isLoading: state.isLoading,
    displayWorkspaces,
    totalCount: currentTotalCount,
    
    // Actions
    handleSearchChange,
    handlePageChange,
    
    // Config
    pageSize,
  };
}