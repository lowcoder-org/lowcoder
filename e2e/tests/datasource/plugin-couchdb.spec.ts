import { randomBytes } from "node:crypto";
import { connect } from "node:net";
import type { Page } from "@playwright/test";
import { createApp, createNodePluginDatasource, executeAppQueryRaw, type RawAnswer, type RegisteredUser } from "../../src/api/client";
import { API_OK, COUCHDB, TAGS } from "../../src/constants";
import { appDsl, button, nodePluginQuery, stackItems } from "../../src/dsl/builders";
import { recordedPluginDatasource, recordedPluginQuery } from "../../src/dsl/recorded";
import { boundText, boundTextTestId, openSeededView } from "../../src/components/scenario";
import { couchdbAdmin, couchdbConnection, couchdbDirect, type CouchdbConnection } from "../../src/datasource/couchdb";
import { expect, test } from "../../src/fixtures";

/**
 * D14: the CouchDB plugin of node-service (`server/node-service/src/plugins/couchdb/index.ts`, the plugin id `couchdb`, an OpenAPI wrapper) run
 * against a REAL Apache CouchDB server, the sidecar of the run (`scripts/run-in-docker.sh` starts it only with
 * `E2E_INCLUDE_NODE_SERVICE_SIDECARS=1`; image, admin and setup in the README, "CouchDB sidecar"). D8a to D8i run the same plugin against the
 * echo's canned answers; here the answers are the server's own. Every connection of these tests goes to the sidecar: the data source URL is
 * `http://<alias>:5984` from `E2E_COUCHDB_HOST`, never a placeholder. Each test makes its own database, named by a per-test marker, and removes
 * it in a `finally`, so parallel tests share nothing; the sidecar's system databases are only read.
 *
 * "Direct" calls (`couchdbDirect`, `couchdbAdmin`) go from the test process to the sidecar. They are the controls that show what the server
 * itself answers (a status code the plugin hides, the stored document), next to what the plugin makes of it for the app, and the way a test
 * sets up and removes what it needs.
 *
 * Measured on the images `3.0.0-e2e` and `3.0.1-e2e` against CouchDB 3.5.1 (the plugin's bundled document is the 3.1.1 one):
 * - Every operation the plugin runs answers the JSON body of the server's answer as the query's data (`success: true`, `queryCode: "OK"`).
 * - An HTTP error answer that carries a body is ALSO reported as `success: true`, with the error body as the data: 412 (database exists), 404
 *   (missing database or document), 409 (stale revision), 401 (wrong password) all arrive this way (NSD-4 candidate, the defect D7d shows
 *   against a canned answer). The status code is lost; the body's `error` member is the only sign.
 * - An error answer WITHOUT a body fails the query: a conditional read whose ETag still matches is `304` and the query fails with `status: 304`.
 * - `docGet` cannot run without an `If-None-Match` header: the bundled document marks it required (the server treats it as optional: a read
 *   without it answers the document), and the plugin refuses the query with its own message (NSD-16 candidate). A value that is not the
 *   current ETag (`e2e-no-match` here) reads the document; the current ETag is a 304.
 * - The plugin sends the Basic credentials of the data source (the admin of the sidecar); `_all_dbs` of a fresh node lists the three system
 *   databases the run script creates, plus every database of the tests running at that time, so the exact lists below are scoped by a key range.
 *
 * Not covered: the JWT credential (the image's default configuration has no JWT authentication handler, so a token cannot be accepted); cookie
 * sessions (the plugin sends the `Authorization` header only); replication, design documents, partitions, attachments, bulk operations and the
 * rest of the document's operations (the query form offers them; these tests run the ones named below).
 */
/** Candidate defect: an HTTP error answer that carries a body is returned as the query's data with `success: true`. */
const ERROR_BODY_DEFECT = { type: "defect", description: "NSD-4 candidate" } as const;
/** Candidate defect: the bundled document marks the `If-None-Match` header of `docGet` required, so the query cannot run without it, and a matching ETag (304) fails it. */
const IF_NONE_MATCH_DEFECT = { type: "defect", description: "NSD-16 candidate" } as const;

const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_NOT_MODIFIED = 304;
const HTTP_UNAUTHORIZED = 401;
const HTTP_NOT_FOUND = 404;
const HTTP_FORBIDDEN = 403;
const HTTP_CONFLICT = 409;
const HTTP_PRECONDITION_FAILED = 412;
const QUERY_CODE_OK = "OK";
const QUERY_CODE_FAILED = "FAILED";
const MARKER_BYTES = 4;
const QUERY_ID = "q1";
const QUERY_NAME = "q";

/** A password the sidecar's admin does not have: the control that a refusal is about the credential. */
const WRONG_PASSWORD = "e2e-wrong-password";

/** The form the server stores an admin's password in once it has hashed it. */
const HASHED_PASSWORD = /^-pbkdf2/;

/** Failed logins of one account after which CouchDB 3.5 locks it (the next login is refused with 403, whatever its password). */
const LOCKOUT_FAILURES = 5;

