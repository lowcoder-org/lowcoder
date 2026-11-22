import nock from "nock";
import { ServiceError } from "../../common/error";
import supabasePlugin from "./index";
import run from "./run";

/**
 * supabase storage plugin. The real supabase-js / storage-js client is used; nock plays the
 * Supabase storage REST API on the project URL, so the exact requests (path, method, body, auth
 * headers) are asserted. Endpoint paths were read from @supabase/storage-js 2.7.0 (dist/main/packages).
 */

const PROJECT_URL = "http://supabase.test";
const STORAGE = "/storage/v1";
const API_KEY = "test-api-key";
const BUCKET = "assets";
const STATUS_OK = 200;
const STATUS_BAD_REQUEST = 400;
const STATUS_SERVER_ERROR = 500;
const SIGNED_URL_SECONDS = 300;
const dataSource = { projectUrl: PROJECT_URL, apiKey: API_KEY };

type RunArgs = Parameters<typeof run>;
const act = (a: Record<string, unknown>) => a as unknown as RunArgs[0];
const storage = () => nock(PROJECT_URL, { reqheaders: { apikey: API_KEY, authorization: `Bearer ${API_KEY}` } });
const signed = (p: string) => `${PROJECT_URL}${STORAGE}${p}`;

beforeAll(() => {
  nock.disableNetConnect();
});
afterAll(() => {
  nock.enableNetConnect();
});
beforeEach(() => {
  if (!nock.isActive()) nock.activate();
});
afterEach(() => {
  // Cleanup first, assertion last: a pending mock must fail its own test without leaking interceptors
  // into the next one. nock.isDone() is read before cleanAll() clears the interceptors.
  const pending = nock.pendingMocks();
  const done = nock.isDone();
  nock.cleanAll();
  nock.restore();
  expect({ done, pending }).toEqual({ done: true, pending: [] });
});

/** Settles a call into a result object so an unexpected rejection shows up as an explicit outcome instead of a thrown error. */
type Outcome<T> = { ok: T } | { err: any };
const settle = <T>(call: Promise<T>): Promise<Outcome<T>> =>
  call.then(
    (ok) => ({ ok }),
    (err) => ({ err })
  );

describe("listBuckets", () => {
  test("GET /bucket with the api key, and the bucket list comes back", async () => {
    const buckets = [{ id: BUCKET, name: BUCKET, public: false }];
    storage().get(`${STORAGE}/bucket`).reply(STATUS_OK, buckets);
    expect(await run(act({ actionName: "listBuckets" }), dataSource)).toEqual(buckets);
  });

  test("an error response is thrown as a storage error", async () => {
    storage().get(`${STORAGE}/bucket`).reply(STATUS_SERVER_ERROR, { message: "db down" });
    const err: any = await run(act({ actionName: "listBuckets" }), dataSource).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err.__isStorageError).toBe(true);
  });
});

