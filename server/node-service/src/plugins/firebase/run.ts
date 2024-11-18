import { badRequest } from "../../common/error";
import { getApps, initializeApp, deleteApp, cert, App } from "firebase-admin/app";
import { getDatabase, Reference } from "firebase-admin/database";
import {
  CollectionReference,
  DocumentReference,
  getFirestore,
  WhereFilterOp,
  OrderByDirection,
} from "firebase-admin/firestore";
import { DataSourceDataType } from "./dataSourceConfig";
import { ActionDataType } from "./queryConfig";

function applyFieldFilter(
  query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>,
  fieldPath: string,
  operator: string,
  value: any
): FirebaseFirestore.Query<FirebaseFirestore.DocumentData> {
  let firestoreOp: FirebaseFirestore.WhereFilterOp;
  switch (operator) {
    case "EQUAL": firestoreOp = "=="; break;
    case "GREATER_THAN": firestoreOp = ">"; break;
    case "LESS_THAN": firestoreOp = "<"; break;
    case "GREATER_THAN_OR_EQUAL": firestoreOp = ">="; break;
    case "LESS_THAN_OR_EQUAL": firestoreOp = "<="; break;
    case "ARRAY_CONTAINS": firestoreOp = "array-contains"; break; 
    case "ARRAY_CONTAINS_ANY": firestoreOp = "array-contains-any"; break;
    default:
      throw badRequest(`Unsupported operator: ${operator}`);
  }

  const actualValue = value.integerValue ?? value.stringValue ?? value.booleanValue ?? value.doubleValue;
  if (actualValue === undefined) {
    throw badRequest("Unsupported value type in structuredQuery");
  }

  return query.where(fieldPath, firestoreOp, actualValue);
}

// Helper function to apply a unary filter
function applyUnaryFilter(
  query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>,
  fieldPath: string,
  operator: string
): FirebaseFirestore.Query<FirebaseFirestore.DocumentData> {
  let firestoreOp: FirebaseFirestore.WhereFilterOp;
  switch (operator) {
    case "IS_NAN": firestoreOp = "=="; break;
    case "IS_NULL": firestoreOp = "=="; break;
    case "IS_NOT_NAN": firestoreOp = "!="; break;
    case "IS_NOT_NULL": firestoreOp = "!="; break;
    default:
      throw badRequest(`Unsupported unary operator: ${operator}`);
  }

  return query.where(fieldPath, firestoreOp, null);
}

// Helper function to extract cursor values
function extractCursorValues(values: any[]): any[] {
  return values.map((v: { integerValue?: any; stringValue?: any; booleanValue?: any; doubleValue?: any; }) =>
    v.integerValue ?? v.stringValue ?? v.booleanValue ?? v.doubleValue ?? v.booleanValue
  ).filter(value => value !== undefined);
}

const appCache: { [firestoreId: string]: any } = {}; // A cache for storing initialized apps by firestoreId

function getOrInitializeApp(serviceAccount: any, databaseUrl: string, firestoreId: string): App {
  const existingApp = getApps().find((app) => app.name === firestoreId);
  
  if (existingApp) {
    return existingApp; // Return the existing app
  }

  // Initialize a new app with the given name
  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL: databaseUrl,
    projectId: firestoreId,
  }, firestoreId);
}