/** The server's own error bodies (CouchDB 3.5.1): what the plugin returns as data for the answers below, and what a direct call shows with its status. */
const SERVER_ERRORS = {
  /** 412 for a `PUT` of a database that exists. */
  DATABASE_EXISTS: { error: "file_exists", reason: "The database could not be created, the file already exists." },
  /** 409 for a write or a delete with a revision that is not the current one. */
  CONFLICT: { error: "conflict", reason: "Document update conflict." },
  /** 404 for any call on a database that does not exist. */
  DATABASE_MISSING: { error: "not_found", reason: "Database does not exist." },
  /** 404 for a read of a document that was never written. */
  DOCUMENT_MISSING: { error: "not_found", reason: "missing" },
  /** 404 for a read of a document whose latest revision is a deletion. */
  DOCUMENT_DELETED: { error: "not_found", reason: "deleted" },
  /** 401 for a wrong password. */
  BAD_PASSWORD: { error: "unauthorized", reason: "Name or password is incorrect." },
  /** 403 for a login of an account that failed five times in a row (the right password is refused too). */
  ACCOUNT_LOCKED: { error: "forbidden", reason: "Account is temporarily locked due to multiple authentication failures" },
  /** 401 for a call without credentials on the server level. */
  NOT_SERVER_ADMIN: { error: "unauthorized", reason: "You are not a server admin." },
} as const;

/** The plugin's text for a query that omits the required header of `docGet`, and for the 304 answer (no body). */
const MISSING_HEADER_MESSAGE = "Required parameter If-None-Match is not provided";
const NOT_MODIFIED_MESSAGE = "status: 304";

/** A header value that is not the current ETag of any document: the workaround that lets `docGet` run (NSD-16 candidate). */
const NO_MATCH_ETAG = "e2e-no-match";

/** The revision a first write answers (`1-` and the md5 of the body, 32 hex digits), and the one of an update or a delete. */
const FIRST_REVISION = /^1-[0-9a-f]{32}$/;
const SECOND_REVISION = /^2-[0-9a-f]{32}$/;
const THIRD_REVISION = /^3-[0-9a-f]{32}$/;

/** The members of the information a database answers (`GET /<db>`), CouchDB 3.5.1. */
const DATABASE_INFO_KEYS = ["cluster", "compact_running", "db_name", "disk_format_version", "doc_count", "doc_del_count", "instance_start_time", "props", "purge_seq", "sizes", "update_seq"];

/** The `ok` answer of a database create or delete. */
const OK = { ok: true };

/** A port of the sidecar's host where nothing listens: the control that a refused connection is seen as one. */
const CLOSED_PORT = 5985;
const CONNECT_TIMEOUT_MS = 5000;

/** The envelope of `POST /api/query/execute` (`QueryResultView`), the fields these tests read. */
interface QueryEnvelope {
  success?: boolean;
  queryCode?: string;
  message?: string | null;
  data?: unknown;
}

function envelopeOf(answer: RawAnswer): QueryEnvelope {
  return answer.json as QueryEnvelope;
}

function uniqueMarker(): string {
  return randomBytes(MARKER_BYTES).toString("hex");
}

/** A database name of this test only (CouchDB: lower case letters, digits, `_`; it must start with a letter). */
function uniqueDatabase(): string {
  return `e2e_couch_${uniqueMarker()}`;
}

/** One saved query: the recording's variant (`""` is the editor's default, `allDBs`) and the action's fields over the recorded defaults. */
interface CouchQuery {
  variant: string;
  action: Record<string, unknown>;
}

/** The recorded variants of the operations these tests run (`recordedPluginQuery("couchdb", variant)`). */
const VARIANT = {
  ALL_DBS: "",
  PUT: "Put",
  GET: "Get",
  DELETE: "Delete",
  DOC_PUT: "DocPut",
  DOC_GET: "DocGet",
  DOC_DELETE: "DocDelete",
  DOC_GET_ALL: "DocGetAll",
} as const;

/** The queries of the operations, with the action fields the form keys them by (`path_@_`, `query_@_`, `header_@_`, `body_@_`). */
const allDbs = (action: Record<string, unknown> = {}): CouchQuery => ({ variant: VARIANT.ALL_DBS, action });
const putDatabase = (db: string): CouchQuery => ({ variant: VARIANT.PUT, action: { "path_@_db": db } });
const getDatabase = (db: string): CouchQuery => ({ variant: VARIANT.GET, action: { "path_@_db": db } });
const deleteDatabase = (db: string): CouchQuery => ({ variant: VARIANT.DELETE, action: { "path_@_db": db } });
const putDocument = (db: string, docid: string, body: unknown, extra: Record<string, unknown> = {}): CouchQuery => ({
  variant: VARIANT.DOC_PUT,
  action: { "path_@_db": db, "path_@_docid": docid, "body_@_body": JSON.stringify(body), ...extra },
});
const getDocument = (db: string, docid: string, extra: Record<string, unknown> = {}): CouchQuery => ({
  variant: VARIANT.DOC_GET,
  action: { "path_@_db": db, "path_@_docid": docid, "header_@_If-None-Match": NO_MATCH_ETAG, ...extra },
});
const deleteDocument = (db: string, docid: string, extra: Record<string, unknown>): CouchQuery => ({
  variant: VARIANT.DOC_DELETE,
  action: { "path_@_db": db, "path_@_docid": docid, ...extra },
});
const listDocuments = (db: string, extra: Record<string, unknown> = {}): CouchQuery => ({
  variant: VARIANT.DOC_GET_ALL,
  action: { "path_@_db": db, ...extra },
});

/** The credentials a data source holds when they are not the sidecar's admin. */
interface Credentials {
  username?: string;
  password?: string;
}

/** The data source fields of the sidecar over the recorded form body; the JWT field is left out (the document lists it with the Basic one as one requirement, D8f). */
function sidecarConfig(overrides: Credentials = {}): Record<string, unknown> {
  const sidecar = couchdbConnection();
  return {
    serverURL: sidecar.serverURL,
    "BasicAuth.username": overrides.username ?? sidecar.username,
    "BasicAuth.password": overrides.password ?? sidecar.password,
    "JwtAuth.value": undefined,
  };
}