describe("listObjects", () => {
  test("a missing bucket is a 400 'Bucket is required' and nothing is requested", async () => {
    const err = await run(act({ actionName: "listObjects", bucket: "", path: "" }), dataSource).catch((e) => e);
    expect(err).toBeInstanceOf(ServiceError);
    expect(err.code).toBe(STATUS_BAD_REQUEST);
    expect(err.message).toBe("Bucket is required");
  });

  test("limit, offset, sortBy and the folder prefix are in the request body; every item gets its public url", async () => {
    const sortBy = { column: "updated_at", order: "desc" };
    let body: any;
    storage()
      .post(`${STORAGE}/object/list/${BUCKET}`, (b) => {
        body = b;
        return true;
      })
      .reply(STATUS_OK, [{ name: "a.txt", id: "1" }, { name: "b c.txt", id: "2" }]);
    const res = await run(act({ actionName: "listObjects", bucket: BUCKET, path: "docs", limit: 25, offset: 5, sortBy }), dataSource);
    expect(body).toEqual({ limit: 25, offset: 5, sortBy, prefix: "docs" });
    expect(res).toEqual([
      { name: "a.txt", id: "1", signedUrl: undefined, url: signed(`/object/public/${BUCKET}/docs/a.txt`) },
      { name: "b c.txt", id: "2", signedUrl: undefined, url: signed(`/object/public/${BUCKET}/docs/b%20c.txt`) },
    ]);
  });

  test("B38: listObjects sends the search param", async () => {
    let body: any;
    storage()
      .post(`${STORAGE}/object/list/${BUCKET}`, (b) => {
        body = b;
        return true;
      })
      .reply(STATUS_OK, []);
    const outcome = await settle(run(act({ actionName: "listObjects", bucket: BUCKET, path: "", search: "report" }), dataSource));
    expect(outcome).toEqual({ ok: [] });
    expect(body?.search).toBe("report");
  });

  test("an empty search is not sent", async () => {
    let body: any;
    storage()
      .post(`${STORAGE}/object/list/${BUCKET}`, (b) => {
        body = b;
        return true;
      })
      .reply(STATUS_OK, []);
    await run(act({ actionName: "listObjects", bucket: BUCKET, path: "", search: "" }), dataSource);
    expect(body).not.toHaveProperty("search");
  });

  test("returnSignedUrl signs path.join(path, name) for every item and maps results by path; items without a path are skipped", async () => {
    let signBody: any;
    storage()
      .post(`${STORAGE}/object/list/${BUCKET}`)
      .reply(STATUS_OK, [{ name: "a.txt" }, { name: "b.txt" }]);
    storage()
      .post(`${STORAGE}/object/sign/${BUCKET}`, (b) => {
        signBody = b;
        return true;
      })
      .reply(STATUS_OK, [
        { path: "docs/a.txt", signedURL: `/object/sign/${BUCKET}/docs/a.txt?token=ta` },
        { signedURL: `/object/sign/${BUCKET}/docs/b.txt?token=tb` }, // no path: skipped
      ]);
    const res: any = await run(act({ actionName: "listObjects", bucket: BUCKET, path: "docs", returnSignedUrl: true }), dataSource);
    expect(signBody.paths).toEqual(["docs/a.txt", "docs/b.txt"]);
    expect(signBody.expiresIn).toBe(SIGNED_URL_SECONDS);
    expect(res[0].signedUrl).toBe(signed(`/object/sign/${BUCKET}/docs/a.txt?token=ta`));
    expect(res[1].signedUrl).toBeUndefined();
  });

  test("an empty list makes no sign call", async () => {
    storage().post(`${STORAGE}/object/list/${BUCKET}`).reply(STATUS_OK, []);
    // no sign mock: nock.disableNetConnect would fail a sign request, and pendingMocks() is checked
    expect(await run(act({ actionName: "listObjects", bucket: BUCKET, path: "", returnSignedUrl: true }), dataSource)).toEqual([]);
  });

  test("a list error is thrown", async () => {
    storage().post(`${STORAGE}/object/list/${BUCKET}`).reply(STATUS_SERVER_ERROR, { message: "list failed" });
    await expect(run(act({ actionName: "listObjects", bucket: BUCKET, path: "" }), dataSource)).rejects.toMatchObject({ __isStorageError: true });
  });

  test("a sign error is thrown", async () => {
    storage().post(`${STORAGE}/object/list/${BUCKET}`).reply(STATUS_OK, [{ name: "a.txt" }]);
    storage().post(`${STORAGE}/object/sign/${BUCKET}`).reply(STATUS_SERVER_ERROR, { message: "sign failed" });
    await expect(
      run(act({ actionName: "listObjects", bucket: BUCKET, path: "", returnSignedUrl: true }), dataSource)
    ).rejects.toMatchObject({ __isStorageError: true });
  });
});