export async function runFirebasePlugin(
  actionData: ActionDataType,
  dataSourceConfig: DataSourceDataType
) {
  const { actionName } = actionData;
  const { privateKey, databaseUrl, firestoreId } = dataSourceConfig;
  const serviceAccount = JSON.parse(privateKey);

  const app = getOrInitializeApp(serviceAccount, databaseUrl, firestoreId);

  const witDbRef = <T>(fn: (ref: Reference) => T): T => {
    if (!("databaseRef" in actionData)) {
      throw badRequest("not a realtime database action:" + actionName);
    }
    const ref = getDatabase(app).ref(actionData.databaseRef);
    return fn(ref);
  };

  const withFirestoreCollection = <T>(fn: (ref: CollectionReference) => T): T => {
    if (!("collection" in actionData)) {
      throw badRequest("not a firestore action with collection:" + actionName);
    }
    const ref = getFirestore(app).collection(actionData.collection);
    return fn(ref);
  };

  const withFirestoreDoc = <T>(fn: (ref: DocumentReference) => T): T => {
    if (!("collection" in actionData) || !("documentId" in actionData)) {
      throw badRequest("not a firestore action with collection and documentId:" + actionName);
    }
    const ref = getFirestore(app).collection(actionData.collection).doc(actionData.documentId);
    return fn(ref);
  };

  const successResult = { success: true };

  try {
    // firebase
    if (actionName === "RTDB.QueryDatabase") {
      const data = await witDbRef((ref) => ref.once("value"));
      return data.val();
    }

    if (actionName === "RTDB.SetData") {
      await witDbRef((ref) => ref.set(actionData.data));
      return successResult;
    }

    if (actionName === "RTDB.UpdateData") {
      await witDbRef((ref) => ref.update(actionData.data));
      return successResult;
    }

    if (actionName === "RTDB.AppendDataToList") {
      await witDbRef((ref) => ref.push(actionData.data));
      return successResult;
    }

    // firebase
    if (actionName === "FS.GetCollections") {
      let collections;
      if (actionData.parentDocumentId) {
        collections = await getFirestore(app).doc(actionData.parentDocumentId).listCollections();
      } else {
        collections = await getFirestore(app).listCollections();
      }
      return collections.map((i) => i.id);
    }

    if (actionName === "FS.ListFireStore") {
      const data = await withFirestoreCollection(async (ref) => {
    
        // Initialize query as a Query type, not CollectionReference
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = ref;
    
        // Sorting
        if (actionData.orderBy) {
          query = query.orderBy(
            actionData.orderBy,
            (actionData.orderDirection || "asc") as OrderByDirection
          );
        }
    
        // Get the total count using aggregate query
        const totalCount = await query.count().get().then((snapshot) => snapshot.data().count);
    
        // Pagination
        const pageSize = actionData.pageSize || 10;
        const pageNumber = actionData.pageNumber || 1;
        const offset = (pageNumber - 1) * pageSize;
    
        // Move to the starting point based on offset
        if (offset > 0) {
          const offsetSnapshot = await query.limit(offset).get();
          const lastVisible = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
    
          // If we have a valid last document, use it to start the next page
          if (lastVisible) {
            query = query.startAfter(lastVisible);
          }
        }
    
        // Apply page size limit
        query = query.limit(pageSize);
    
        // Execute the final query to get the page data
        const snapshot = await query.get();
        const documents = snapshot.empty ? [] : snapshot.docs.map((i) => i.data());
    
        // Return data object with totalCount and documents
        return { totalCount, documents };
      });
      return data;
    }

    if (actionName === "FS.QueryFireStore") {
      const data = await withFirestoreCollection(async (ref) => {
        const structuredQuery = actionData.query;
        if (!structuredQuery) {
          throw badRequest("Missing structuredQuery in action data");
        }
        
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = ref;
    
        // Apply `select` fields projection if provided
        if (structuredQuery.select && structuredQuery.select.fields) {
          const selectedFields = structuredQuery.select.fields.map((field: { fieldPath: string }) => field.fieldPath);
          query = query.select(...selectedFields);
        }
    
        // Apply `where` filters
        if (structuredQuery.where) {
          if (structuredQuery.where.compositeFilter) {
            // Composite Filter (AND, OR)
            const compositeFilter = structuredQuery.where.compositeFilter;
            const filters = compositeFilter.filters;
            const operator = compositeFilter.op;
    
            if (operator !== "AND") {
              throw badRequest("Only 'AND' composite filters are currently supported.");
            }
    
            filters.forEach((filter: any) => {
              if (filter.fieldFilter) {
                const fieldFilter = filter.fieldFilter;
                const fieldPath = fieldFilter.field.fieldPath;
                const operator = fieldFilter.op;
                const value = fieldFilter.value;
                query = applyFieldFilter(query, fieldPath, operator, value);
              } else if (filter.unaryFilter) {
                const unaryFilter = filter.unaryFilter;
                const fieldPath = unaryFilter.field.fieldPath;
                const operator = unaryFilter.op;
                query = applyUnaryFilter(query, fieldPath, operator);
              }
            });
          } else if (structuredQuery.where.fieldFilter) {
            // Single Field Filter
            const fieldFilter = structuredQuery.where.fieldFilter;
            const fieldPath = fieldFilter.field.fieldPath;
            const operator = fieldFilter.op;
            const value = fieldFilter.value;
            query = applyFieldFilter(query, fieldPath, operator, value);
          }
        }

        // Get the total count using aggregate query before applying pagination
        const totalCount = await query.count().get().then((snapshot) => snapshot.data().count);
    
        // Apply `orderBy`
        if (structuredQuery.orderBy && Array.isArray(structuredQuery.orderBy)) {
          structuredQuery.orderBy.forEach((order: { field: { fieldPath: string | FirebaseFirestore.FieldPath; }; direction: any; }) => {
            if (order.field && order.field.fieldPath) {
              query = query.orderBy(
                order.field.fieldPath,
                (order.direction || "asc").toLowerCase() as FirebaseFirestore.OrderByDirection
              );
            }
          });
        }
    
        // Apply `limit`
        if (structuredQuery.limit) {
          query = query.limit(structuredQuery.limit);
        }
    
        // Apply `offset` (simulate it using startAfter since Firestore SDK doesn't support offset directly)
        if (structuredQuery.offset) {
          const offsetSnapshot = await query.limit(structuredQuery.offset).get();
          const lastVisible = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
          if (lastVisible) {
            query = query.startAfter(lastVisible);
          }
        }
    
        // Apply `startAt` and `endAt` cursors
        if (structuredQuery.startAt && structuredQuery.startAt.values) {
          const startAtValues = extractCursorValues(structuredQuery.startAt.values);
          if (startAtValues.length > 0) {
            query = query.startAt(...startAtValues);
          }
        }
        if (structuredQuery.endAt && structuredQuery.endAt.values) {
          const endAtValues = extractCursorValues(structuredQuery.endAt.values);
          if (endAtValues.length > 0) {
            query = query.endAt(...endAtValues);
          }
        }
    
        // Execute the query
        const snapshot = await query.get();
        if (snapshot.empty) {
          return [];
        }
        const documents = snapshot.empty ? [] : snapshot.docs.map((doc) => doc.data());
        return { totalCount, documents };
      });
      return data;
    }
    

    if (actionName === "FS.GetDocument") {
      return await withFirestoreDoc(async (ref) => (await ref.get()).data());
    }

    if (actionName === "FS.InsertDocument") {
      return await withFirestoreCollection(async (ref) => {
        if (actionData.documentId) {
          await ref.doc(actionData.documentId).set(actionData.data);
        } else {
          await ref.add(actionData.data);
        }
        return successResult;
      });
    }

    if (actionName === "FS.UpdateDocument") {
      return await withFirestoreDoc(async (ref) => {
        await ref.update(actionData.data);
        return successResult;
      });
    }

    if (actionName === "FS.DeleteDocument") {
      return await withFirestoreDoc(async (ref) => {
        await ref.delete();
        return successResult;
      });
    }
  } catch (error) {
    console.error(`Error in action ${actionData.actionName}:`, error);
    throw error;
  }
}
