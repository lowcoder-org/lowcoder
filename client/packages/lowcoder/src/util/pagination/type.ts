type ApplicationType = {
    [key: number]: string; // This allows numeric indexing
};

// Define the const with explicit type
export const ApplicationPaginationType: ApplicationType = {
    0: "",
    1: "APPLICATION",
    2: "MODULE",
    3: "NAVLAYOUT",
    4: "FOLDER",
    6: "MOBILETABLAYOUT",
    7: "NAVIGATION",
};

export interface fetchAppRequestType {
    pageNum?: number;
    pageSize?: number;
    name?: string;
    applicationType?: number;
}

export interface fetchFolderRequestType {
    pageNum?: number;
    pageSize?: number;
    name?: string;
    applicationType?: string;
}

export interface GenericApiPaginationResponse<T> {
    total: number;
    success: boolean;
    code: number;
    message: string;
    data: T;
}