describe("readFile", () => {
  const original = "héllo";

  test("default encoding is base64 and the content type is returned", async () => {
    storage().get(`${STORAGE}/object/${BUCKET}/dir/f.txt`).reply(STATUS_OK, Buffer.from(original), { "content-type": "text/plain" });
    const res = await run(act({ actionName: "readFile", bucket: BUCKET, fileName: "dir/f.txt" }), dataSource);
    expect(res).toEqual({ data: Buffer.from(original).toString("base64"), type: "text/plain" });
  });

  test("encoding utf8 returns the text", async () => {
    storage().get(`${STORAGE}/object/${BUCKET}/f.txt`).reply(STATUS_OK, Buffer.from(original), { "content-type": "text/plain" });
    const res: any = await run(act({ actionName: "readFile", bucket: BUCKET, fileName: "f.txt", encoding: "utf8" }), dataSource);
    expect(res.data).toBe(original);
  });

  test("transform is forwarded: the authenticated render endpoint with the query string", async () => {
    storage()
      .get(`${STORAGE}/render/image/authenticated/${BUCKET}/img.png`)
      .query({ width: "100", height: "50" })
      .reply(STATUS_OK, Buffer.from("PNG"), { "content-type": "image/png" });
    const res: any = await run(
      act({ actionName: "readFile", bucket: BUCKET, fileName: "img.png", transform: { width: 100, height: 50 } }),
      dataSource
    );
    expect(res.type).toBe("image/png");
  });

  test("an error is thrown", async () => {
    storage().get(`${STORAGE}/object/${BUCKET}/missing.txt`).reply(404, { message: "Object not found", statusCode: "404" });
    await expect(run(act({ actionName: "readFile", bucket: BUCKET, fileName: "missing.txt" }), dataSource)).rejects.toMatchObject({
      __isStorageError: true,
    });
  });
});

describe("uploadData", () => {
  const original = "héllo wörld";
  type Captured = { headers: Record<string, any>; body: string };

  function mockUpload(fileName: string, captured: Captured[]) {
    storage()
      .post(`${STORAGE}/object/${BUCKET}/${fileName}`)
      .reply(function (_uri, requestBody) {
        captured.push({ headers: this.req.headers, body: String(requestBody) });
        return [STATUS_OK, { Id: "id-1", Key: `${BUCKET}/${fileName}` }];
      });
  }

  test("the base64-decoded body is sent with the content type; signedUrl is undefined when not asked", async () => {
    const captured: Captured[] = [];
    mockUpload("up.txt", captured);
    const res = await run(
      act({ actionName: "uploadData", bucket: BUCKET, fileName: "up.txt", data: Buffer.from(original).toString("base64"), contentType: "text/plain" }),
      dataSource
    );
    expect(captured).toHaveLength(1);
    expect([captured[0].headers["content-type"]].flat()).toEqual(["text/plain"]);
    expect(captured[0].body).toBe(original);
    expect(res).toEqual({ path: "up.txt", id: "id-1", fullPath: `${BUCKET}/up.txt`, signedUrl: undefined });
  });

  test("encoding utf8 sends the text as is", async () => {
    const captured: Captured[] = [];
    mockUpload("u8.txt", captured);
    await run(act({ actionName: "uploadData", bucket: BUCKET, fileName: "u8.txt", data: original, encoding: "utf8", contentType: "text/plain" }), dataSource);
    expect(captured[0].body).toBe(original);
  });

  test("returnSignedUrl gives signedUrl from the sign endpoint", async () => {
    const captured: Captured[] = [];
    mockUpload("s.txt", captured);
    storage()
      .post(`${STORAGE}/object/sign/${BUCKET}/s.txt`)
      .reply(STATUS_OK, { signedURL: `/object/sign/${BUCKET}/s.txt?token=tok` });
    const res: any = await run(
      act({ actionName: "uploadData", bucket: BUCKET, fileName: "s.txt", data: "QQ==", contentType: "text/plain", returnSignedUrl: true }),
      dataSource
    );
    expect(res.signedUrl).toBe(signed(`/object/sign/${BUCKET}/s.txt?token=tok`));
  });

  test("an upload error is thrown", async () => {
    storage().post(`${STORAGE}/object/${BUCKET}/bad.txt`).reply(STATUS_BAD_REQUEST, { message: "Bucket not found", statusCode: "404" });
    await expect(
      run(act({ actionName: "uploadData", bucket: BUCKET, fileName: "bad.txt", data: "QQ==", contentType: "text/plain" }), dataSource)
    ).rejects.toMatchObject({ message: "Bucket not found" });
  });

  test("a transport failure is not a storage error and propagates as is", async () => {
    storage().post(`${STORAGE}/object/${BUCKET}/net.txt`).replyWithError("socket hang up");
    const err: any = await run(
      act({ actionName: "uploadData", bucket: BUCKET, fileName: "net.txt", data: "QQ==", contentType: "text/plain" }),
      dataSource
    ).catch((e) => e);
    expect(err.__isStorageError).toBeUndefined();
    expect(err.message).toContain("socket hang up");
  });
});

