import axios from "axios";
import { message } from "antd";

// Object types that can be managed
export enum ManagedObjectType {
  ORG = "ORG",
  APP = "APP",
  QUERY = "QUERY",
  DATASOURCE = "DATASOURCE"
}

/**
 * Check if an object is managed
 * @param objGid - Object's global ID
 * @param environmentId - Environment ID
 * @param objType - Object type (ORG, APP, QUERY, DATASOURCE)
 * @returns Promise with boolean indicating if object is managed
 */
export async function isManagedObject(
  objGid: string,
  environmentId: string,
  objType: ManagedObjectType
): Promise<boolean> {
  try {
    if (!objGid || !environmentId || !objType) {
      throw new Error("Missing required parameters");
    }

    const response = await axios.get(`/api/plugins/enterprise/managed-obj`, {
      params: {
        objGid,
        environmentId,
        objType
      }
    });

    return response.data.managed === true;
  } catch (error) {
    // If the object doesn't exist as managed, it's not an error
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return false;
    }
    
    const errorMessage = error instanceof Error ? error.message : "Failed to check managed status";
    message.error(errorMessage);
    throw error;
  }
}

/**
 * Set an object as managed
 * @param objGid - Object's global ID
 * @param environmentId - Environment ID
 * @param objType - Object type (ORG, APP, QUERY, DATASOURCE)
 * @param objName - Object name (optional)
 * @param objTags - Object tags (optional)
 * @returns Promise with operation result
 */
export async function setManagedObject(
  objGid: string,
  environmentId: string,
  objType: ManagedObjectType
): Promise<boolean> {
  try {
    if (!objGid || !environmentId || !objType) {
      throw new Error("Missing required parameters");
    }

    const requestBody = {
      objGid,
      environmentId,
      objType
    };

    const response = await axios.post(`/api/plugins/enterprise/managed-obj`, requestBody);

    return response.status === 200;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : `Failed to set ${objType} as managed`;
    message.error(errorMessage);
    throw error;
  }
}


/**
 * Set an object as unmanaged
 * @param objGid - Object's global ID
 * @param environmentId - Environment ID
 * @param objType - Object type (ORG, APP, QUERY, DATASOURCE)
 * @returns Promise with operation result
 */
export async function unsetManagedObject(
  objGid: string,
  environmentId: string,
  objType: ManagedObjectType
): Promise<boolean> {
  try {
    if (!objGid || !environmentId || !objType) {
      throw new Error("Missing required parameters");
    }

    const response = await axios.delete(`/api/plugins/enterprise/managed-obj`, {
      params: {
        objGid,
        environmentId,
        objType
      }
    });

    return response.status === 200;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : `Failed to remove ${objType} from managed`;
    message.error(errorMessage);
    throw error;
  }
}

/**
 * Get all managed objects of a specific type for an environment
 * NOTE: This function is commented out as the endpoint is not yet implemented
 * TODO: Uncomment when the /managed-obj/list endpoint is available
 * 
 * @param environmentId - Environment ID 
 * @param objType - Object type (ORG, APP, QUERY, DATASOURCE)
 * @returns Promise with an array of managed objects
 */
/*
export async function getManagedObjects(
  environmentId: string,
  objType: ManagedObjectType
): Promise<any[]> {
  try {
    if (!environmentId || !objType) {
      throw new Error("Missing required parameters");
    }

    const response = await axios.get(`/api/plugins/enterprise/managed-obj/list`, {
      params: {
        environmentId,
        objType
      }
    });

    return response.data.data || [];
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : `Failed to fetch managed ${objType.toLowerCase()}s`;
    message.error(errorMessage);
    throw error;
  }
}
*/ 