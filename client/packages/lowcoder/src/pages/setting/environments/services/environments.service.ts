import axios from "axios";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { Environment } from "../types/environment.types";
import { Workspace } from "../types/workspace.types";
import { UserGroup } from "../types/userGroup.types";
import {App} from "../types/app.types";
import { DataSourceWithMeta } from '../types/datasource.types';
import { Query, QueryResponse } from "../types/query.types";
import { checkEnvironmentLicense } from './license.service';
import { trans } from "i18n";

export async function updateEnvironment(
  environmentId: string, 
  environmentData: Partial<Environment>
): Promise<Environment> {
  if (!environmentId) {
    throw new Error("Missing environmentId");
  }

  try {
    // Convert frontend model to API model
    const payload = {
      environment_description: environmentData.environmentDescription || "",
      environment_icon: environmentData.environmentIcon || "",
      environment_name: environmentData.environmentName || "",
      environment_apikey: environmentData.environmentApikey || "",
      environment_type: environmentData.environmentType || "",
      environment_api_service_url: environmentData.environmentApiServiceUrl || "",
      environment_frontend_url: environmentData.environmentFrontendUrl || "",
      environment_node_service_url: environmentData.environmentNodeServiceUrl || "",
      isMaster: environmentData.isMaster || false
    };

    const res = await axios.put(`/api/plugins/enterprise/environments`, payload, {
      params: { environmentId }
    });
    
    return res.data;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to update environment";
    messageInstance.error(errorMsg);
    throw err;
  }
}

/**
 * Create a new environment manually
 * @param environmentData - Environment data to create
 * @returns Promise with created environment data
 */
export async function createEnvironment(
  environmentData: Partial<Environment>
): Promise<Environment> {
  try {
    // Convert frontend model to API model
    const payload = {
      environment_description: environmentData.environmentDescription || "",
      environment_icon: environmentData.environmentIcon || "",
      environment_name: environmentData.environmentName || "",
      environment_apikey: environmentData.environmentApikey || "",
      environment_type: environmentData.environmentType || "",
      environment_api_service_url: environmentData.environmentApiServiceUrl || "",
      environment_frontend_url: environmentData.environmentFrontendUrl || "",
      environment_node_service_url: environmentData.environmentNodeServiceUrl || "",
      isMaster: environmentData.isMaster || false
    };

    const res = await axios.post(`/api/plugins/enterprise/environments`, payload);
    
    if (res.data) {
      messageInstance.success("Environment created successfully");
      return res.data;
    } else {
      throw new Error("Failed to create environment");
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to create environment";
    messageInstance.error(errorMsg);
    throw err;
  }
}

/**
 * Fetch all environments
 * @returns Promise with environments data
 */
export async function getEnvironments(): Promise<Environment[]> {
  try {
    // The response contains the data array directly in response.data
    const response = await axios.get(
      "/api/plugins/enterprise/environments/list"
    );

    // Return the data array directly from response.data
    return response.data.data || [];
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch environments";
    messageInstance.error(errorMessage);
    throw error;
  }
}

/**
 * Fetch a single environment by ID
 * @param id Environment ID
 * @returns Promise with environment data
 */
export async function getEnvironmentById(id: string): Promise<Environment> {
  try {
    const response = await axios.get(
      `/api/plugins/enterprise/environments?environmentId=${id}`
    );

    if (!response.data) {
      throw new Error("Failed to fetch environment");
    }

    const environment = response.data.data;

    // Check license status for the environment
    const envWithLicense: Environment = {
      ...environment,
      licenseStatus: 'checking'
    };

    try {
      if (environment.environmentApiServiceUrl) {
        const licenseInfo = await checkEnvironmentLicense(
          environment.environmentApiServiceUrl,
          environment.environmentApikey
        );
        
        envWithLicense.isLicensed = licenseInfo.isValid;
        envWithLicense.licenseStatus = licenseInfo.isValid ? 'licensed' : 'unlicensed';
        envWithLicense.licenseError = licenseInfo.error;
        envWithLicense.licenseDetails = licenseInfo.details;
      } else {
        envWithLicense.isLicensed = false;
        envWithLicense.licenseStatus = 'error';
        envWithLicense.licenseError = 'API service URL not configured';
      }
    } catch (error) {
      envWithLicense.isLicensed = false;
      envWithLicense.licenseStatus = 'error';
      envWithLicense.licenseError = error instanceof Error ? error.message : 'License check failed';
    }

    return envWithLicense;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch environment";
    messageInstance.error(errorMessage);
    throw error;
  }
}

/* ================================================================================

=============================== ENVIRONMENT WORKSPACES ============================
*/

/**
 * Fetch workspaces for a specific environment
 * @param environmentId - ID of the environment
 * @param apiKey - API key for the environment
 * @param apiServiceUrl - API service URL for the environment
 * @returns Promise with an array of workspaces
 */
export async function getEnvironmentWorkspaces(
  environmentId: string,
  apiKey: string, 
  apiServiceUrl: string
): Promise<Workspace[]> {
  try {
    // Check if required parameters are provided
    if (!environmentId) {
      throw new Error("Environment ID is required");
    }

    if (!apiKey) {
      throw new Error("API key is required to fetch workspaces");
    }
    if (!apiServiceUrl) {
      throw new Error('API service URL is required to fetch workspaces');
    }

    // Set up headers with the API key
    const headers = {
      Authorization: `Bearer ${apiKey}`
    };

    // Make the API request to get user data which includes workspaces
    const response = await axios.get(`${apiServiceUrl}/api/users/me`, { headers });

    // Check if response is valid
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || "Failed to fetch workspaces");
    }

    // Extract workspaces from the response
    const userData = response.data.data;

    if (!userData.orgAndRoles || !Array.isArray(userData.orgAndRoles)) {
      return [];
    }

    // Transform the data to match our Workspace interface
    const workspaces: Workspace[] = userData.orgAndRoles.map((item:any) => ({
      id: item.org.id,
      name: item.org.name,
      role: item.role,
      creationDate: item.org.createTime,
      status: item.org.state,
      gid: item.org.gid,
      createdBy: item.org.createdBy,
      isAutoGeneratedOrganization: item.org.isAutoGeneratedOrganization,
      logoUrl: item.org.logoUrl || "",
    }));

    return workspaces;
  } catch (error) {
    // Handle and transform error
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch workspaces";
    messageInstance.error(errorMessage);
    throw error;
  }
}