async function couchdbDatasource(page: Page, apiUser: RegisteredUser, overrides: Credentials = {}): Promise<string> {
  return createNodePluginDatasource(page.request, { orgId: apiUser.orgId, recorded: recordedPluginDatasource("couchdb"), config: sidecarConfig(overrides) });
}

function savedQueries(datasourceId: string, queries: Record<string, CouchQuery>): ReturnType<typeof nodePluginQuery>[] {
  return Object.entries(queries).map(([id, query]) =>
    nodePluginQuery({ id, name: id, datasourceId, recorded: recordedPluginQuery("couchdb", query.variant), action: query.action }),
  );
}

/** A saved app with one manual CouchDB query per entry of `queries` on one data source (not published: the draft runs with `viewMode: false`). */
async function couchApp(page: Page, apiUser: RegisteredUser, queries: Record<string, CouchQuery>, overrides: Credentials = {}): Promise<string> {
  const datasourceId = await couchdbDatasource(page, apiUser, overrides);
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-couchdb", dsl: appDsl([], { queries: savedQueries(datasourceId, queries) }) });
  return appId;
}

async function runDraft(page: Page, appId: string, queryId: string): Promise<RawAnswer> {
  return executeAppQueryRaw(page.request, { applicationId: appId, queryId, viewMode: false });
}

function expectRan(answer: RawAnswer): void {
  expect({ status: answer.status, code: answer.code }, "the query request was answered").toEqual({ status: HTTP_OK, code: API_OK });
}

function expectSucceeded(answer: RawAnswer): void {
  expectRan(answer);
  expect(envelopeOf(answer).success, "the query succeeded").toBe(true);
  expect(envelopeOf(answer).queryCode, "the query code").toBe(QUERY_CODE_OK);
}

function expectFailed(answer: RawAnswer, message: string): void {
  expectRan(answer);
  expect(
    { success: envelopeOf(answer).success, queryCode: envelopeOf(answer).queryCode, message: envelopeOf(answer).message, data: envelopeOf(answer).data },
    "the query failed with the measured message",
  ).toEqual({ success: false, queryCode: QUERY_CODE_FAILED, message, data: null });
}

/** Runs a query whose answer the test asserts as data: the success state first, then the data. */
async function runForData(page: Page, appId: string, queryId: string): Promise<unknown> {
  const answer = await runDraft(page, appId, queryId);
  expectSucceeded(answer);
  return envelopeOf(answer).data;
}

/** The sidecar's answer to a call made as the admin. */
async function admin(method: string, path: string, options: { json?: unknown; headers?: Record<string, string> } = {}): Promise<{ status: number; body: unknown }> {
  const answer = await couchdbAdmin(couchdbConnection(), method, path, options);
  return { status: answer.status, body: answer.body };
}

/** Makes a database straight on the sidecar and checks the server created it (201). */
async function createDirect(db: string): Promise<void> {
  expect((await admin("PUT", `/${db}`)).status, `the server created ${db}`).toBe(HTTP_CREATED);
}

/** Removes a test's database whatever state the test ended in (404 when it is already gone is fine). */
async function removeDirect(db: string): Promise<void> {
  const { status } = await admin("DELETE", `/${db}`);
  expect([HTTP_OK, HTTP_NOT_FOUND], `removing ${db}`).toContain(status);
}

/** Writes a document straight on the sidecar (a database of the test) and returns its revision. */
async function putDirect(db: string, docid: string, body: object): Promise<string> {
  const answer = await admin("PUT", `/${db}/${docid}`, { json: body });
  expect(answer.status, `the server stored ${docid}`).toBe(HTTP_CREATED);
  return (answer.body as { rev: string }).rev;
}

/** A character above every name character of the tests: appended to a prefix it closes the key range of the names that start with the prefix. */
const KEY_RANGE_END = "\uFFF0";

/**
 * A second server admin, made through the server's configuration API (`PUT /_node/_local/_config/admins/<name>`) for one test. CouchDB 3.5
 * temporarily locks an account after five failed logins (HTTP 403, `forbidden`), and a locked account is refused WITH the right password
 * too: a test that sends a wrong password must never do it as the sidecar's own admin, which every other test uses. Only a real account is
 * locked: failures for a name that does not exist are not counted (measured).
 */
async function createThrowawayAdmin(): Promise<Required<Credentials>> {
  const username = `e2e_admin_${uniqueMarker()}`;
  const password = `e2e-throwaway-${uniqueMarker()}`;
  const answer = await admin("PUT", `/_node/_local/_config/admins/${username}`, { json: password });
  expect(answer.status, `the server made the admin ${username}`).toBe(HTTP_OK);
  // the server stores the password as given and hashes it a moment later; until it has, a login of the account fails (and counts toward the lockout)
  try {
    await expect
      .poll(async () => (await admin("GET", `/_node/_local/_config/admins/${username}`)).body, { message: `the server hashed the password of ${username}` })
      .toMatch(HASHED_PASSWORD);
  } catch (error) {
    // the caller never gets the name, so nobody else would remove the account
    await removeThrowawayAdmin(username);
    throw error;
  }
  return { username, password };
}

async function removeThrowawayAdmin(username: string): Promise<void> {
  expect((await admin("DELETE", `/_node/_local/_config/admins/${username}`)).status, `the server removed the admin ${username}`).toBe(HTTP_OK);
}

