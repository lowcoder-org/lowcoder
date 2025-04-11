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

): Promise<ManagedOrg[]> {
  if (!environmentId) {
    throw new Error("Missing environmentId");
  }

  try {
    const res = await axios.get(`/api/plugins/enterprise/org/list`);
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
  orgName: string,
  org_gid: string, // ✅ not optional
  orgTags: string[] = [],
) {
  if (!environmentId || !orgName || !org_gid) {
    throw new Error("Missing required params to connect org");
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
export async function unconnectManagedWorkspace(orgGid: string) {
  if (!orgGid) {
    throw new Error("Missing orgGid to unconnect workspace");
  }

  try {
    await axios.delete(`/api/plugins/enterprise/org`, {
      params: { orgGid }, // ✅ pass as query param
    });
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "Failed to unconnect org";
    message.error(errorMsg);
    throw err;
  }
}
