import axios from "axios";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { trans } from "i18n";

// Object types that can be managed
export enum ManagedObjectType {
  ORG = "ORG",
  APP = "APP",
  QUERY = "QUERY",
  DATASOURCE = "DATASOURCE"
}

// Add this interface after the ManagedObjectType enum
export interface ManagedObject {
  id: string;
  managedId: string;
  objGid: string;
  environmentId: string;
  objType: ManagedObjectType;
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
      throw new Error(trans("environments.services_managedObjects_missingRequiredParameters"));
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
    
    const errorMessage = error instanceof Error ? error.message : trans("environments.services_managedObjects_failedToCheckManagedStatus");
    messageInstance.error(errorMessage);
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
  objType: ManagedObjectType,
  managedId?: string
): Promise<boolean> {
  try {
    if (!objGid || !environmentId || !objType) {
      throw new Error(trans("environments.services_managedObjects_missingRequiredParameters"));
    }

    const requestBody = {
      objGid,
      environmentId,
      objType,
      ...(managedId && { managedId })
    };

    const response = await axios.post(`/api/plugins/enterprise/managed-obj`, requestBody);

    return response.status === 200;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : trans("environments.services_managedObjects_failedToSetAsManaged", { objType });
    messageInstance.error(errorMessage);
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
      throw new Error(trans("environments.services_managedObjects_missingRequiredParameters"));
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
    const errorMessage = error instanceof Error ? error.message : trans("environments.services_managedObjects_failedToRemoveFromManaged", { objType });
    messageInstance.error(errorMessage);
    throw error;
  }
}

// Add this new function
export async function getManagedObjects(
  environmentId: string,
  objType?: ManagedObjectType
): Promise<ManagedObject[]> {
  try {
    if (!environmentId) {
      throw new Error(trans("environments.services_managedObjects_missingEnvironmentId"));
    }

    const response = await axios.get(`/api/plugins/enterprise/managed-obj/list`, {
      params: {
        environmentId,
        ...(objType && { objType }) // Only include objType in params if it's provided
      }
    });

    return response.data.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : trans("environments.services_managedObjects_failedToFetchManagedObjects");
    messageInstance.error(errorMessage);
    throw error;
  }
}

/**
 * Get a single managed object by its parameters
 * @param objGid - Object's global ID
 * @param environmentId - Environment ID
 * @param objType - Object type (ORG, APP, QUERY, DATASOURCE)
 * @returns Promise with ManagedObject if found
 */
export async function getSingleManagedObject(
  objGid: string,
  environmentId: string,
  objType: ManagedObjectType
): Promise<ManagedObject | null> {
  try {
    if (!objGid || !environmentId || !objType) {
      throw new Error(trans("environments.services_managedObjects_missingRequiredParameters"));
    }

    const response = await axios.get(`/api/plugins/enterprise/managed-obj`, {
      params: {
        objGid,
        environmentId,
        objType
      }
    });

    return response.data.data || null;
  } catch (error) {
    // If the object doesn't exist as managed, return null instead of throwing
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    
    const errorMessage = error instanceof Error ? error.message : trans("environments.services_managedObjects_failedToFetchManagedObject");
    messageInstance.error(errorMessage);
    throw error;
  }
}


export async function transferManagedObject(objGid: string, sourceEnvId: string, targetEnvId: string, objType: ManagedObjectType): Promise<void> {
  try {
    const managedObject = await getSingleManagedObject(objGid, sourceEnvId, objType);
    if (managedObject) {
      await setManagedObject(managedObject.objGid, targetEnvId, objType, managedObject.managedId);
    } else {
      throw new Error(trans("environments.services_managedObjects_managedObjectNotFound", { objGid }));
    }
  } catch (error) {
    console.error('Error transferring managed object:', error);
    throw error;
  }
}