/* ================================================================================

=============================== ENVIRONMENT USER GROUPS ============================ */

export async function getEnvironmentUserGroups(
  environmentId: string, 
  apiKey: string,
  apiServiceUrl: string
): Promise<UserGroup[]> {
  try {
    // Check if required parameters are provided
    if (!environmentId) {
      throw new Error('Environment ID is required');
    }
    
    if (!apiKey) {
      throw new Error('API key is required to fetch user groups');
    }
    
    if (!apiServiceUrl) {
      throw new Error('API service URL is required to fetch user groups');
    }
    
    // Set up headers with the Bearer token format
    const headers = {
      Authorization: `Bearer ${apiKey}`
    };
    
    // Make the API request to get user groups
    const response = await axios.get(`${apiServiceUrl}/api/groups/list`, { headers });
    
    // Check if response is valid
    if (!response.data) {
      throw new Error('Failed to fetch user groups');
    }
    
    // The response data is already an array of user groups
    const userGroups: UserGroup[] = response.data.data || [];
    
    return userGroups;
  } catch (error) {
    // Handle and transform error
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user groups';
    messageInstance.error(errorMessage);
    throw error;
  }
}




/* ================================================================================

=============================== WorkSpace Details ============================ */


/**
 * Get a specific workspace by ID from the list of workspaces
 * @param workspaces - Array of workspaces
 * @param workspaceId - ID of the workspace to find
 * @returns The found workspace or null if not found
 */
export function getWorkspaceById(workspaces: Workspace[], workspaceId: string): Workspace | null {
  if (!workspaces || !workspaceId) {
    return null;
  }
  
  return workspaces.find(workspace => workspace.id === workspaceId) || null;
}