describe("deleteFile, createSignedUrl and unknown actions", () => {
  test("deleteFile sends DELETE with the prefixes and gives {success: true}", async () => {
    storage().delete(`${STORAGE}/object/${BUCKET}`, { prefixes: ["dir/f.txt"] }).reply(STATUS_OK, []);
    expect(await run(act({ actionName: "deleteFile", bucket: BUCKET, fileName: "dir/f.txt" }), dataSource)).toEqual({ success: true });
  });

  test("deleteFile error is thrown", async () => {
    storage().delete(`${STORAGE}/object/${BUCKET}`).reply(STATUS_SERVER_ERROR, { message: "delete failed" });
    await expect(run(act({ actionName: "deleteFile", bucket: BUCKET, fileName: "x" }), dataSource)).rejects.toMatchObject({ __isStorageError: true });
  });

  test("createSignedUrl gives {signedUrl}", async () => {
    storage()
      .post(`${STORAGE}/object/sign/${BUCKET}/dir/f.txt`)
      .reply(STATUS_OK, { signedURL: `/object/sign/${BUCKET}/dir/f.txt?token=t` });
    expect(await run(act({ actionName: "createSignedUrl", bucket: BUCKET, fileName: "dir/f.txt" }), dataSource)).toEqual({
      signedUrl: signed(`/object/sign/${BUCKET}/dir/f.txt?token=t`),
    });
  });

  test("createSignedUrl error is thrown", async () => {
    storage().post(`${STORAGE}/object/sign/${BUCKET}/x`).reply(STATUS_SERVER_ERROR, { message: "cannot sign" });
    await expect(run(act({ actionName: "createSignedUrl", bucket: BUCKET, fileName: "x" }), dataSource)).rejects.toMatchObject({ __isStorageError: true });
  });

  test("an unknown action gives undefined", async () => {
    expect(await run(act({ actionName: "nope", bucket: BUCKET }), dataSource)).toBeUndefined();
  });
});

describe("plugin run (index.ts)", () => {
  test("a storage error becomes a ServiceError carrying the storage error's message", async () => {
    storage().get(`${STORAGE}/bucket`).reply(STATUS_SERVER_ERROR, { message: "db down" });
    const direct: any = await run(act({ actionName: "listBuckets" }), dataSource).catch((e) => e);
    storage().get(`${STORAGE}/bucket`).reply(STATUS_SERVER_ERROR, { message: "db down" });
    const err = await (supabasePlugin as any).run(act({ actionName: "listBuckets" }), dataSource).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ServiceError);
    expect(err.message).toBe(direct.message);
    expect(err.message).toBe("db down");
  });

  test("a non-storage error passes through unchanged", async () => {
    storage().post(`${STORAGE}/object/${BUCKET}/net.txt`).replyWithError("socket hang up");
    const err = await (supabasePlugin as any)
      .run(act({ actionName: "uploadData", bucket: BUCKET, fileName: "net.txt", data: "QQ==", contentType: "text/plain" }), dataSource)
      .catch((e: unknown) => e);
    expect(err).not.toBeInstanceOf(ServiceError);
    expect(err.message).toContain("socket hang up");
  });
});

