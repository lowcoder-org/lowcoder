import {GroupUser, OrgUser} from "@lowcoder-ee/constants/orgConstants";

type ApplicationType = {
    [key: number]: string; // This allows numeric indexing
};

export const ApplicationPaginationType: ApplicationType = {
    0: "",
    1: "APPLICATION",
    2: "MODULE",
    3: "NAVLAYOUT",
    4: "FOLDER",
    6: "MOBILETABLAYOUT",
    7: "COMPOUND_APPLICATION",
};

export interface GenericApiPaginationResponse<T> {
    total: number;
    success: boolean;
    code: number;
    message: string;
    data: T;
}
export interface GroupUsersPaginationResponse {
    success: boolean;
    data: {
        members: GroupUser[];
        visitorRole: string;
        total: number;
    };
}

export interface OrgUsersPaginationResponse  {
    success: boolean;
    data: {
        total: number;
        members: OrgUser[];
        visitorRole: string;
    };
}

export type ApiPaginationResponse = {
    total: number;
    success: boolean;
    code: number;
    message: string;
    data: any;
};


export interface fetchAppRequestType {
    pageNum?: number;
    pageSize?: number;
    name?: string;
    applicationType?: number;
}

export interface fetchFolderRequestType {
    id?: string;
    pageNum?: number;
    pageSize?: number;
    name?: string;
    applicationType?: string;
    category?: string
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
    orgId: string;
    pageNum?: number;
    pageSize?: number;
}

export interface fetchGroupUserRequestType {
    groupId: string;
    pageNum?: number;
    pageSize?: number;
}

export interface fetchQueryLibraryPaginationRequestType {
    name?: string;
    pageNum?: number;
    pageSize?: number;
}

export interface fetchDataSourcePaginationRequestType {
    appId: string;
    name?: string;
    pageNum?: number;
    pageSize?: number;
}

export interface fetchOrgsByEmailRequestType {
    email: string;
    pageNum?: number;
    pageSize?: number;
}