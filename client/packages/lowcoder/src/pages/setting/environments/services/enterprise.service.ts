import axios from "axios";
import { message } from "antd";
import { ManagedOrg } from "../types/enterprise.types";

/**
 * Fetch workspaces for a specific environment
 * @param apiServiceUrl - API service URL for the environment
 * @param environmentId - ID of the environment
 * 
 * 
 */

export async function getManagedWorkspaces(
  environmentId: string,
  apiServiceUrl: string
): Promise<ManagedOrg[]> {
  if (!environmentId || !apiServiceUrl) {
    throw new Error("Missing environmentId or apiServiceUrl");
  }

  try {
    const res = await axios.get(`${apiServiceUrl}/api/plugins/enterprise/org`);
    const all: ManagedOrg[] = res.data;
    return all.filter(org => org.environmentId === environmentId);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to fetch managed workspaces";
    message.error(errorMsg);
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
  apiServiceUrl: string,
  orgName: string,
  orgTags: string[] = []
) {
  if (!environmentId || !apiServiceUrl || !orgName) {
    throw new Error("Missing required params to connect org");
  }

  try {
    const payload = {
      environment_id: environmentId,
      org_name: orgName,
      org_tags: orgTags,
    };

    const res = await axios.post(`${apiServiceUrl}/api/plugins/enterprise/org`, payload);
    return res.data;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to connect org";
    message.error(errorMsg);
    throw err;
  }
}






/**
 * Fetch workspaces for a specific environment
 * @param apiServiceUrl - API service URL for the environment
 * @param orgId - ID of the workspace
 * 
 */
export async function unconnectManagedWorkspace(
  apiServiceUrl: string,
  orgId: string
) {
  if (!apiServiceUrl || !orgId) {
    throw new Error("Missing apiServiceUrl or orgId");
  }

  try {
    await axios.delete(`${apiServiceUrl}/api/plugins/enterprise/org/${orgId}`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to unconnect org";
    message.error(errorMsg);
    throw err;
  }
}
