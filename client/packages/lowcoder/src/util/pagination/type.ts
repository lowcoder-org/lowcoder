import {GroupUser} from "@lowcoder-ee/constants/orgConstants";

type ApplicationType = {
    [key: number]: string; // This allows numeric indexing
};

export interface GenericApiPaginationResponse<T> {
    total: number;
    success: boolean;
    code: number;
    message: string;
    data: T;
}
export interface GroupUsersPaginationResponse {
    total: number;
    success: boolean;
    data: {
        members: GroupUser[];
        visitorRole: string;
    };
}

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

export interface fetchDBRequestType {
    orgId: string;
    pageNum?: number;
    pageSize?: number;
    name?: string;
    type?: string;
}

export interface orgGroupRequestType{
    pageNum?: number;
    pageSize?: number;
}
export interface fetchOrgUserRequestType {
    groupId: string;
    pageNum?: number;
    pageSize?: number;
}