/** The key range that holds exactly the names starting with `prefix`: `list` runs it as `startkey` and `endkey` (CouchDB wants them JSON-encoded). */
function rangeOf(prefix: string): Record<string, unknown> {
  return { "query_@_startkey": JSON.stringify(prefix), "query_@_endkey": JSON.stringify(`${prefix}${KEY_RANGE_END}`) };
}

/** How a TCP connection to `host:port` ended: `connected`, or the error code Node reports (`ECONNREFUSED`, ...). */
async function tcpOutcome(host: string, port: number): Promise<string> {
  return new Promise((resolve) => {
    const socket = connect({ host, port });
    socket.setTimeout(CONNECT_TIMEOUT_MS, () => {
      socket.destroy();
      resolve("timeout");
    });
    socket.once("connect", () => {
      socket.destroy();
      resolve("connected");
    });
    socket.once("error", (error: NodeJS.ErrnoException) => resolve(error.code ?? error.message));
  });
}

test.describe("CouchDB data source against a real CouchDB server", { tag: [TAGS.NODE_SERVICE, TAGS.NODE_SERVICE_SIDECAR] }, () => {
  test("D14a: a database is created, listed, described and deleted, and the server agrees at each step", async ({ page, apiUser }) => {
    const db = uniqueDatabase();
    try {
      const appId = await couchApp(page, apiUser, {
        list: allDbs(rangeOf(db)),
        create: putDatabase(db),
        info: getDatabase(db),
        remove: deleteDatabase(db),
      });

      expect(await runForData(page, appId, "list"), "before the create no database of this test is listed").toEqual([]);
      expect((await admin("GET", `/${db}`)).status, "the server has no such database yet").toBe(HTTP_NOT_FOUND);
      expect(await runForData(page, appId, "create"), "the create answers ok").toEqual(OK);
      expect(await runForData(page, appId, "list"), "the new database is listed").toEqual([db]);
      const info = (await runForData(page, appId, "info")) as Record<string, unknown>;
      expect(Object.keys(info).sort(), "the information's members").toEqual(DATABASE_INFO_KEYS);
      expect({ db_name: info.db_name, doc_count: info.doc_count, doc_del_count: info.doc_del_count, compact_running: info.compact_running }, "an empty database").toEqual({
        db_name: db,
        doc_count: 0,
        doc_del_count: 0,
        compact_running: false,
      });
      const direct = await admin("GET", `/${db}`);
      expect({ status: direct.status, db_name: (direct.body as { db_name: string }).db_name }, "the server's own view of the database").toEqual({ status: HTTP_OK, db_name: db });
      expect(await runForData(page, appId, "remove"), "the delete answers ok").toEqual(OK);
      expect(await runForData(page, appId, "list"), "after the delete the database is not listed").toEqual([]);
      expect(await admin("GET", `/${db}`), "the server no longer has it").toEqual({ status: HTTP_NOT_FOUND, body: SERVER_ERRORS.DATABASE_MISSING });
    } finally {
      await removeDirect(db);
    }
  });

  test("D14b: a document is created, read, updated, read at its old revision, listed and deleted, and the server holds what the plugin wrote", async ({ page, apiUser }) => {
    const db = uniqueDatabase();
    const docid = "doc-1";
    const first = { title: `first-${uniqueMarker()}`, count: 1 };
    const second = { title: `second-${uniqueMarker()}`, count: 2 };
    try {
      await createDirect(db);
      const appId = await couchApp(page, apiUser, {
        create: putDocument(db, docid, first),
        read: getDocument(db, docid),
        listAll: listDocuments(db, { "query_@_include_docs": "true" }),
        listRows: listDocuments(db),
      });
      expect(await runForData(page, appId, "listRows"), "before the create the database holds no document").toEqual({ total_rows: 0, offset: 0, rows: [] });

      const created = (await runForData(page, appId, "create")) as { ok: boolean; id: string; rev: string };
      expect({ ok: created.ok, id: created.id }, "the create answers ok and the id").toEqual({ ok: true, id: docid });
      expect(created.rev, "the first revision").toMatch(FIRST_REVISION);
      expect(await runForData(page, appId, "read"), "the document as the server stores it, with the id and revision added").toEqual({ _id: docid, _rev: created.rev, ...first });
      expect((await admin("GET", `/${db}/${docid}`)).body, "the server's own copy").toEqual({ _id: docid, _rev: created.rev, ...first });

      // the update names the revision it replaces, as a query parameter
      const updateApp = await couchApp(page, apiUser, {
        update: putDocument(db, docid, second, { "query_@_rev": created.rev }),
        readOld: getDocument(db, docid, { "query_@_rev": created.rev }),
        read: getDocument(db, docid),
      });
      const updated = (await runForData(page, updateApp, "update")) as { ok: boolean; id: string; rev: string };
      expect({ ok: updated.ok, id: updated.id }, "the update answers ok and the id").toEqual({ ok: true, id: docid });
      expect(updated.rev, "the second revision").toMatch(SECOND_REVISION);
      expect(await runForData(page, updateApp, "read"), "the latest revision is the new body").toEqual({ _id: docid, _rev: updated.rev, ...second });
      expect(await runForData(page, updateApp, "readOld"), "the first revision is still readable by its revision").toEqual({ _id: docid, _rev: created.rev, ...first });
      expect(await runForData(page, appId, "listAll"), "the listing with the documents").toEqual({
        total_rows: 1,
        offset: 0,
        rows: [{ id: docid, key: docid, value: { rev: updated.rev }, doc: { _id: docid, _rev: updated.rev, ...second } }],
      });

      const deleteApp = await couchApp(page, apiUser, {
        remove: deleteDocument(db, docid, { "query_@_rev": updated.rev }),
        read: getDocument(db, docid),
      });
      const removed = (await runForData(page, deleteApp, "remove")) as { ok: boolean; id: string; rev: string };
      expect({ ok: removed.ok, id: removed.id }, "the delete answers ok and the id").toEqual({ ok: true, id: docid });
      expect(removed.rev, "a delete is a third revision").toMatch(THIRD_REVISION);
      expect((await admin("GET", `/${db}/${docid}`)).body, "the server: the document is deleted").toEqual(SERVER_ERRORS.DOCUMENT_DELETED);
      expect(await runForData(page, appId, "listRows"), "the deleted document is not listed").toEqual({ total_rows: 0, offset: 0, rows: [] });
    } finally {
      await removeDirect(db);
    }
  });

  test("D14c: a stale revision answers a conflict body as a successful query and changes nothing, and the right revision on the same query succeeds", { annotation: ERROR_BODY_DEFECT }, async ({ page, apiUser }) => {
    const db = uniqueDatabase();
    const docid = "doc-1";
    try {
      await createDirect(db);
      const revision = await putDirect(db, docid, { n: 1 });
      // two more documents for the successful controls of the delete queries
      const revisionByQuery = await putDirect(db, "doc-delete-rev", { n: 1 });
      const revisionByHeader = await putDirect(db, "doc-delete-if-match", { n: 1 });
      const staleRevision = "1-00000000000000000000000000000000";
      const appId = await couchApp(page, apiUser, {
        staleWrite: putDocument(db, docid, { n: 2 }, { "query_@_rev": staleRevision }),
        noRevisionWrite: putDocument(db, docid, { n: 3 }),
        staleDelete: deleteDocument(db, docid, { "query_@_rev": staleRevision }),
        staleIfMatchDelete: deleteDocument(db, docid, { "header_@_If-Match": staleRevision }),
        goodWrite: putDocument(db, docid, { n: 4 }, { "query_@_rev": revision }),
        goodDeleteByQuery: deleteDocument(db, "doc-delete-rev", { "query_@_rev": revisionByQuery }),
        goodDeleteByHeader: deleteDocument(db, "doc-delete-if-match", { "header_@_If-Match": revisionByHeader }),
      });

      // what the server itself says: 409 for each of the four refused calls (the controls that the answer is an error)
      const direct = [
        await admin("PUT", `/${db}/${docid}?rev=${staleRevision}`, { json: { n: 2 } }),
        await admin("PUT", `/${db}/${docid}`, { json: { n: 3 } }),
        await admin("DELETE", `/${db}/${docid}?rev=${staleRevision}`),
        await admin("DELETE", `/${db}/${docid}`, { headers: { "If-Match": staleRevision } }),
      ];
      expect(
        direct.map((answer) => ({ status: answer.status, body: answer.body })),
        "the server's answers to the refused calls",
      ).toEqual(Array.from({ length: 4 }, () => ({ status: HTTP_CONFLICT, body: SERVER_ERRORS.CONFLICT })));

      // NSD-4 candidate: the plugin reports the 409 body as the data of a successful query
      for (const query of ["staleWrite", "noRevisionWrite", "staleDelete", "staleIfMatchDelete"]) {
        expect(await runForData(page, appId, query), `${query}: the error body is the data`).toEqual(SERVER_ERRORS.CONFLICT);
      }
      expect((await admin("GET", `/${db}/${docid}`)).body, "none of them changed the document").toEqual({ _id: docid, _rev: revision, n: 1 });

      // positive control: the current revision on the same kind of query is accepted
      const accepted = (await runForData(page, appId, "goodWrite")) as { ok: boolean; id: string; rev: string };
      expect({ ok: accepted.ok, id: accepted.id }, "the write with the current revision").toEqual({ ok: true, id: docid });
      expect(accepted.rev, "the second revision").toMatch(SECOND_REVISION);
      expect((await admin("GET", `/${db}/${docid}`)).body, "the server holds the accepted write").toEqual({ _id: docid, _rev: accepted.rev, n: 4 });
      // positive controls for the two kinds of refused delete: the current revision, as a query parameter and as If-Match, deletes
      for (const [query, id] of [["goodDeleteByQuery", "doc-delete-rev"], ["goodDeleteByHeader", "doc-delete-if-match"]] as const) {
        const deleted = (await runForData(page, appId, query)) as { ok: boolean; id: string; rev: string };
        expect({ ok: deleted.ok, id: deleted.id }, `${query}: the delete with the current revision`).toEqual({ ok: true, id });
        expect((await admin("GET", `/${db}/${id}`)).body, `${query}: the server: the document is deleted`).toEqual(SERVER_ERRORS.DOCUMENT_DELETED);
      }
    } finally {
      await removeDirect(db);
    }
  });

  test("D14d: a missing database or document and an existing database answer their error bodies as successful queries", { annotation: ERROR_BODY_DEFECT }, async ({ page, apiUser }) => {
    const db = uniqueDatabase();
    const missingDb = `${db}_missing`;
    const oldDb = `${db}_old`;
    const newDb = `${db}_new`;
    try {
      await createDirect(db);
      await createDirect(oldDb);
      await putDirect(db, "present", { here: true });
      const appId = await couchApp(page, apiUser, {
        readPresent: getDocument(db, "present"),
        readMissingDoc: getDocument(db, "absent"),
        readMissingDb: getDocument(missingDb, "present"),
        infoMissingDb: getDatabase(missingDb),
        deleteMissingDb: deleteDatabase(missingDb),
        createExisting: putDatabase(db),
        infoExisting: getDatabase(db),
        deleteExisting: deleteDatabase(oldDb),
        createNew: putDatabase(newDb),
      });

      // the server's statuses (controls: the errors exist, and they are the specific ones)
      expect(
        [
          await admin("GET", `/${db}/absent`),
          await admin("GET", `/${missingDb}/present`),
          await admin("GET", `/${missingDb}`),
          await admin("DELETE", `/${missingDb}`),
          await admin("PUT", `/${db}`),
        ],
        "the server's answers",
      ).toEqual([
        { status: HTTP_NOT_FOUND, body: SERVER_ERRORS.DOCUMENT_MISSING },
        { status: HTTP_NOT_FOUND, body: SERVER_ERRORS.DATABASE_MISSING },
        { status: HTTP_NOT_FOUND, body: SERVER_ERRORS.DATABASE_MISSING },
        { status: HTTP_NOT_FOUND, body: SERVER_ERRORS.DATABASE_MISSING },
        { status: HTTP_PRECONDITION_FAILED, body: SERVER_ERRORS.DATABASE_EXISTS },
      ]);

      expect(await runForData(page, appId, "readPresent"), "positive control: the document that exists is read").toEqual({ _id: "present", _rev: expect.stringMatching(FIRST_REVISION), here: true });
      // NSD-4 candidate: each error body is the data of a successful query
      expect(await runForData(page, appId, "readMissingDoc"), "a missing document").toEqual(SERVER_ERRORS.DOCUMENT_MISSING);
      expect(await runForData(page, appId, "readMissingDb"), "a document of a missing database").toEqual(SERVER_ERRORS.DATABASE_MISSING);
      expect(await runForData(page, appId, "infoMissingDb"), "the information of a missing database").toEqual(SERVER_ERRORS.DATABASE_MISSING);
      expect(await runForData(page, appId, "deleteMissingDb"), "the delete of a missing database").toEqual(SERVER_ERRORS.DATABASE_MISSING);
      expect(await runForData(page, appId, "createExisting"), "the create of a database that exists").toEqual(SERVER_ERRORS.DATABASE_EXISTS);
      expect((await admin("GET", `/${db}/present`)).status, "the refused create did not touch the existing database").toBe(HTTP_OK);

      // positive controls through the same operations: the information of an existing database, the delete of an existing one, the create of a new one
      expect(((await runForData(page, appId, "infoExisting")) as { db_name: string }).db_name, "the information of an existing database").toBe(db);
      expect((await admin("GET", `/${newDb}`)).status, "before the create the new database does not exist").toBe(HTTP_NOT_FOUND);
      expect(await runForData(page, appId, "createNew"), "the create of a database that does not exist").toEqual(OK);
      expect((await admin("GET", `/${newDb}`)).status, "the server has the new database").toBe(HTTP_OK);
      expect((await admin("GET", `/${oldDb}`)).status, "before the delete the old database exists").toBe(HTTP_OK);
      expect(await runForData(page, appId, "deleteExisting"), "the delete of a database that exists").toEqual(OK);
      expect((await admin("GET", `/${oldDb}`)).status, "the server no longer has the old database").toBe(HTTP_NOT_FOUND);
    } finally {
      await removeDirect(db);
      await removeDirect(oldDb);
      await removeDirect(newDb);
    }
  });

  test("D14e: a wrong password answers an unauthorized body as a successful query and writes nothing, and the right password on the same queries works", { annotation: ERROR_BODY_DEFECT }, async ({ page, apiUser }) => {
    const db = uniqueDatabase();
    const sidecar = couchdbConnection();
    const account = await createThrowawayAdmin();
    try {
      const queries = { list: allDbs(rangeOf(db)), create: putDatabase(db) };
      const wrongApp = await couchApp(page, apiUser, queries, { ...account, password: WRONG_PASSWORD });
      const rightApp = await couchApp(page, apiUser, queries, account);

      // what the server says: 401 for a wrong password (once, so the account stays below the lockout), for a user that does not exist, and for no credential at all
      const direct = [
        await couchdbDirect(sidecar, "GET", "/_all_dbs", { credentials: { username: account.username, password: WRONG_PASSWORD } }),
        await couchdbDirect(sidecar, "GET", "/_all_dbs", { credentials: { username: `${account.username}_other`, password: account.password } }),
        await couchdbDirect(sidecar, "GET", "/_all_dbs"),
      ];
      expect(
        direct.map((answer) => ({ status: answer.status, body: answer.body })),
        "the server's answers to the three refused calls",
      ).toEqual([
        { status: HTTP_UNAUTHORIZED, body: SERVER_ERRORS.BAD_PASSWORD },
        { status: HTTP_UNAUTHORIZED, body: SERVER_ERRORS.BAD_PASSWORD },
        { status: HTTP_UNAUTHORIZED, body: SERVER_ERRORS.NOT_SERVER_ADMIN },
      ]);
      expect((await couchdbDirect(sidecar, "GET", "/_all_dbs", { credentials: account })).status, "positive control: the account's own password is accepted by the server").toBe(HTTP_OK);

      // NSD-4 candidate: the wrong password's 401 body is the data of a successful query
      expect(await runForData(page, wrongApp, "list"), "the listing with the wrong password").toEqual(SERVER_ERRORS.BAD_PASSWORD);
      expect(await runForData(page, wrongApp, "create"), "the create with the wrong password").toEqual(SERVER_ERRORS.BAD_PASSWORD);
      expect((await admin("GET", `/${db}`)).status, "the refused create made no database").toBe(HTTP_NOT_FOUND);

      // positive control: the same two queries with the right password
      expect(await runForData(page, rightApp, "list"), "the listing with the right password").toEqual([]);
      expect(await runForData(page, rightApp, "create"), "the create with the right password").toEqual(OK);
      expect(await runForData(page, rightApp, "list"), "and the database is there").toEqual([db]);
    } finally {
      await removeDirect(db);
      await removeThrowawayAdmin(account.username);
    }
  });

  test("D14j: five wrong passwords lock the account for the client address, and it is refused with its right password too, as a successful query (HTTP 403 body)", { annotation: ERROR_BODY_DEFECT }, async ({ page, apiUser }) => {
    const sidecar = couchdbConnection();
    const account = await createThrowawayAdmin();
    try {
      const queries = { list: allDbs() };
      const wrongApp = await couchApp(page, apiUser, queries, { ...account, password: WRONG_PASSWORD });
      const rightApp = await couchApp(page, apiUser, queries, account);

      const rightBefore = (await runForData(page, rightApp, "list")) as string[];
      expect(rightBefore, "before the failures the account's right password lists the databases").toEqual(expect.arrayContaining([...COUCHDB.SYSTEM_DATABASES]));
      const attempts: unknown[] = [];
      for (let attempt = 0; attempt < LOCKOUT_FAILURES + 1; attempt++) attempts.push(await runForData(page, wrongApp, "list"));
      // NSD-4 candidate: every refusal is the data of a successful query; the sixth is the lockout's 403 body
      expect(attempts, "five wrong passwords are 401 bodies, the next one is the lockout's body").toEqual([
        ...Array.from({ length: LOCKOUT_FAILURES }, () => SERVER_ERRORS.BAD_PASSWORD),
        SERVER_ERRORS.ACCOUNT_LOCKED,
      ]);
      expect(await runForData(page, rightApp, "list"), "the right password is refused as well").toEqual(SERVER_ERRORS.ACCOUNT_LOCKED);
      // measured: the server keeps the failures per account AND client address, so the runner, a different address than the app container's, is not locked yet
      const fromRunner = await couchdbDirect(sidecar, "GET", "/_all_dbs", { credentials: account });
      expect(fromRunner.status, "the runner's login of the same account still works").toBe(HTTP_OK);
      // the same five failures from the runner show the status the plugin hides: 401 five times, then 403 even with the right password
      const runnerStatuses: number[] = [];
      for (let attempt = 0; attempt < LOCKOUT_FAILURES + 1; attempt++) {
        runnerStatuses.push((await couchdbDirect(sidecar, "GET", "/_all_dbs", { credentials: { ...account, password: WRONG_PASSWORD } })).status);
      }
      expect(runnerStatuses, "the server's statuses: five 401, then 403").toEqual([...Array.from({ length: LOCKOUT_FAILURES }, () => HTTP_UNAUTHORIZED), HTTP_FORBIDDEN]);
      const lockedDirect = await couchdbDirect(sidecar, "GET", "/_all_dbs", { credentials: account });
      expect({ status: lockedDirect.status, body: lockedDirect.body }, "the right password from the locked address").toEqual({ status: HTTP_FORBIDDEN, body: SERVER_ERRORS.ACCOUNT_LOCKED });
      expect((await admin("GET", "/_all_dbs")).status, "positive control: the sidecar's own admin is not locked").toBe(HTTP_OK);
    } finally {
      await removeThrowawayAdmin(account.username);
    }
  });

  test("D14f: docGet refuses to run without If-None-Match, a value that is not the ETag reads the document, a matching ETag fails with 304", { annotation: IF_NONE_MATCH_DEFECT }, async ({ page, apiUser }) => {
    const db = uniqueDatabase();
    const docid = "doc-1";
    try {
      await createDirect(db);
      const revision = await putDirect(db, docid, { n: 1 });
      const appId = await couchApp(page, apiUser, {
        withoutHeader: getDocument(db, docid, { "header_@_If-None-Match": "" }),
        withHeader: getDocument(db, docid),
        matching: getDocument(db, docid, { "header_@_If-None-Match": `"${revision}"` }),
      });

      // the server's own view (controls): the header is optional, a document without it is read, and the current ETag is 304
      const withoutHeader = await admin("GET", `/${db}/${docid}`);
      expect(withoutHeader, "the server reads the document without the header").toEqual({ status: HTTP_OK, body: { _id: docid, _rev: revision, n: 1 } });
      const matchingDirect = await admin("GET", `/${db}/${docid}`, { headers: { "If-None-Match": `"${revision}"` } });
      expect(matchingDirect.status, "the server answers 304 to the current ETag").toBe(HTTP_NOT_MODIFIED);

      // NSD-16 candidate
      expectFailed(await runDraft(page, appId, "withoutHeader"), MISSING_HEADER_MESSAGE);
      expect(await runForData(page, appId, "withHeader"), "positive control: with a header of any other value the document is read").toEqual({ _id: docid, _rev: revision, n: 1 });
      expectFailed(await runDraft(page, appId, "matching"), NOT_MODIFIED_MESSAGE);
    } finally {
      await removeDirect(db);
    }
  });

  test("D14g: the listing options reach the server: a key range, descending order, skip and limit, on databases and on documents", async ({ page, apiUser }) => {
    const db = uniqueDatabase();
    const names = [db, `${db}_b`, `${db}_c`];
    try {
      for (const name of names) await createDirect(name);
      const revisions: Record<string, string> = {};
      for (const docid of ["doc-a", "doc-b", "doc-c"]) revisions[docid] = await putDirect(names[0] as string, docid, { id: docid });
      const row = (docid: string): { id: string; key: string; value: { rev: string } } => ({ id: docid, key: docid, value: { rev: revisions[docid] as string } });
      const upper = JSON.stringify(`${db}${KEY_RANGE_END}`);
      const lower = JSON.stringify(db);
      const appId = await couchApp(page, apiUser, {
        ascending: allDbs(rangeOf(db)),
        descending: allDbs({ "query_@_startkey": upper, "query_@_endkey": lower, "query_@_descending": "true" }),
        firstOne: allDbs({ ...rangeOf(db), "query_@_limit": "1" }),
        secondOne: allDbs({ ...rangeOf(db), "query_@_skip": "1", "query_@_limit": "1" }),
        unscoped: allDbs(),
        firstTwoDocs: listDocuments(db, { "query_@_limit": "2" }),
        secondDoc: listDocuments(db, { "query_@_skip": "1", "query_@_limit": "1" }),
        lastDocFirst: listDocuments(db, { "query_@_descending": "true", "query_@_limit": "1" }),
      });

      expect(await runForData(page, appId, "ascending"), "the range in key order").toEqual(names);
      expect(await runForData(page, appId, "descending"), "the same range, descending").toEqual([...names].reverse());
      expect(await runForData(page, appId, "firstOne"), "limit 1").toEqual([names[0]]);
      expect(await runForData(page, appId, "secondOne"), "skip 1, limit 1").toEqual([names[1]]);
      // not scoped: every database of the server, so a test running in parallel adds its own; the three system databases and these three are there
      const all = (await runForData(page, appId, "unscoped")) as string[];
      expect(all, "every database is listed, the system ones and the three of this test").toEqual(expect.arrayContaining([...COUCHDB.SYSTEM_DATABASES, ...names]));
      expect(all, "in key order").toEqual([...all].sort());
      // the documents of the first database
      expect(await runForData(page, appId, "firstTwoDocs"), "limit 2 of three documents: the total still counts all of them").toEqual({ total_rows: 3, offset: 0, rows: [row("doc-a"), row("doc-b")] });
      expect(await runForData(page, appId, "secondDoc"), "skip 1, limit 1").toEqual({ total_rows: 3, offset: 1, rows: [row("doc-b")] });
      expect(await runForData(page, appId, "lastDocFirst"), "descending, limit 1").toEqual({ total_rows: 3, offset: 0, rows: [row("doc-c")] });
    } finally {
      for (const name of names) await removeDirect(name);
    }
  });

  test("D14h: the published view shows a document of the server after a click", async ({ page, apiUser }) => {
    const db = uniqueDatabase();
    const docid = "doc-1";
    const title = `title-${uniqueMarker()}`;
    try {
      await createDirect(db);
      await putDirect(db, docid, { title });
      const datasourceId = await couchdbDatasource(page, apiUser);
      // before the first run `q.data` is not a document
      const expression = `{{${QUERY_NAME}.data ? ${QUERY_NAME}.data.title : ""}}`;
      const view = await openSeededView(
        page,
        apiUser.orgId,
        "e2e-couchdb-view",
        stackItems([
          button({ id: "b1", name: "button1", text: "Run", testId: "e2e-couchdb-run", onClickQuery: QUERY_NAME }),
          boundText({ id: "t1", name: "label", expression }),
          // `success` also reads `true` before the first run (measured, D5e), so only the state after the click proves anything
          boundText({ id: "t2", name: "succeeded", expression: `{{String(${QUERY_NAME}.success)}}` }),
        ]),
        {
          queries: [
            nodePluginQuery({
              id: QUERY_ID,
              name: QUERY_NAME,
              datasourceId,
              recorded: recordedPluginQuery("couchdb", VARIANT.DOC_GET),
              action: getDocument(db, docid).action,
            }),
          ],
        },
      );

      await expect(view.byTestId(boundTextTestId("label")), "before the click the text is empty").toHaveText("");
      await view.buttonByTestId("e2e-couchdb-run").click();
      await expect(view.byTestId(boundTextTestId("succeeded")), "after the click the query succeeded").toHaveText("true");
      await expect(view.byTestId(boundTextTestId("label")), "after the click the text shows the server's document").toHaveText(title);
    } finally {
      await removeDirect(db);
    }
  });

  test("D14i: the runner reaches the sidecar over HTTP and TCP, and a closed port of the same host is refused", async () => {
    const sidecar: CouchdbConnection = couchdbConnection();
    const host = new URL(sidecar.serverURL).hostname;

    const root = await couchdbDirect(sidecar, "GET", "/");

    expect(root.status, "the server's root answers").toBe(HTTP_OK);
    expect(root.body, "the welcome of an Apache CouchDB 3.5.1").toMatchObject({ couchdb: "Welcome", version: "3.5.1", vendor: { name: "The Apache Software Foundation" } });
    expect((await couchdbDirect(sidecar, "GET", "/_all_dbs")).status, "the server level needs credentials").toBe(HTTP_UNAUTHORIZED);
    expect(await tcpOutcome(host, COUCHDB.PORT), "the sidecar's HTTP port").toBe("connected");
    expect(await tcpOutcome(host, CLOSED_PORT), "positive control: a port nothing listens on is refused").toBe("ECONNREFUSED");
  });
});
