import axios from "axios";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { trans } from "i18n";
import { ManagedOrg } from "../types/enterprise.types";
import { Query } from "../types/query.types";


/**
 * Fetch workspaces for a specific environment
 * @param apiServiceUrl - API service URL for the environment
 * @param environmentId - ID of the environment
 * 
 * 
 */

export async function getManagedWorkspaces(
  environmentId: string,

): Promise<ManagedOrg[]> {
  if (!environmentId) {
    throw new Error(trans("environments.services_enterprise_missingEnvironmentId"));
  }

  try {
    const res = await axios.get(`/api/plugins/enterprise/org/list`);
    const all: ManagedOrg[] = res.data.data;
    return all.filter(org => org.environmentId === environmentId);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : trans("environments.services_enterprise_failedToFetchManagedWorkspaces");
    messageInstance.error(errorMsg);
    throw err;
  }
}


/**
 * Fetch workspaces for a specific environment
 * @param apiServiceUrl - API service URL for the environment
 * @param environmentId - ID of the environment
 * @param orgName - Name of the workspace
 * @param orgTags - Tags of the workspace
 * 
 */

export async function connectManagedWorkspace(
  environmentId: string,
  orgName: string,
  org_gid: string, // ✅ not optional
  orgTags: string[] = [],
) {
  if (!environmentId || !orgName || !org_gid) {
    throw new Error(trans("environments.services_enterprise_missingRequiredParamsToConnectOrg"));
  }

  try {
    const payload = {
      environment_id: environmentId,
      org_name: orgName,
      org_tags: orgTags,
      org_gid,
    };

    const res = await axios.post(`/api/plugins/enterprise/org`, payload);
    return res.data;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : trans("environments.services_enterprise_failedToConnectOrg");
    messageInstance.error(errorMsg);
    throw err;
  }
}



/**
 * Fetch workspaces for a specific environment
 * @param apiServiceUrl - API service URL for the environment
 * @param orgId - ID of the workspace
 * 
 */
export async function unconnectManagedWorkspace(orgGid: string) {
  if (!orgGid) {
    throw new Error(trans("environments.services_enterprise_missingOrgGidToUnconnectWorkspace"));
  }

  try {
    await axios.delete(`/api/plugins/enterprise/org`, {
      params: { orgGid }, // ✅ pass as query param
    });
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : trans("environments.services_enterprise_failedToUnconnectOrg");
    messageInstance.error(errorMsg);
    throw err;
  }
}




// FOR APPS

export async function getManagedApps(environmentId: string) {
  const res = await axios.get(`/api/plugins/enterprise/app/list`);
  const allApps = res.data.data;
  return allApps.filter((app: any) => app.environmentId === environmentId);
}

// Connect an app
export async function connectManagedApp(
  environmentId: string,
  app_name: string,
  app_gid: string,
  app_tags: string[] = []
) {
  try {
    const payload = {
      environment_id: environmentId,
      app_name,
      app_gid,
      app_tags,
    };

    const res = await axios.post(`/api/plugins/enterprise/app`, payload);
    return res.data;
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : trans("environments.services_enterprise_failedToConnectApp");
    messageInstance.error(errorMsg);
    throw err;
  }
}

// Unconnect an app
export async function unconnectManagedApp(appGid: string) {
  try {
    await axios.delete(`/api/plugins/enterprise/app`, {
      params: { appGid },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : trans("environments.services_enterprise_failedToUnconnectApp");
    messageInstance.error(errorMsg);
    throw err;
  }
}

// data sources

export const getManagedDataSources = async (environmentId: string): Promise<any[]> => {
  try {
    const response = await axios.get(
      `/api/plugins/enterprise/datasource/list?environmentId=${environmentId}`
    );
    return response.data.data || [];
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : trans("environments.services_enterprise_failedToFetchDataSources");
    messageInstance.error(errorMsg);
    throw error;
  }
};

// Connect a data source to be managed
export const connectManagedDataSource = async (
  environmentId: string,
  name: string,
  datasourceGid: string
): Promise<void> => {
  try {
    const payload = {
      environment_id: environmentId,
      name,
      datasource_gid: datasourceGid,
    };


    await axios.post(`/api/plugins/enterprise/datasource`, payload);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : trans("environments.services_enterprise_failedToDeployDataSource");
    messageInstance.error(errorMsg);
    throw error;
  }
};

// Disconnect a managed data source
export const unconnectManagedDataSource = async (
  datasourceGid: string
): Promise<void> => {
  try {
    await axios.delete(`/api/plugins/enterprise/datasource?datasourceGid=${datasourceGid}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : trans("environments.services_enterprise_failedToDisconnectManagedDataSource");
    messageInstance.error(errorMsg);
    throw error;
  }
};




export async function getManagedQueries(environmentId: string): Promise<Query[]> {
  try {
    if (!environmentId) {
      throw new Error(trans("environments.services_enterprise_environmentIdRequired"));
    }
    
    // Get managed queries from the enterprise endpoint
    const response = await axios.get(`/api/plugins/enterprise/qlQuery/list`, {
      params: {
        environmentId
      }
    });
    
    if (!response.data.data || !Array.isArray(response.data.data)) {
      return [];
    }
    
    // Map the response to match our Query interface
    // Note: You may need to adjust this mapping based on the actual response structure
    return response.data.data.map((item: any) => ({
      id: item.id || item.qlQueryId,
      gid: item.qlQueryGid,
      name: item.qlQueryName,
      organizationId: item.orgId,
      libraryQueryDSL: item.libraryQueryDSL || {},
      createTime: item.createTime,
      creatorName: item.creatorName || '',
      managed: true // These are managed queries
    }));
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : trans("environments.services_enterprise_failedToFetchQueries");
    messageInstance.error(errorMsg);
    throw error;
  }
}


export async function connectManagedQuery(
  environmentId: string, 
  queryName: string, 
  queryGid: string
): Promise<boolean> {
  try {
    if (!environmentId || !queryGid) {
      throw new Error(trans("environments.services_enterprise_environmentIdAndQueryGidRequired"));
    }
    
    const response = await axios.post('/api/plugins/enterprise/qlQuery', {
      environment_id: environmentId,
      ql_query_name: queryName,
      ql_query_tags: [],
      ql_query_gid: queryGid
    });
    
    return response.status === 200;
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : trans("environments.services_enterprise_failedToDeployQuery");
    messageInstance.error(errorMsg);
    throw error;
  }
}


export async function unconnectManagedQuery(queryGid: string): Promise<boolean> {
  try {
    if (!queryGid) {
      throw new Error(trans("environments.services_enterprise_queryGidRequired"));
    }
    
    const response = await axios.delete(`/api/plugins/enterprise/qlQuery`, {
      params: {
        qlQueryGid: queryGid
      }
    });
    
    return response.status === 200;
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : trans("environments.services_enterprise_failedToDisconnectQuery");
    messageInstance.error(errorMsg);
    throw error;
  }
}