/**
 * Fetch a specific workspace from an environment
 * @param environmentId - ID of the environment
 * @param workspaceId - ID of the workspace to fetch
 * @param apiKey - API key for the environment
 * @param apiServiceUrl - API service URL for the environment
 * @returns Promise with the workspace or null if not found
 */
export async function fetchWorkspaceById(
  environmentId: string,
  workspaceId: string,
  apiKey: string,
  apiServiceUrl: string
): Promise<Workspace | null> {
  try {
    // First fetch all workspaces for the environment
    const workspaces = await getEnvironmentWorkspaces(environmentId, apiKey, apiServiceUrl);
    
    // Then find the specific workspace by ID
    return getWorkspaceById(workspaces, workspaceId);
  } catch (error) {
    throw error;
  }
}

/* ================================================================================

=============================== WorkSpace Apps ============================ */



export async function getWorkspaceApps(
  workspaceId: string, 
  apiKey: string,
  apiServiceUrl: string
): Promise<App[]> {
  try {
    // Check if required parameters are provided
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }
    
    if (!apiKey) {
      throw new Error('API key is required to fetch apps');
    }
    
    if (!apiServiceUrl) {
      throw new Error('API service URL is required to fetch apps');
    }
    
    // Set up headers with the Bearer token format
    const headers = {
      Authorization: `Bearer ${apiKey}`
    };
    
    // First, switch to the target workspace
    await axios.put(`${apiServiceUrl}/api/organizations/switchOrganization/${workspaceId}`, {}, { 
      headers 
    });
    
    // Then fetch applications without the orgId parameter
    const response = await axios.get(`${apiServiceUrl}/api/applications/list`, { 
      headers,
      params: {
        withContainerSize: false
      }
    });
    
    // Check if response is valid
    if (!response.data || !response.data.data) {
      return [];
    }
    
    // Filter out DELETED apps
    const apps = response.data.data.filter((app: any) => 
      app.applicationStatus !== 'DELETED'
    );
    
    return apps;
  
  } catch (error) {
    // Handle and transform error
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch workspace apps';
    messageInstance.error(errorMessage);
    throw error;
  }
}


/* ================================================================================

=============================== WorkSpace Data Source ============================  */

/**
 * Fetch data sources for a specific workspace
 * @param workspaceId - ID of the workspace (orgId)
 * @param apiKey - API key for the environment
 * @param apiServiceUrl - API service URL for the environment
 * @returns Promise with an array of data sources
 */
export async function getWorkspaceDataSources(
  workspaceId: string, 
  apiKey: string,
  apiServiceUrl: string
): Promise<DataSourceWithMeta[]> {
  try {
    // Check if required parameters are provided
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }
    
    if (!apiKey) {
      throw new Error('API key is required to fetch data sources');
    }
    
    if (!apiServiceUrl) {
      throw new Error('API service URL is required to fetch data sources');
    }
    
    // Set up headers with the Bearer token format
    const headers = {
      Authorization: `Bearer ${apiKey}`
    };
    
    // Make the API request to get data sources
    const response = await axios.get<{data:DataSourceWithMeta[]}>(`${apiServiceUrl}/api/datasources/listByOrg`, { 
      headers,
      params: {
        orgId: workspaceId
      }
    });
    
    // Check if response is valid
    if (!response.data) {
      return [];
    }
    
    return response.data.data ;
  } catch (error) {
    // Handle and transform error
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch workspace data sources';
    messageInstance.error(errorMessage);
    throw error;
  }
}



/**
 * Fetch queries for a specific workspace
 * @param workspaceId - ID of the workspace (orgId)
 * @param apiKey - API key for the environment
 * @param apiServiceUrl - API service URL for the environment
 * @param options - Additional options (name filter, pagination)
 * @returns Promise with an array of queries and metadata
 */