describe("storage error messages", () => {
  // storage-js tests `error instanceof Response` with the GLOBAL Response, while this service fetches with
  // node-fetch, whose Response is a different class. Non-2xx responses are converted to the global Response,
  // so the server's JSON error body is read instead of JSON.stringify(response), e.g. {"size":0,"timeout":0}.
  test("B36: a supabase error carries the server's message", async () => {
    storage().get(`${STORAGE}/bucket`).reply(401, { message: "Invalid API key" });
    const outcome = await settle(run(act({ actionName: "listBuckets" }), dataSource));
    expect(outcome).toEqual({ err: expect.objectContaining({ __isStorageError: true, message: "Invalid API key" }) });
  });

  const readFile = (f: string) => run(act({ actionName: "readFile", bucket: BUCKET, fileName: f }), dataSource);
  const STATUS_NOT_FOUND = 404;
  const STATUS_BAD_GATEWAY = 502;
  const STATUS_UNAVAILABLE = 503;
  const STATUS_NOT_MODIFIED = 304;
  const BAD_GATEWAY_HTML = "<html>bad gateway</html>";
  const OBJECT_PATH = (f: string) => `${STORAGE}/object/${BUCKET}/${f}`;

  test("readFile 404 carries the server's message", async () => {
    storage().get(OBJECT_PATH("missing.txt")).reply(STATUS_NOT_FOUND, { message: "Object not found" });
    await expect(readFile("missing.txt")).rejects.toMatchObject({ __isStorageError: true, message: "Object not found" });
  });

  test("readFile with a JSON error field and no message carries the error field", async () => {
    storage().get(OBJECT_PATH("e.txt")).reply(STATUS_BAD_REQUEST, { error: "invalid_jwt" });
    await expect(readFile("e.txt")).rejects.toMatchObject({ __isStorageError: true, message: "invalid_jwt" });
  });

  test("readFile with a non-JSON error body carries the text", async () => {
    storage().get(OBJECT_PATH("h.txt")).reply(STATUS_BAD_GATEWAY, BAD_GATEWAY_HTML);
    await expect(readFile("h.txt")).rejects.toMatchObject({ __isStorageError: true, message: BAD_GATEWAY_HTML });
  });

  test("readFile with an empty error body carries the status text", async () => {
    storage().get(OBJECT_PATH("n.txt")).reply(STATUS_UNAVAILABLE);
    await expect(readFile("n.txt")).rejects.toMatchObject({ __isStorageError: true, message: "Service Unavailable" });
  });

  test("a 304 is converted without a body: readFile gives the status text", async () => {
    storage().get(OBJECT_PATH("nm.txt")).reply(STATUS_NOT_MODIFIED);
    await expect(readFile("nm.txt")).rejects.toMatchObject({ __isStorageError: true, message: "Not Modified" });
  });

  test("a readFile transport failure keeps the transport message", async () => {
    storage().get(OBJECT_PATH("net.txt")).replyWithError("socket hang up");
    const err: any = await readFile("net.txt").catch((e) => e);
    expect(err.__isStorageError).toBe(true);
    expect(err.message).toContain("socket hang up");
  });

  test("a JSON action keeps the status", async () => {
    storage().get(`${STORAGE}/bucket`).reply(401, { message: "Invalid API key" });
    await expect(run(act({ actionName: "listBuckets" }), dataSource)).rejects.toMatchObject({ name: "StorageApiError", status: 401 });
  });

  test("a non-JSON error body on a JSON action is a storage error, not a crash", async () => {
    storage().get(`${STORAGE}/bucket`).reply(STATUS_BAD_GATEWAY, BAD_GATEWAY_HTML);
    const err: any = await run(act({ actionName: "listBuckets" }), dataSource).catch((e) => e);
    expect(err.__isStorageError).toBe(true);
    expect(err.message).not.toBe('{"size":0,"timeout":0}');
    expect(err.message).toMatch(/JSON/);
  });
});

describe("signed URL lifetime", () => {
  test("B10: signed URLs expire in 300 seconds", async () => {
    const bodies: any[] = [];
    storage()
      .post(`${STORAGE}/object/sign/${BUCKET}/f.txt`, (b) => {
        bodies.push(b);
        return true;
      })
      .reply(STATUS_OK, { signedURL: `/object/sign/${BUCKET}/f.txt?token=t` });
    const outcome = await settle(run(act({ actionName: "createSignedUrl", bucket: BUCKET, fileName: "f.txt" }), dataSource));
    expect(outcome).toEqual({ ok: { signedUrl: expect.any(String) } });
    expect(bodies[0]?.expiresIn).toBe(SIGNED_URL_SECONDS);
  });

  test("uploadData with returnSignedUrl signs for 300 seconds", async () => {
    let signBody: any;
    storage().post(`${STORAGE}/object/${BUCKET}/s.txt`).reply(STATUS_OK, { Id: "id-1", Key: `${BUCKET}/s.txt` });
    storage()
      .post(`${STORAGE}/object/sign/${BUCKET}/s.txt`, (b) => {
        signBody = b;
        return true;
      })
      .reply(STATUS_OK, { signedURL: `/object/sign/${BUCKET}/s.txt?token=tok` });
    await run(act({ actionName: "uploadData", bucket: BUCKET, fileName: "s.txt", data: "QQ==", contentType: "text/plain", returnSignedUrl: true }), dataSource);
    expect(signBody.expiresIn).toBe(SIGNED_URL_SECONDS);
  });
});
