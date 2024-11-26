import { FolderApi } from "@lowcoder-ee/api/folderApi";
import { FetchFolderElementsPaginationPayload } from "@lowcoder-ee/redux/reduxActions/folderActions";

export const fetchFolderElements = async (request: FetchFolderElementsPaginationPayload) => {
    try {
        const response = await FolderApi.fetchFolderElementsPagination(request);
        return {
            success: true,
            data: response.data.data,
            total:response.data.total
        };
    } catch (error) {
        console.error('Failed to fetch data:', error);
        return {
            success: false,
            error: error
        };
    }
}