export async function getWorkspaceQueries(
  workspaceId: string, 
  apiKey: string,
  apiServiceUrl: string,
  options: {
    name?: string;
    pageNum?: number;
    pageSize?: number;
  } = {}
): Promise<{ queries: Query[], total: number }> {
  try {
    // Check if required parameters are provided
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }
    
    if (!apiKey) {
      throw new Error('API key is required to fetch queries');
    }
    
    if (!apiServiceUrl) {
      throw new Error('API service URL is required to fetch queries');
    }
    
    // Set up headers with the Bearer token format
    const headers = {
      Authorization: `Bearer ${apiKey}`
    };
    
    // Prepare query parameters
    const params: any = {
      orgId: workspaceId
    };
    
    // Add optional parameters if provided
    if (options.name) params.name = options.name;
    if (options.pageNum !== undefined) params.pageNum = options.pageNum;
    if (options.pageSize !== undefined) params.pageSize = options.pageSize;
    
    // Make the API request to get queries
    const response = await axios.get<QueryResponse>(`${apiServiceUrl}/api/library-queries/listByOrg`, { 
      headers,
      params
    });
    
    // Check if response is valid
    if (!response.data) {
      return { queries: [], total: 0 };
    }
    
    // Map the response to include id field required by DeployableItem
    const queries = response.data.data.map(query => ({
      ...query,
      // Map to DeployableItem fields if not already present
      id: query.id,
      name: query.name,
      managed: false // Default to unmanaged
    }));

    return { 
      queries, 
      total: response.data.total 
    };
  
  } catch (error) {
    // Handle and transform error
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch workspace queries';
    messageInstance.error(errorMessage);
    throw error;
  }
}

/**
 * Fetch all environments and check their license status
 * @returns Promise with environments data including license status
 */
export async function getEnvironmentsWithLicenseStatus(): Promise<Environment[]> {
  try {
    // First fetch all environments
    const environments = await getEnvironments();
    
    // Check license status for each environment in parallel
    const environmentsWithLicense = await Promise.all(
      environments.map(async (env) => {
        const envWithLicense: Environment = {
          ...env,
          licenseStatus: 'checking'
        };

        try {
          if (env.environmentApiServiceUrl) {
            const licenseInfo = await checkEnvironmentLicense(
              env.environmentApiServiceUrl,
              env.environmentApikey
            );
            
            envWithLicense.isLicensed = licenseInfo.isValid;
            envWithLicense.licenseStatus = licenseInfo.isValid ? 'licensed' : 'unlicensed';
            envWithLicense.licenseError = licenseInfo.error;
            envWithLicense.licenseDetails = licenseInfo.details;
          } else {
            envWithLicense.isLicensed = false;
            envWithLicense.licenseStatus = 'error';
            envWithLicense.licenseError = 'API service URL not configured';
          }
        } catch (error) {
          envWithLicense.isLicensed = false;
          envWithLicense.licenseStatus = 'error';
          envWithLicense.licenseError = error instanceof Error ? error.message : 'License check failed';
        }

        return envWithLicense;
      })
    );

    return environmentsWithLicense;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch environments";
    messageInstance.error(errorMessage);
    throw error;
  }
}

/**
 * Fetch deployment ID from a specific environment
 * @param apiServiceUrl - API service URL for the environment
 * @param apiKey - API key for the environment
 * @returns Promise with deployment ID string
 */
export async function getEnvironmentDeploymentId(
  apiServiceUrl: string,
  apiKey: string
): Promise<string> {
  try {
    // Check if required parameters are provided
    if (!apiServiceUrl) {
      throw new Error('API service URL is required');
    }
    
    if (!apiKey) {
      throw new Error('API key is required to fetch deployment ID');
    }
    
    // Set up headers with the Bearer token format
    const headers = {
      Authorization: `Bearer ${apiKey}`
    };
    
    // Make the API request to get deployment ID
    const response = await axios.get(`${apiServiceUrl}/api/configs/deploymentId`, { headers });
    
    // Check if response is valid
    if (!response.data) {
      throw new Error('Failed to fetch deployment ID');
    }
    
    // The response should return a string directly
    return response.data;
  } catch (error) {
    // Handle and transform error
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch deployment ID';
    messageInstance.error(errorMessage);
    throw error;
  }
}