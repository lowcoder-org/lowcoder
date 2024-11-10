import { badRequest } from "../../common/error";
import { initializeApp, deleteApp, cert } from "firebase-admin/app";
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

export async function runFirebasePlugin(
  actionData: ActionDataType,
  dataSourceConfig: DataSourceDataType
) {
  const { actionName } = actionData;
  const { privateKey, databaseUrl, firestoreId } = dataSourceConfig;
  const serviceAccount = JSON.parse(privateKey);

  const app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: databaseUrl,
    projectId: firestoreId,
  });

  const witDbRef = <T>(fn: (ref: Reference) => T): T => {
    if (!("databaseRef" in actionData)) {
      throw badRequest("not a realtime database action:" + actionName);
    }
    const ref = getDatabase().ref(actionData.databaseRef);
    return fn(ref);
  };

  const withFirestoreCollection = <T>(fn: (ref: CollectionReference) => T): T => {
    if (!("collection" in actionData)) {
      throw badRequest("not a firestore action with collection:" + actionName);
    }
    const ref = getFirestore().collection(actionData.collection);
    return fn(ref);
  };

  const withFirestoreDoc = <T>(fn: (ref: DocumentReference) => T): T => {
    if (!("collection" in actionData) || !("documentId" in actionData)) {
      throw badRequest("not a firestore action with collection and documentId:" + actionName);
    }
    const ref = getFirestore().collection(actionData.collection).doc(actionData.documentId);
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
        collections = await getFirestore().doc(actionData.parentDocumentId).listCollections();
      } else {
        collections = await getFirestore().listCollections();
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
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = ref;

        // Parse Query JSON from actionData.query
        if (actionData.query) {
          for (const condition of actionData.query) {
            const { field, op, value } = condition;
            if (!field || !op || value === undefined) {
              throw badRequest("Invalid query condition: " + JSON.stringify(condition));
            }
            query = query.where(field, op as WhereFilterOp, value);
          }
        }

        // Execute the query and retrieve results
        const snapshot = await query.get();
        if (snapshot.empty) {
          return [];
        }
        return snapshot.docs.map((doc) => doc.data());
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
  } finally {
    deleteApp(app);
  }
}
